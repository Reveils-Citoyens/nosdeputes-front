"""
statistiques_activite.py
========================

Calcul des statistiques de présence des députés, à partir des données brutes de
l'Assemblée nationale déjà ingérées dans MongoDB par `ND.py`.

Pourquoi ce module existe
-------------------------
Ces chiffres étaient jusqu'ici repris tels quels de l'API Tricoteuses. Ils sont
destinés à être contestés par les députés eux-mêmes : il faut donc pouvoir
justifier chaque valeur affichée, ligne à ligne, et expliquer la règle qui la
produit. D'où deux collections plutôt qu'une :

  - `statistiques_quotidiennes` : le grain élémentaire. Une ligne par
    (député, jour, indicateur), avec **les pièces justificatives** — quels
    comptes rendus, quelles réunions, quelles séances. C'est ce qui alimente la
    modale « d'où vient ce chiffre ».
  - `statistiques_hebdomadaires` : l'agrégat affiché dans le graphe d'activité,
    dérivé *uniquement* du quotidien. Le chiffre et ses pièces ne peuvent donc
    pas diverger.

Quatre indicateurs, trois unités — et c'est volontairement explicite (champ
`unite`), parce que les confondre est précisément le défaut qu'on corrige :

  - `presenceSeancePublique` — unité : **le jour**. Un député est compté présent
    un jour donné s'il a prononcé au moins une intervention d'au moins
    SEUIL_CARACTERES caractères dans un compte rendu de séance publique de ce
    jour.
  - `presenceCommission` — unité : **la réunion**. Un député est compté présent à
    une réunion si le relevé nominatif publié par l'Assemblée le déclare
    « présent ». Ce n'est pas une déduction : c'est un émargement.
  - `interventionSeancePublique` / `interventionCommission` — unité :
    **l'intervention**. Prises de parole de fond, hors conduite des débats.

Chaque ligne porte aussi son mode d'attribution (champ `attribution`), parce que
les quatre indicateurs ne se valent pas sur ce plan. Trois reposent sur un
identifiant fourni par l'Assemblée. Le quatrième, les interventions en
commission, repose sur un rapprochement de noms : ces comptes rendus ne sont pas
publiés en open data et ne portent aucun identifiant d'orateur. Le taux de
rattachement est calculé et stocké avec les chiffres (`statistiques_qualite`),
cf. resolution_orateurs.py.
"""

from __future__ import annotations

import logging
import re
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from math import ceil
from typing import Any, Iterator, NamedTuple

from pymongo import UpdateOne

import resolution_orateurs

log = logging.getLogger("statistiques")

# Une intervention plus courte que ce seuil ("Merci.", "Très bien !") ne suffit
# pas à établir une présence. Seuil repris de Tricoteuses pour que la reprise du
# calcul ne change pas les valeurs historiques sans raison explicite.
SEUIL_CARACTERES = 50

# Dates de début de législature (source : Assemblée nationale).
LEGISLATURE_DATE_DEBUT = {
    14: date(2012, 6, 20),
    15: date(2017, 6, 21),
    16: date(2022, 6, 22),
    17: date(2024, 7, 18),
}

TYPE_SEANCE_PUBLIQUE = "presenceSeancePublique"
TYPE_COMMISSION = "presenceCommission"
TYPE_INTERVENTION_SEANCE = "interventionSeancePublique"
TYPE_INTERVENTION_COMMISSION = "interventionCommission"
TYPE_AMENDEMENT = "amendementDepose"
TYPE_DOCUMENT = "documentPublie"
TYPE_QUESTION_ECRITE = "questionEcrite"
TYPE_QUESTION_ORALE = "questionOrale"

UNITES = {
    TYPE_SEANCE_PUBLIQUE: "jour",
    TYPE_COMMISSION: "reunion",
    TYPE_INTERVENTION_SEANCE: "intervention",
    TYPE_INTERVENTION_COMMISSION: "intervention",
    TYPE_AMENDEMENT: "amendement",
    TYPE_DOCUMENT: "document",
    TYPE_QUESTION_ECRITE: "question",
    TYPE_QUESTION_ORALE: "question",
}

# Fiabilité de l'attribution d'une ligne à un député, affichable telle quelle.
# La distinction ne recoupe pas séance / commission mais identifiant / nom :
# l'Assemblée fournit un `id_acteur` dans les comptes rendus de séance et un
# `acteurRef` dans les relevés de présence, alors que les comptes rendus de
# commission ne nomment les orateurs qu'en clair.
ATTRIBUTIONS = {
    TYPE_SEANCE_PUBLIQUE: "identifiant",
    TYPE_COMMISSION: "identifiant",
    TYPE_INTERVENTION_SEANCE: "identifiant",
    TYPE_INTERVENTION_COMMISSION: "rapprochement_de_nom",
    TYPE_AMENDEMENT: "identifiant",
    TYPE_DOCUMENT: "identifiant",
    TYPE_QUESTION_ECRITE: "identifiant",
    TYPE_QUESTION_ORALE: "identifiant",
}

# Réunions dont les champs n'ont, selon le schéma de l'Assemblée, aucune
# signification définie : elles ne peuvent pas fonder une présence.
ETATS_REUNION_EXCLUS = {"Annulé", "Supprimé"}

# États publiés par l'Assemblée pour un député convoqué. Tout ce qui n'est ni
# « présent » ni « excusé » est traité comme une absence — y compris l'absence
# de mention, que le schéma de l'Assemblée définit ainsi.
ETATS_PRESENCE = {"présent", "excusé", "absent"}

# Champs numériques transportés du quotidien vers l'hebdomadaire et les
# métriques, aux côtés de la valeur. Ils portent ce sans quoi le nombre affiché
# serait trompeur : le dénominateur des convocations, et les interventions
# faites en présidant, écartées du compteur principal mais jamais perdues —
# c'est ce qui évite qu'un président de séance apparaisse à zéro.
CHAMPS_ANNEXES = ("convocations", "excusees", "absences", "interventionsPresidence")

# `roledebat` vaut "president" (open data, sans accent) dans les comptes rendus
# de séance et "président" (moissonnage Tricoteuses) dans ceux de commission.
ROLES_PRESIDENCE = {"president", "président", "presidente", "présidente"}

COLLECTION_QUOTIDIENNE = "statistiques_quotidiennes"
COLLECTION_HEBDOMADAIRE = "statistiques_hebdomadaires"
COLLECTION_QUALITE = "statistiques_qualite"
COLLECTION_METRIQUES = "statistiques_metriques"
COLLECTION_DISTRIBUTIONS = "statistiques_distributions"


