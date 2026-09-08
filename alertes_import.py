"""
Alerte par e-mail quand l'import nocturne s'est mal passé.

L'import ne s'interrompt jamais pour autant. Une nuit dégradée vaut mieux
qu'une nuit perdue : les collections MongoDB conservent les documents des
exécutions précédentes — `ND.py` ne fait que des upserts, il ne supprime rien —
donc une source manquante rend les données obsolètes, pas fausses. Le vrai
danger n'est pas la panne, c'est qu'elle passe inaperçue : la collection
`comptes_rendus` est restée vide des mois durant sans autre trace qu'un warning
au milieu de milliers de lignes de log.

D'où ce module : quelqu'un est prévenu, et le pipeline continue.

Envoi par Resend, déjà utilisé par le front pour les alertes de suivi de
dossier (cf. lib/resend.ts), via son API HTTP — `requests` est déjà une
dépendance de ND.py, inutile d'en ajouter une.

Configuration (toutes optionnelles) :
  RESEND_API_KEY        sans elle, l'alerte est seulement journalisée
  RESEND_FROM           expéditeur, défaut alertes@nosdeputes.fr
  ALERTE_IMPORT_EMAIL   destinataire, défaut samhtsan@gmail.com
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

import requests

log = logging.getLogger("alertes")

DESTINATAIRE_PAR_DEFAUT = "samhtsan@gmail.com"
EXPEDITEUR_PAR_DEFAUT = "alertes@nosdeputes.fr"
URL_RESEND = "https://api.resend.com/emails"
DELAI_MAX = 15


def signaler(sujet: str, anomalies: list[str], contexte: str = "") -> bool:
    """
    Envoie une alerte et renvoie True si elle est partie.

    Ne lève jamais : un système de surveillance qui casse ce qu'il surveille est
    pire que pas de surveillance du tout. En cas d'échec d'envoi, le contenu de
    l'alerte est journalisé en ERROR — la trace reste dans les logs du job.
    """
    if not anomalies:
        return False

    corps = _rediger(sujet, anomalies, contexte)

    # Journalisé dans tous les cas, y compris quand l'envoi réussit : les logs
    # du job restent la source de vérité si la boîte mail est perdue.
    for anomalie in anomalies:
        log.error("⚠ %s", anomalie)

    cle = os.environ.get("RESEND_API_KEY")
    if not cle:
        log.warning(
            "RESEND_API_KEY absente : alerte « %s » non envoyée, seulement "
            "journalisée ci-dessus.",
            sujet,
        )
        return False

    destinataire = os.environ.get("ALERTE_IMPORT_EMAIL", DESTINATAIRE_PAR_DEFAUT)
    expediteur = os.environ.get("RESEND_FROM", EXPEDITEUR_PAR_DEFAUT)

    try:
        reponse = requests.post(
            URL_RESEND,
            headers={
                "Authorization": f"Bearer {cle}",
                "Content-Type": "application/json",
            },
            json={
                "from": expediteur,
                "to": [destinataire],
                "subject": f"[NosDéputés] {sujet}",
                "text": corps,
            },
            timeout=DELAI_MAX,
        )
    except requests.RequestException as erreur:
        log.error("Envoi de l'alerte impossible : %s", erreur)
        return False

    if not reponse.ok:
        log.error(
            "Resend a refusé l'alerte (%d) : %s", reponse.status_code, reponse.text[:500]
        )
        return False

    log.info("Alerte « %s » envoyée à %s", sujet, destinataire)
    return True


def _rediger(sujet: str, anomalies: list[str], contexte: str) -> str:
    horodatage = datetime.now(timezone.utc).strftime("%d/%m/%Y à %H:%M UTC")
    lignes = [
        sujet,
        "",
        f"Import nocturne du {horodatage}.",
        "",
        f"{len(anomalies)} anomalie{'s' if len(anomalies) > 1 else ''} :",
        "",
    ]
    lignes += [f"  · {anomalie}" for anomalie in anomalies]
    if contexte:
        lignes += ["", "---", "", contexte.strip()]
    lignes += [
        "",
        "---",
        "",
        "L'import n'a pas été interrompu. Les collections conservent les données "
        "des exécutions précédentes : les chiffres affichés sont donc obsolètes "
        "sur les sources concernées, pas erronés.",
    ]
    return "\n".join(lignes)
