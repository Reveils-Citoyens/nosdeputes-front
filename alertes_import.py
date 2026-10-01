"""
Alerte par e-mail quand l'import nocturne s'est mal passé.

Signale aussi bien une ingestion dégradée qu'un arrêt du workflow en amont
(`interrompu=True`). Une source ignorée laisse les anciens documents en base,
car ND.py procède par upserts ; les statistiques de la période peuvent alors
être incomplètes. Un échec d'envoi de l'alerte est journalisé sans provoquer
une nouvelle interruption du pipeline.

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


def signaler(
    sujet: str, anomalies: list[str], contexte: str = "", *, interrompu: bool = False
) -> bool:
    """
    Envoie une alerte et renvoie True si elle est partie.

    Ne lève jamais : un système de surveillance qui casse ce qu'il surveille est
    pire que pas de surveillance du tout. En cas d'échec d'envoi, le contenu de
    l'alerte est journalisé en ERROR — la trace reste dans les logs du job.
    """
    if not anomalies:
        return False

    corps = _rediger(sujet, anomalies, contexte, interrompu=interrompu)

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


def _rediger(
    sujet: str, anomalies: list[str], contexte: str, *, interrompu: bool = False
) -> str:
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
        (
            "L'import a échoué. Si l'échec précède l'ingestion, la base n'a pas "
            "été modifiée par cette exécution. Sinon, la mise à jour peut être "
            "partielle. Consulter les logs avant de relancer."
            if interrompu
            else "L'import continue avec les sources disponibles. Les données "
            "précédentes sont conservées pour les sources manquantes ; les "
            "statistiques peuvent être incomplètes sur la période concernée."
        ),
    ]
    return "\n".join(lignes)