# ---------------------------------------------------------------------------
# Semaines de législature
# ---------------------------------------------------------------------------

def debut_semaine_zero(legislature: int) -> date:
    """
    Lundi de la semaine d'ouverture de la législature.

    Les semaines vont donc du lundi au dimanche, comme le calendrier civil et
    comme les semaines de séance de l'Assemblée.
    """
    debut = LEGISLATURE_DATE_DEBUT[legislature]
    return debut - timedelta(days=debut.weekday())


def semaine_index(legislature: int, jour: date) -> int:
    """Numéro de la semaine de `jour` depuis l'ouverture de la législature."""
    return (jour - debut_semaine_zero(legislature)).days // 7


def debut_semaine(legislature: int, index: int) -> date:
    """Lundi de la semaine `index`."""
    return debut_semaine_zero(legislature) + timedelta(days=7 * index)


# ---------------------------------------------------------------------------
# Lecture des données brutes
# ---------------------------------------------------------------------------

def parse_date_seance(valeur: Any) -> datetime | None:
    """
    Les comptes rendus horodatent la séance sous la forme `20241021160000000`
    (AAAAMMJJHHMMSSmmm). L'heure compte : une même journée peut comporter une
    séance du matin, de l'après-midi et du soir.
    """
    if not valeur:
        return None
    texte = str(valeur).strip()
    if len(texte) < 8 or not texte[:8].isdigit():
        return None
    annee, mois, jour = int(texte[:4]), int(texte[4:6]), int(texte[6:8])
    heure = int(texte[8:10]) if len(texte) >= 10 and texte[8:10].isdigit() else 0
    minute = int(texte[10:12]) if len(texte) >= 12 and texte[10:12].isdigit() else 0
    try:
        return datetime(annee, mois, jour, heure, minute)
    except ValueError:
        return None


def parse_timestamp(valeur: Any) -> datetime | None:
    """Parse un horodatage ISO 8601 de l'agenda, ramené en heure naïve."""
    if not valeur or not isinstance(valeur, str):
        return None
    try:
        parsed = datetime.fromisoformat(valeur)
    except ValueError:
        return None
    return parsed.replace(tzinfo=None) if parsed.tzinfo else parsed


_LEGISLATURE_DANS_UID = re.compile(r"L(\d{2})")


def legislature_du_compte_rendu(compte_rendu: dict) -> str | None:
    """
    Numéro de législature d'un compte rendu.

    `metadonnees.legislature` est renseigné pour la séance publique mais reste
    vide sur les comptes rendus de commission (le moissonneur ne parvient pas à
    l'extraire du HTML). L'uid, lui, le porte toujours : CRCANR5**L17**S2024…
    """
    valeur = str((compte_rendu.get("metadonnees") or {}).get("legislature") or "").strip()
    if valeur.isdigit():
        return valeur
    trouve = _LEGISLATURE_DANS_UID.search(compte_rendu.get("uid") or "")
    return trouve.group(1) if trouve else None


def texte_du_paragraphe(noeud: dict) -> str:
    """Le texte est soit une chaîne, soit `{"_": "…", "stime": "…"}`."""
    texte = noeud.get("texte")
    if isinstance(texte, dict):
        texte = texte.get("_")
    return texte if isinstance(texte, str) else ""


def iter_paragraphes(noeud: Any) -> Iterator[dict]:
    """
    Parcourt récursivement le `contenu` d'un compte rendu et rend les
    paragraphes attribués à un acteur.

    L'arborescence des comptes rendus est irrégulière (points imbriqués,
    `paragraphe` tantôt objet tantôt liste) : on descend sans présumer de sa
    forme plutôt que de coder en dur un chemin qui cassera au prochain format.
    """
    if isinstance(noeud, dict):
        if noeud.get("id_acteur") and "texte" in noeud:
            yield noeud
        for valeur in noeud.values():
            yield from iter_paragraphes(valeur)
    elif isinstance(noeud, list):
        for valeur in noeud:
            yield from iter_paragraphes(valeur)


def liste(valeur: Any) -> list:
    """L'export AN rend un objet seul quand la liste ne compte qu'un élément."""
    if valeur is None:
        return []
    return valeur if isinstance(valeur, list) else [valeur]


# ---------------------------------------------------------------------------
# Population de référence
# ---------------------------------------------------------------------------

def population_par_semaine(db: Any, legislature: int) -> dict[int, set[str]]:
    """
    Pour chaque semaine, l'ensemble des députés titulaires d'un mandat à
    l'Assemblée cette semaine-là.

    C'est la population sur laquelle sont calculées la médiane et le maximum.
    Elle varie dans le temps (démissions, remplacements, députés devenus
    ministres) et dépasse ponctuellement 577 : lors d'une semaine de
    remplacement, le sortant et l'entrant ont tous deux été députés dans la
    semaine. Les compter tous les deux est le choix le plus défendable — aucun
    des deux n'était absent, ils n'étaient simplement pas là en même temps.
    """
    semaines: dict[int, set[str]] = defaultdict(set)
    fin_legislature = date.today()

    for acteur in db.acteurs.find(
        {"mandats.mandat.typeOrgane": "ASSEMBLEE"},
        {"uid": 1, "mandats.mandat": 1},
    ):
        uid = acteur.get("uid")
        if not uid:
            continue
        for mandat in liste((acteur.get("mandats") or {}).get("mandat")):
            if not isinstance(mandat, dict):
                continue
            if mandat.get("typeOrgane") != "ASSEMBLEE":
                continue
            if str(mandat.get("legislature") or "") != str(legislature):
                continue

            debut = _parse_jour(mandat.get("dateDebut"))
            if debut is None:
                continue
            fin = _parse_jour(mandat.get("dateFin")) or fin_legislature

            index = max(0, semaine_index(legislature, debut))
            index_fin = semaine_index(legislature, fin)
            while index <= index_fin:
                semaines[index].add(uid)
                index += 1

    return semaines


def _parse_jour(valeur: Any) -> date | None:
    if not valeur or not isinstance(valeur, str):
        return None
    try:
        return date.fromisoformat(valeur[:10])
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Indicateur : présence en séance publique
# ---------------------------------------------------------------------------

def calculer_presences_seance_publique(db: Any, legislature: int) -> list[dict]:
    """
    Une ligne par (député, jour) où le député a pris la parole en séance
    publique de façon substantielle.

    `valeur` = nombre d'interventions retenues ce jour-là ; le graphe
    hebdomadaire, lui, compte les *jours*. Les deux sont conservés parce qu'ils
    répondent à deux questions différentes, et qu'afficher l'un en croyant lire
    l'autre est exactement le défaut qu'on corrige.
    """
    # (acteurUid, jour) -> {seance ISO -> {compteRenduUid, interventions}}
    accumulateur: dict[tuple[str, date], dict[str, dict]] = defaultdict(dict)

    comptes_rendus = db.comptes_rendus.find(
        {"typeCompteRendu": "seance_publique"},
        {"uid": 1, "metadonnees.dateSeance": 1, "metadonnees.legislature": 1, "contenu": 1},
    )

    lus = ignores_sans_date = 0
    for compte_rendu in comptes_rendus:
        metadonnees = compte_rendu.get("metadonnees") or {}
        if legislature_du_compte_rendu(compte_rendu) != str(legislature):
            continue

        horodatage = parse_date_seance(metadonnees.get("dateSeance"))
        if horodatage is None:
            ignores_sans_date += 1
            continue

        lus += 1
        jour = horodatage.date()
        seance = horodatage.isoformat()

        for paragraphe in iter_paragraphes(compte_rendu.get("contenu")):
            if len(texte_du_paragraphe(paragraphe)) <= SEUIL_CARACTERES:
                continue
            cle = (paragraphe["id_acteur"], jour)
            detail = accumulateur[cle].setdefault(
                seance,
                {"seance": seance, "compteRenduUid": compte_rendu["uid"], "interventions": 0},
            )
            detail["interventions"] += 1

    if ignores_sans_date:
        log.warning(
            "%d comptes rendus de séance sans dateSeance exploitable, ignorés",
            ignores_sans_date,
        )
    log.info("Séance publique : %d comptes rendus analysés", lus)

    documents = []
    for (acteur_uid, jour), details in accumulateur.items():
        document = _document_quotidien(
            legislature=legislature,
            type_statistique=TYPE_SEANCE_PUBLIQUE,
            acteur_uid=acteur_uid,
            jour=jour,
            # L'unité est le jour : une journée compte pour une, que le député
            # y ait pris la parole une fois ou quarante. Le détail du volume est
            # conservé juste en dessous, il ne se confond pas avec la présence.
            valeur=1,
            details=sorted(details.values(), key=lambda d: d["seance"]),
        )
        document["interventionsRetenues"] = sum(
            d["interventions"] for d in details.values()
        )
        documents.append(document)
    return documents


# ---------------------------------------------------------------------------
# Indicateur : présence en commission
# ---------------------------------------------------------------------------

def calculer_presences_commission(db: Any, legislature: int) -> list[dict]:
    """
    Une ligne par (député, jour) recensant les réunions où il était attendu, et
    ce que le relevé nominatif publié par l'Assemblée dit de lui.

    On conserve **toutes** les convocations, pas seulement les présences : sans
    le dénominateur, « 3 réunions » ne veut rien dire. C'est aussi ce qui permet
    de distinguer un député excusé d'un député absent, distinction que
    l'Assemblée publie et qu'il serait malhonnête d'écraser.

    Seules les réunions effectivement tenues sont comptées : ni annulées, ni
    supprimées, ni encore à venir.
    """
    accumulateur: dict[tuple[str, date], list[dict]] = defaultdict(list)
    maintenant = datetime.now()
    debut_legislature = LEGISLATURE_DATE_DEBUT[legislature]

    reunions = db.reunions.find(
        {"participants.participantsInternes.participantInterne": {"$exists": True}},
        {
            "uid": 1,
            "timeStampDebut": 1,
            "cycleDeVie.etat": 1,
            "organeReuniRef": 1,
            "compteRenduRef": 1,
            "participants.participantsInternes.participantInterne": 1,
            "ODJ.resumeODJ.item": 1,
        },
    )

    retenues = 0
    for reunion in reunions:
        etat = ((reunion.get("cycleDeVie") or {}).get("etat"))
        if etat in ETATS_REUNION_EXCLUS:
            continue

        debut = parse_timestamp(reunion.get("timeStampDebut"))
        if debut is None or debut > maintenant or debut.date() < debut_legislature:
            continue

        participants = liste(
            ((reunion.get("participants") or {}).get("participantsInternes") or {}).get(
                "participantInterne"
            )
        )
        convoques = [
            p for p in participants
            if isinstance(p, dict) and uid_acteur(p.get("acteurRef"))
        ]
        if not convoques:
            continue

        retenues += 1
        reference = {
            "reunionUid": reunion["uid"],
            "debut": debut.isoformat(),
            "organeRef": reunion.get("organeReuniRef"),
            "compteRenduRef": reunion.get("compteRenduRef"),
            "objet": ((reunion.get("ODJ") or {}).get("resumeODJ") or {}).get("item"),
        }
        for participant in convoques:
            etat = participant.get("presence")
            accumulateur[(participant["acteurRef"], debut.date())].append(
                {**reference, "etat": etat if etat in ETATS_PRESENCE else "absent"}
            )

    log.info("Commission : %d réunions tenues avec relevé de présence", retenues)

    documents = []
    for (acteur_uid, jour), details in accumulateur.items():
        comptes = Counter(d["etat"] for d in details)
        document = _document_quotidien(
            legislature=legislature,
            type_statistique=TYPE_COMMISSION,
            acteur_uid=acteur_uid,
            jour=jour,
            valeur=comptes["présent"],
            details=sorted(details, key=lambda d: d["debut"]),
        )
        # Le dénominateur voyage avec la valeur : c'est ce qui rend « 3 » lisible.
        document["convocations"] = len(details)
        document["excusees"] = comptes["excusé"]
        document["absences"] = comptes["absent"]
        documents.append(document)
    return documents


# ---------------------------------------------------------------------------
# Indicateur : interventions
# ---------------------------------------------------------------------------

def _est_presidence(paragraphe: dict) -> bool:
    """
    L'intervention est-elle faite en présidant la séance ou la réunion ?

    ⚠️ `roledebat` ne suffit pas. Dans les comptes rendus de séance publique, il
    ne vaut "president" que sur les paragraphes procéduraux (annonces de
    scrutin, appels de discussion) ; sur les prises de parole de fond
    (`PAROLE_GENERIQUE`) il est **nul**, alors même que l'orateur est
    « Mme la présidente ». S'y fier seul revient à compter les 9 485 « La parole
    est à… » de la présidente de l'Assemblée comme autant d'interventions, et à
    la faire apparaître comme la députée la plus active de l'hémicycle.

    Le libellé de l'orateur, lui, porte toujours la fonction.
    """
    if normaliser_role(paragraphe.get("roledebat")) in ROLES_PRESIDENCE:
        return True
    fonction = resolution_orateurs.fonction_de_lorateur(_nom_orateur(paragraphe))
    return fonction in ROLES_PRESIDENCE


def normaliser_role(role: Any) -> str:
    return role.strip().lower() if isinstance(role, str) else ""


def calculer_interventions_seance_publique(db: Any, legislature: int) -> list[dict]:
    """
    Prises de parole en séance publique, attribuées par `id_acteur`.

    Seules les interventions de fond sont comptées (`PAROLE_GENERIQUE`). Celles
    faites en présidant la séance sont comptabilisées à part : conduire les
    débats (« La parole est à Mme X ») n'est pas prendre position sur un texte,
    et le tour de présidence ne doit pas gonfler le compteur d'un député.
    """
    accumulateur: dict[tuple[str, date], dict] = {}

    for compte_rendu in db.comptes_rendus.find(
        {"typeCompteRendu": "seance_publique"},
        {"uid": 1, "metadonnees.dateSeance": 1, "metadonnees.legislature": 1, "contenu": 1},
    ):
        metadonnees = compte_rendu.get("metadonnees") or {}
        if legislature_du_compte_rendu(compte_rendu) != str(legislature):
            continue
        horodatage = parse_date_seance(metadonnees.get("dateSeance"))
        if horodatage is None:
            continue
        jour = horodatage.date()

        for paragraphe in iter_paragraphes(compte_rendu.get("contenu")):
            if paragraphe.get("code_grammaire") != "PAROLE_GENERIQUE":
                continue
            _ajouter_intervention(
                accumulateur,
                acteur_uid=paragraphe["id_acteur"],
                jour=jour,
                compte_rendu_uid=compte_rendu["uid"],
                presidence=_est_presidence(paragraphe),
            )

    return _documents_interventions(accumulateur, legislature, TYPE_INTERVENTION_SEANCE)


def calculer_interventions_commission(
    db: Any, legislature: int
) -> tuple[list[dict], dict]:
    """
    Prises de parole en commission, attribuées par rapprochement de noms.

    Renvoie aussi le rapport de résolution : c'est lui qui rend le chiffre
    lisible, en disant combien d'orateurs n'ont pas été rattachés et lesquels.
    """
    index, ambigus = resolution_orateurs.construire_index(
        db.acteurs.find({"mandats.mandat.typeOrgane": "ASSEMBLEE"}, {"uid": 1, "etatCivil": 1, "mandats.mandat": 1}),
        legislature,
    )
    if ambigus:
        log.warning(
            "%d homonymes écartés de l'index des députés : %s",
            len(ambigus), ", ".join(sorted(ambigus)),
        )
    log.info("Index de rapprochement : %d députés", len(index))

    resolveur = resolution_orateurs.ResolveurOrateurs(index)
    accumulateur: dict[tuple[str, date], dict] = {}
    sans_date = 0

    for compte_rendu in db.comptes_rendus.find(
        {"typeCompteRendu": "commission"},
        {"uid": 1, "seanceRef": 1, "metadonnees.dateSeance": 1,
         "metadonnees.legislature": 1, "contenu": 1},
    ):
        metadonnees = compte_rendu.get("metadonnees") or {}
        if legislature_du_compte_rendu(compte_rendu) != str(legislature):
            continue

        horodatage = parse_date_seance(metadonnees.get("dateSeance"))
        if horodatage is None:
            # Une soixantaine de comptes rendus n'ont pas de date : on la
            # récupère via la réunion à laquelle ils se rattachent plutôt que
            # de les écarter.
            horodatage = _date_via_reunion(db, compte_rendu.get("seanceRef"))
            if horodatage is None:
                sans_date += 1
                continue
        jour = horodatage.date()

        resolveur.nouveau_compte_rendu()
        for paragraphe in _paragraphes_ordonnes(compte_rendu.get("contenu")):
            if paragraphe.get("code_grammaire") != "PAROLE_GENERIQUE":
                continue
            acteur_uid = resolveur.resoudre(_nom_orateur(paragraphe))
            if acteur_uid is None:
                continue
            _ajouter_intervention(
                accumulateur,
                acteur_uid=acteur_uid,
                jour=jour,
                compte_rendu_uid=compte_rendu["uid"],
                presidence=_est_presidence(paragraphe),
            )

    if sans_date:
        log.warning("%d comptes rendus de commission sans date exploitable", sans_date)

    rapport = resolveur.rapport()
    log.info(
        "Commission : %d orateurs, %.1f %% rattachés à un député "
        "(%d par le nom, %d par la fonction)",
        rapport["total"], 100 * rapport["tauxResolution"],
        rapport["resolusParNom"], rapport["resolusParFonction"],
    )

    documents = _documents_interventions(
        accumulateur, legislature, TYPE_INTERVENTION_COMMISSION
    )
    return documents, rapport


def _date_via_reunion(db: Any, seance_ref: Any) -> datetime | None:
    if not seance_ref:
        return None
    reunion = db.reunions.find_one({"uid": seance_ref}, {"timeStampDebut": 1})
    return parse_timestamp((reunion or {}).get("timeStampDebut"))


def _nom_orateur(paragraphe: dict) -> str:
    orateurs = (paragraphe.get("orateurs") or {}).get("orateur")
    premier = liste(orateurs)[:1]
    if not premier or not isinstance(premier[0], dict):
        return ""
    return premier[0].get("nom") or ""


def _paragraphes_ordonnes(contenu: Any) -> list[dict]:
    """
    Dans l'ordre du débat : la résolution des « M. le rapporteur » s'appuie sur
    le nom cité plus tôt dans le compte rendu, l'ordre n'est donc pas neutre.
    """
    return sorted(
        iter_paragraphes_orateurs(contenu),
        key=lambda p: _entier(p.get("ordre_absolu_seance")),
    )


def _entier(valeur: Any) -> int:
    try:
        return int(valeur)
    except (TypeError, ValueError):
        return 0


def iter_paragraphes_orateurs(noeud: Any) -> Iterator[dict]:
    """Comme `iter_paragraphes`, mais pour les comptes rendus sans `id_acteur`."""
    if isinstance(noeud, dict):
        if "orateurs" in noeud:
            yield noeud
        for valeur in noeud.values():
            yield from iter_paragraphes_orateurs(valeur)
    elif isinstance(noeud, list):
        for valeur in noeud:
            yield from iter_paragraphes_orateurs(valeur)


def _ajouter_intervention(
    accumulateur: dict[tuple[str, date], dict],
    acteur_uid: str,
    jour: date,
    compte_rendu_uid: str,
    presidence: bool,
) -> None:
    entree = accumulateur.setdefault(
        (acteur_uid, jour), {"comptesRendus": {}, "presidence": 0, "total": 0}
    )
    entree["total"] += 1
    if presidence:
        entree["presidence"] += 1
    entree["comptesRendus"][compte_rendu_uid] = (
        entree["comptesRendus"].get(compte_rendu_uid, 0) + 1
    )


def _documents_interventions(
    accumulateur: dict[tuple[str, date], dict],
    legislature: int,
    type_statistique: str,
) -> list[dict]:
    documents = []
    for (acteur_uid, jour), entree in accumulateur.items():
        document = _document_quotidien(
            legislature=legislature,
            type_statistique=type_statistique,
            acteur_uid=acteur_uid,
            jour=jour,
            # La valeur affichée exclut la présidence, comptée à part juste en
            # dessous : rien n'est perdu, tout est explicite.
            valeur=entree["total"] - entree["presidence"],
            details=[
                {"compteRenduUid": uid, "interventions": n}
                for uid, n in sorted(entree["comptesRendus"].items())
            ],
        )
        document["interventionsPresidence"] = entree["presidence"]
        documents.append(document)
    return documents


def _document_quotidien(
    legislature: int,
    type_statistique: str,
    acteur_uid: str,
    jour: date,
    valeur: int,
    details: list[dict],
) -> dict:
    return {
        "uid": f"{legislature}-{type_statistique}-{acteur_uid}-{jour.isoformat()}",
        "legislature": legislature,
        "type": type_statistique,
        "unite": UNITES[type_statistique],
        # Comment la ligne a été rattachée à ce député : "identifiant" quand
        # l'Assemblée le désigne explicitement, "rapprochement_de_nom" quand il
        # a fallu l'inférer. La distinction doit rester visible jusqu'à l'écran.
        "attribution": ATTRIBUTIONS[type_statistique],
        "acteurUid": acteur_uid,
        "date": jour.isoformat(),
        "semaineIndex": semaine_index(legislature, jour),
        "valeur": valeur,
        "details": details,
    }


# ---------------------------------------------------------------------------
# Agrégation hebdomadaire
# ---------------------------------------------------------------------------

def agreger_par_semaine(
    quotidiennes: list[dict],
    legislature: int,
    type_statistique: str,
    population: dict[int, set[str]],
) -> list[dict]:
    """
    Agrège le quotidien en hebdomadaire et calcule médiane et maximum.

    La médiane porte sur **toute** la population de la semaine, députés à zéro
    compris. C'est le point qui change tout : calculée sur les seuls députés
    ayant une valeur non nulle, elle décrit le comportement des députés actifs
    et non celui de l'Assemblée, et surestime nettement le point de comparaison.
    """
    valeurs: dict[int, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    # Champs qui accompagnent la valeur et doivent être sommés avec elle : sans
    # eux, une présence en commission n'a pas de dénominateur.
    annexes: dict[int, dict[str, Counter]] = defaultdict(lambda: defaultdict(Counter))
    jours_de_seance: dict[int, set[str]] = defaultdict(set)

    for ligne in quotidiennes:
        if ligne["type"] != type_statistique:
            continue
        index = ligne["semaineIndex"]
        # Chaque ligne quotidienne est déjà exprimée dans l'unité de
        # l'indicateur : la somme est donc directe, sans cas particulier.
        valeurs[index][ligne["acteurUid"]] += ligne["valeur"]
        for champ in CHAMPS_ANNEXES:
            if champ in ligne:
                annexes[index][ligne["acteurUid"]][champ] += ligne[champ]
        if type_statistique == TYPE_SEANCE_PUBLIQUE:
            jours_de_seance[index].add(ligne["date"])

    documents: list[dict] = []
    for index in sorted(valeurs):
        par_acteur = valeurs[index]
        for acteur_uid, valeur in par_acteur.items():
            document = _document_hebdomadaire(
                legislature, type_statistique, acteur_uid, index, valeur
            )
            document.update(annexes[index][acteur_uid])
            documents.append(document)

        # Le dénominateur de la séance publique n'appartient à personne : c'est
        # le nombre de jours où l'Assemblée a siégé. On le range sous un acteur
        # conventionnel, comme la médiane et le maximum.
        if type_statistique == TYPE_SEANCE_PUBLIQUE:
            documents.append(
                _document_hebdomadaire(
                    legislature, type_statistique, "assemblee", index,
                    len(jours_de_seance[index]),
                )
            )

        # Population de référence : les députés en mandat cette semaine-là. Ceux
        # qui n'apparaissent pas dans `par_acteur` valent 0 et pèsent sur la
        # médiane, ce qui est le comportement recherché.
        membres = population.get(index) or set(par_acteur)
        serie = sorted(par_acteur.get(uid, 0) for uid in membres)
        if not serie:
            continue

        documents.append(
            _document_hebdomadaire(
                legislature, type_statistique, "median", index, _mediane(serie),
                effectif=len(serie),
            )
        )
        documents.append(
            _document_hebdomadaire(
                legislature, type_statistique, "max", index, max(par_acteur.values(), default=0),
                effectif=len(serie),
            )
        )

    return documents


def _mediane(serie_triee: list[int]) -> int:
    """Médiane basse, pour rester sur une valeur effectivement observée."""
    return serie_triee[(len(serie_triee) - 1) // 2]


def _document_hebdomadaire(
    legislature: int,
    type_statistique: str,
    acteur_uid: str,
    index: int,
    valeur: int,
    effectif: int | None = None,
) -> dict:
    document = {
        "uid": f"{legislature}-{type_statistique}-{acteur_uid}-S{index}",
        "legislature": legislature,
        "type": type_statistique,
        "unite": UNITES[type_statistique],
        "attribution": ATTRIBUTIONS[type_statistique],
        "acteurUid": acteur_uid,
        "semaineIndex": index,
        "semaineDebut": debut_semaine(legislature, index).isoformat(),
        "valeur": valeur,
    }
    if effectif is not None:
        # Nombre de députés sur lequel médiane et maximum sont calculés : sans
        # lui, la statistique n'est pas vérifiable par un tiers.
        document["effectifReference"] = effectif
    return document


# ---------------------------------------------------------------------------
# Indicateurs déposés : amendements, documents, questions
# ---------------------------------------------------------------------------
#
# Ces quatre indicateurs sont directement datés et signés dans les données de
# l'Assemblée : il n'y a ni règle de seuil ni rapprochement à faire, seulement
# à compter. Ils sont ramenés au même grain quotidien que le reste pour que les
# totaux affichés sur les cartes et le détail justificatif viennent, là encore,
# du même calcul.

def calculer_amendements(db: Any, legislature: int) -> list[dict]:
    """
    Amendements déposés, comptés à leur auteur principal.

    Les cosignataires ne sont pas comptés : un amendement cosigné par cent
    députés produirait cent amendements, et le nombre mesurerait alors
    l'appartenance à un groupe plutôt que le travail de rédaction.
    """
    lignes = []
    for amendement in db.amendements.find(
        {}, {"uid": 1, "legislature": 1, "cycleDeVie.dateDepot": 1, "signataires.auteur": 1}
    ):
        if str(amendement.get("legislature") or "") not in ("", str(legislature)):
            continue
        auteur = (amendement.get("signataires") or {}).get("auteur") or {}
        acteur_uid = uid_acteur(auteur.get("acteurRef")) if isinstance(auteur, dict) else None
        jour = _parse_jour((amendement.get("cycleDeVie") or {}).get("dateDepot"))
        if acteur_uid and jour:
            lignes.append((acteur_uid, jour, amendement["uid"]))

    return _documents_depots(lignes, legislature, TYPE_AMENDEMENT)


def calculer_documents_publies(db: Any, legislature: int) -> list[dict]:
    """
    Documents (rapports, avis, propositions de loi) signés par le député.

    Un document peut être signé par un organe — une commission — plutôt que par
    des personnes : ces auteurs-là ne sont rattachables à personne et sont donc
    ignorés.
    """
    lignes = []
    for document in db.documents.find(
        {}, {"uid": 1, "legislature": 1, "cycleDeVie.chrono.dateCreation": 1, "auteurs": 1}
    ):
        if str(document.get("legislature") or "") not in ("", str(legislature)):
            continue
        jour = _parse_jour(
            ((document.get("cycleDeVie") or {}).get("chrono") or {}).get("dateCreation")
        )
        if not jour:
            continue
        for auteur in liste((document.get("auteurs") or {}).get("auteur")):
            if not isinstance(auteur, dict):
                continue
            acteur = auteur.get("acteur")
            acteur_uid = uid_acteur(acteur.get("acteurRef")) if isinstance(acteur, dict) else None
            if acteur_uid:
                lignes.append((acteur_uid, jour, document["uid"]))

    return _documents_depots(lignes, legislature, TYPE_DOCUMENT)


def calculer_questions(db: Any, legislature: int) -> list[dict]:
    """
    Questions écrites et orales sans débat, comptées à leur auteur.

    Les questions au gouvernement (QG) sont exclues : leur attribution passe par
    les groupes, qui répartissent un contingent hebdomadaire — le compteur
    mesurerait un tour de rôle plutôt qu'une initiative.
    """
    par_type = {"QE": TYPE_QUESTION_ECRITE, "QOSD": TYPE_QUESTION_ORALE}
    lignes: dict[str, list] = {type_cible: [] for type_cible in par_type.values()}

    for question in db.questions.find(
        {}, {"uid": 1, "type": 1, "auteur.identite.acteurRef": 1, "textesQuestion": 1}
    ):
        type_cible = par_type.get(question.get("type"))
        if type_cible is None:
            continue
        acteur_uid = uid_acteur(
            ((question.get("auteur") or {}).get("identite") or {}).get("acteurRef")
        )
        jour = _parse_jour(_date_publication_question(question))
        if acteur_uid and jour:
            lignes[type_cible].append((acteur_uid, jour, question["uid"]))

    documents = []
    for type_cible, valeurs in lignes.items():
        documents += _documents_depots(valeurs, legislature, type_cible)
    return documents


def _date_publication_question(question: dict) -> str | None:
    """Date de publication au Journal officiel, seule date portée par l'objet."""
    textes = (question.get("textesQuestion") or {}).get("texteQuestion")
    for texte in liste(textes):
        if isinstance(texte, dict):
            date_jo = (texte.get("infoJO") or {}).get("dateJO")
            if date_jo:
                return date_jo
    return None


def uid_acteur(valeur: Any) -> str | None:
    """
    Un `acteurRef` absent n'est pas `null` dans l'export de l'Assemblée : c'est
    un objet `{"@xsi:nil": "true"}`. Sans ce filtre, un amendement du
    gouvernement ou d'une commission serait attribué à un pseudo-député.
    """
    return valeur if isinstance(valeur, str) and valeur.strip() else None


def _documents_depots(
    lignes: list[tuple[str, date, str]], legislature: int, type_statistique: str
) -> list[dict]:
    """Regroupe des (acteur, jour, uid) en lignes quotidiennes justifiées."""
    debut = LEGISLATURE_DATE_DEBUT[legislature]
    accumulateur: dict[tuple[str, date], list[str]] = defaultdict(list)
    for acteur_uid, jour, uid in lignes:
        if jour < debut:
            continue
        accumulateur[(acteur_uid, jour)].append(uid)

    return [
        _document_quotidien(
            legislature=legislature,
            type_statistique=type_statistique,
            acteur_uid=acteur_uid,
            jour=jour,
            valeur=len(uids),
            details=[{"uid": uid} for uid in sorted(uids)],
        )
        for (acteur_uid, jour), uids in accumulateur.items()
    ]


# ---------------------------------------------------------------------------
# Agrégation par période : les cartes de la fiche député
# ---------------------------------------------------------------------------

PERIODES = ("LEGISLATURE", "LAST_YEAR", "LAST_SIX_MONTHS")

# Mesure affichée → indicateurs quotidiens qui la composent. Les clés
# reprennent celles de l'API Tricoteuses pour que le remplacement de la source
# ne déplace pas les libellés existants.
MESURES: dict[str, tuple[str, ...]] = {
    "interventions": (TYPE_INTERVENTION_SEANCE, TYPE_INTERVENTION_COMMISSION),
    "interventions-seance-publique": (TYPE_INTERVENTION_SEANCE,),
    "interventions-commission": (TYPE_INTERVENTION_COMMISSION,),
    "presence-seance-publique": (TYPE_SEANCE_PUBLIQUE,),
    "presence-commission": (TYPE_COMMISSION,),
    "amendements": (TYPE_AMENDEMENT,),
    "documents-publies": (TYPE_DOCUMENT,),
    "questions-ecrites": (TYPE_QUESTION_ECRITE,),
    "questions-orales": (TYPE_QUESTION_ORALE,),
}


def debut_periode(periode: str, legislature: int) -> date:
    aujourdhui = date.today()
    if periode == "LAST_SIX_MONTHS":
        return aujourdhui - timedelta(days=182)
    if periode == "LAST_YEAR":
        return aujourdhui - timedelta(days=365)
    return LEGISLATURE_DATE_DEBUT[legislature]


def population_actuelle(db: Any, legislature: int) -> set[str]:
    """
    Les députés en exercice, population de référence des classements.

    Comparer un député à ses collègues du moment est le seul rapprochement
    qu'il puisse reconnaître. L'API Tricoteuses classait chacun parmi tous ceux
    ayant siégé depuis 2024 — ministres partis, remplacés, mandats de quelques
    semaines — ce qui abaissait artificiellement les seuils.
    """
    aujourdhui = date.today()
    membres: set[str] = set()

    for acteur in db.acteurs.find(
        {"mandats.mandat.typeOrgane": "ASSEMBLEE"}, {"uid": 1, "mandats.mandat": 1}
    ):
        uid = acteur.get("uid")
        if not uid:
            continue
        for mandat in liste((acteur.get("mandats") or {}).get("mandat")):
            if not isinstance(mandat, dict):
                continue
            if mandat.get("typeOrgane") != "ASSEMBLEE":
                continue
            if str(mandat.get("legislature") or "") != str(legislature):
                continue
            debut = _parse_jour(mandat.get("dateDebut"))
            fin = _parse_jour(mandat.get("dateFin"))
            if debut and debut <= aujourdhui and (fin is None or fin >= aujourdhui):
                membres.add(uid)
                break

    return membres


def calculer_metriques(
    quotidiennes: list[dict], legislature: int, population: set[str]
) -> tuple[list[dict], list[dict]]:
    """
    Totaux par député et distribution de l'Assemblée, pour chaque mesure et
    chaque période.

    Les députés sans aucune ligne valent 0 et entrent dans la distribution.
    C'est indispensable : les exclure revient à décrire les seuls députés actifs
    sur un indicateur donné, et à placer mécaniquement tout le monde plus haut
    dans le classement.
    """
    metriques: list[dict] = []
    distributions: list[dict] = []

    par_type: dict[str, list[dict]] = defaultdict(list)
    for ligne in quotidiennes:
        par_type[ligne["type"]].append(ligne)

    for mesure, types in MESURES.items():
        for periode in PERIODES:
            depuis = debut_periode(periode, legislature).isoformat()

            totaux: dict[str, int] = defaultdict(int)
            annexes: dict[str, Counter] = defaultdict(Counter)
            for type_statistique in types:
                for ligne in par_type[type_statistique]:
                    if ligne["date"] >= depuis:
                        totaux[ligne["acteurUid"]] += ligne["valeur"]
                        for champ in CHAMPS_ANNEXES:
                            if champ in ligne:
                                annexes[ligne["acteurUid"]][champ] += ligne[champ]

            for acteur_uid in population:
                valeur = totaux.get(acteur_uid, 0)
                metriques.append({
                    "uid": f"{legislature}-{mesure}-{acteur_uid}-{periode}".upper(),
                    "legislature": legislature,
                    "mesure": mesure,
                    "periode": periode,
                    "acteurUid": acteur_uid,
                    "valeur": valeur,
                    "unite": UNITES[types[0]],
                    "attribution": _attribution_mesure(types),
                    # Le dénominateur suit la valeur jusque sur la carte :
                    # « 286 réunions » se lit « sur 390 convocations ».
                    **annexes.get(acteur_uid, {}),
                })

            distributions.append(
                _distribution(
                    legislature, mesure, periode, types,
                    sorted(totaux.get(uid, 0) for uid in population),
                )
            )

    return metriques, distributions


def _attribution_mesure(types: tuple[str, ...]) -> str:
    """Une mesure composite ne vaut que par son maillon le plus faible."""
    modes = {ATTRIBUTIONS[type_statistique] for type_statistique in types}
    if len(modes) == 1:
        return modes.pop()
    return "mixte"


def _distribution(
    legislature: int, mesure: str, periode: str, types: tuple[str, ...], valeurs: list[int]
) -> dict:
    total = sum(valeurs)
    return {
        "uid": f"{legislature}-{mesure}-{periode}".upper(),
        "legislature": legislature,
        "mesure": mesure,
        "periode": periode,
        "unite": UNITES[types[0]],
        "attribution": _attribution_mesure(types),
        # Nombre de députés composant la distribution : sans lui, « dans les
        # 20 % les plus actifs » ne se vérifie pas.
        "effectifReference": len(valeurs),
        "minimum": valeurs[0] if valeurs else 0,
        "maximum": valeurs[-1] if valeurs else 0,
        "moyenne": round(total / len(valeurs)) if valeurs else 0,
        "q20": _quantile(valeurs, 0.2),
        "q40": _quantile(valeurs, 0.4),
        "q60": _quantile(valeurs, 0.6),
        "q80": _quantile(valeurs, 0.8),
        "q100": valeurs[-1] if valeurs else 0,
    }


def _quantile(valeurs_triees: list[int], ratio: float) -> int:
    """Quantile par rang, sur une valeur effectivement observée."""
    if not valeurs_triees:
        return 0
    rang = max(1, min(len(valeurs_triees), ceil(ratio * len(valeurs_triees))))
    return valeurs_triees[rang - 1]


# ---------------------------------------------------------------------------
# Écriture
# ---------------------------------------------------------------------------

def ecrire(db: Any, nom_collection: str, documents: list[dict], batch_size: int = 500) -> int:
    """Upsert idempotent : rejouer l'import ne duplique rien."""
    collection = db[nom_collection]
    total = 0
    operations = []
    for document in documents:
        operations.append(UpdateOne({"uid": document["uid"]}, {"$set": document}, upsert=True))
        if len(operations) >= batch_size:
            collection.bulk_write(operations, ordered=False)
            total += len(operations)
            operations = []
    if operations:
        collection.bulk_write(operations, ordered=False)
        total += len(operations)
    return total


def purger_obsoletes(
    db: Any, nom_collection: str, legislature: int, horodatage: datetime
) -> int:
    """
    Supprime les lignes d'une exécution précédente qui n'ont pas été recalculées.

    Sans ça, une présence retirée d'un compte rendu corrigé par l'Assemblée
    resterait affichée indéfiniment. On s'appuie sur l'horodatage de calcul
    plutôt que sur la liste des uids conservés : celle-ci compte des dizaines de
    milliers d'entrées et ferait une requête démesurée.
    """
    resultat = db[nom_collection].delete_many(
        {"legislature": legislature, "calculeLe": {"$lt": horodatage}}
    )
    return resultat.deleted_count


def creer_indexes(db: Any) -> None:
    quotidiennes = db[COLLECTION_QUOTIDIENNE]
    quotidiennes.create_index([("uid", 1)], unique=True)
    quotidiennes.create_index([("acteurUid", 1), ("type", 1), ("date", -1)])
    quotidiennes.create_index([("legislature", 1), ("type", 1), ("date", -1)])

    hebdomadaires = db[COLLECTION_HEBDOMADAIRE]
    hebdomadaires.create_index([("uid", 1)], unique=True)
    hebdomadaires.create_index([("acteurUid", 1), ("type", 1), ("semaineIndex", 1)])
    hebdomadaires.create_index([("legislature", 1), ("type", 1), ("semaineIndex", 1)])

    db[COLLECTION_QUALITE].create_index([("uid", 1)], unique=True)

    metriques = db[COLLECTION_METRIQUES]
    metriques.create_index([("uid", 1)], unique=True)
    metriques.create_index([("acteurUid", 1), ("legislature", 1)])

    distributions = db[COLLECTION_DISTRIBUTIONS]
    distributions.create_index([("uid", 1)], unique=True)
    distributions.create_index([("legislature", 1), ("periode", 1)])


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------

TOUS_LES_TYPES = (
    TYPE_SEANCE_PUBLIQUE,
    TYPE_COMMISSION,
    TYPE_INTERVENTION_SEANCE,
    TYPE_INTERVENTION_COMMISSION,
    TYPE_AMENDEMENT,
    TYPE_DOCUMENT,
    TYPE_QUESTION_ECRITE,
    TYPE_QUESTION_ORALE,
)

# Seuls les indicateurs de présence et d'intervention alimentent le graphe
# hebdomadaire ; compter des amendements par semaine n'aurait pas de sens.
TYPES_HEBDOMADAIRES = (
    TYPE_SEANCE_PUBLIQUE,
    TYPE_COMMISSION,
    TYPE_INTERVENTION_SEANCE,
    TYPE_INTERVENTION_COMMISSION,
)


class Resultat(NamedTuple):
    quotidiennes: list[dict]
    hebdomadaires: list[dict]
    metriques: list[dict]
    distributions: list[dict]
    resolution: dict


def calculer_tout(db: Any, legislature: int) -> Resultat:
    """
    Calcule tous les indicateurs, sans rien écrire.

    Séparé de l'écriture pour être vérifiable hors MongoDB
    (cf. test_statistiques_activite.py).
    """
    population = population_par_semaine(db, legislature)
    effectifs = [len(membres) for membres in population.values()] or [0]
    log.info(
        "Population de référence : %d semaines, de %d à %d députés",
        len(population), min(effectifs), max(effectifs),
    )

    interventions_commission, rapport_resolution = calculer_interventions_commission(
        db, legislature
    )
    quotidiennes = (
        calculer_presences_seance_publique(db, legislature)
        + calculer_presences_commission(db, legislature)
        + calculer_interventions_seance_publique(db, legislature)
        + interventions_commission
        + calculer_amendements(db, legislature)
        + calculer_documents_publies(db, legislature)
        + calculer_questions(db, legislature)
    )

    hebdomadaires: list[dict] = []
    for type_statistique in TYPES_HEBDOMADAIRES:
        hebdomadaires += agreger_par_semaine(
            quotidiennes, legislature, type_statistique, population
        )

    en_exercice = population_actuelle(db, legislature)
    log.info("Classements calculés sur %d députés en exercice", len(en_exercice))
    metriques, distributions = calculer_metriques(quotidiennes, legislature, en_exercice)

    return Resultat(
        quotidiennes, hebdomadaires, metriques, distributions, rapport_resolution
    )


def calculer_et_stocker(db: Any, legislature: int = 17) -> dict[str, int]:
    """Recalcule et réécrit les statistiques d'une législature."""
    log.info("▶ Statistiques d'activité — législature %d", legislature)

    resultat = calculer_tout(db, legislature)

    horodatage = datetime.now(timezone.utc)
    collections = {
        COLLECTION_QUOTIDIENNE: resultat.quotidiennes,
        COLLECTION_HEBDOMADAIRE: resultat.hebdomadaires,
        COLLECTION_METRIQUES: resultat.metriques,
        COLLECTION_DISTRIBUTIONS: resultat.distributions,
    }
    for documents in collections.values():
        for document in documents:
            document["calculeLe"] = horodatage

    creer_indexes(db)
    ecrites: dict[str, int] = {}
    supprimees = 0
    for nom_collection, documents in collections.items():
        ecrites[nom_collection] = ecrire(db, nom_collection, documents)
        supprimees += purger_obsoletes(db, nom_collection, legislature, horodatage)
    rapport_resolution = resultat.resolution

    # Le taux de rattachement des orateurs de commission est publié avec les
    # chiffres qu'il conditionne : un indicateur dont on tait la marge d'erreur
    # n'est pas défendable devant quelqu'un qui le conteste.
    ecrire(
        db,
        COLLECTION_QUALITE,
        [{
            "uid": f"{legislature}-{TYPE_INTERVENTION_COMMISSION}-resolution",
            "legislature": legislature,
            "type": TYPE_INTERVENTION_COMMISSION,
            "attribution": ATTRIBUTIONS[TYPE_INTERVENTION_COMMISSION],
            "calculeLe": horodatage,
            **rapport_resolution,
        }],
    )

    for nom_collection, nombre in ecrites.items():
        log.info("✔ %-32s %7d documents", nom_collection, nombre)
    log.info("✔ %d documents obsolètes supprimés", supprimees)
    return {
        **ecrites,
        "supprimees": supprimees,
        "tauxResolutionCommission": rapport_resolution["tauxResolution"],
    }
