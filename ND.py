
import os
from urllib.parse import quote

from pymongo import MongoClient
from pprint import pprint

from bs4 import BeautifulSoup
import requests
import sys
import time

MONGO_URI = os.environ.get("MONGO_URI")

print(f"DEBUG: Type de MONGO_URI = {type(MONGO_URI)}")
print(f"DEBUG: Début de l'URI reçu par GitHub = {str(MONGO_URI)[:15]}...")

client_ = MongoClient(MONGO_URI)


### UTILS

def iter_json_files(directory: Path) -> Generator[dict, None, None]:
    """Itère sur tous les fichiers .json d'un répertoire (récursif)."""
    if not directory.exists():
        log.warning("Répertoire introuvable : %s", directory)
        return
    for path in sorted(directory.rglob("*.json")):
        try:
            with open(path, encoding="utf-8") as f:
                data = json.load(f)
            yield data
        except json.JSONDecodeError as e:
            log.error("JSON invalide (%s) : %s", path.name, e)
        except OSError as e:
            log.error("Lecture impossible (%s) : %s", path.name, e)

### Main - ajout dans mongo des données Tricoteuses Assemblée

"""
ingest_tricoteuses.py
---------------------
Ingestion des données open data Tricoteuses (Assemblée nationale + Sénat)
dans une base MongoDB.

Prérequis :
    pip install pymongo

Structure attendue du répertoire de données (après clean_data) :
    assemblee-data/
        ActeursEtOrganes_XVI_nettoye/
            acteurs/    ← fichiers PA*.json
            organes/    ← fichiers PO*.json
        Scrutins_XVI_nettoye/
            scrutins/   ← fichiers VTANR5*.json
        Amendements_XVI_nettoye/
            amendements/ ← fichiers ...
        DossiersLegislatifs_XVI_nettoye/
            dossiers/   ← fichiers ...
        Reunions_XVI_nettoye/
            reunions/   ← fichiers ...
        Questions_XVI_nettoye/
            questions/  ← fichiers ...
    senat-data/
        ...             ← même structure

Usage :
    python ingest_tricoteuses.py \
        --assemblee-data ./assemblee-data \
        --senat-data ./senat-data \
        --mongo-uri mongodb://localhost:27017 \
        --db parlement \
        --legislature 16 \
        --categories acteurs organes scrutins \
        --batch-size 500
"""

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Generator, Any

from pymongo import MongoClient, UpdateOne
from pymongo.collection import Collection
from pymongo.errors import BulkWriteError

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("tricoteuses")


# ---------------------------------------------------------------------------
# Helpers génériques
# ---------------------------------------------------------------------------

def flatten_uid(doc: dict) -> dict:
    """Remplace uid: {"#text": "PA123"} par uid: "PA123"."""
    if isinstance(doc.get("uid"), dict):
        doc["uid"] = doc["uid"].get("#text", doc["uid"])
    return doc


def upsert_batch(collection: Collection, docs: list[dict], id_field: str = "uid") -> int:
    """
    Upsert d'un batch de documents dans la collection.
    Utilise l'uid comme clé de déduplication pour être idempotent.
    Retourne le nombre de docs traités.
    """
    if not docs:
        return 0
    operations = [
        UpdateOne(
            {id_field: doc[id_field]},
            {"$set": doc},
            upsert=True,
        )
        for doc in docs
        if id_field in doc
    ]
    if not operations:
        return 0
    try:
        result = collection.bulk_write(operations, ordered=False)
        return result.upserted_count + result.modified_count
    except BulkWriteError as e:
        log.error("BulkWriteError : %s erreurs", len(e.details.get("writeErrors", [])))
        return 0


def ingest_category(
    collection: Collection,
    data_dir: Path,
    label: str,
    id_field: str = "uid",
    batch_size: int = 500,
) -> None:
    """
    Parcourt data_dir, charge les JSON et les upserte en batch dans collection.
    """
    log.info("▶ %s → collection '%s'", label, collection.name)
    batch: list[dict] = []
    total = 0

    for doc in iter_json_files(data_dir):
        # Certains fichiers Tricoteuses encapsulent le vrai objet sous une clé
        # (ex : {"acteur": {...}}, {"scrutin": {...}}). On les déplie.
        if len(doc) == 1:
            doc = next(iter(doc.values()))
        doc = flatten_uid(doc)

        batch.append(doc)
        if len(batch) >= batch_size:
            total += upsert_batch(collection, batch, id_field)
            log.info("  … %d documents traités", total)
            batch.clear()

    if batch:
        total += upsert_batch(collection, batch, id_field)

    log.info("✔ %s : %d documents chargés", label, total)


# ---------------------------------------------------------------------------
# Mapping catégorie → (sous-répertoire dans data_dir, nom collection, id_field)
# ---------------------------------------------------------------------------

def build_assemblee_categories(data_dir: Path, legislature: str) -> dict[str, tuple]:
    leg_roman = {"14": "XIV", "15": "XV", "16": "XVI", "17": "XVII"}[legislature]

    return {
        "acteurs": (
            data_dir / f"AMO20_dep_sen_min_tous_mandats_et_organes_{leg_roman}.json" / "acteur",
            "acteurs", "uid",
        ),
        "organes": (
            data_dir / f"AMO20_dep_sen_min_tous_mandats_et_organes_{leg_roman}.json" / "organe",
            "organes", "uid",
        ),
        "scrutins": (
            data_dir / f"Scrutins_{leg_roman}.json",  # fichiers .json directement à la racine
            "scrutins", "uid",
        ),
        "amendements": (
            data_dir / f"Amendements_{leg_roman}.json",  # sous-dossiers par texte, rglob() les trouve
            "amendements", "uid",
        ),
        "dossiers": (
            data_dir / f"Dossiers_Legislatifs_{leg_roman}.json" / "dossierParlementaire",
            "dossiers", "uid",
        ),
        "documents": (
            data_dir / f"Dossiers_Legislatifs_{leg_roman}.json" / "document",
            "documents", "uid",
        ),
        "reunions": (
            data_dir / f"Agenda_{leg_roman}.json" / "reunion",
            "reunions", "uid",
        ),
        "questions_gouvernement": (
            data_dir / f"Questions_gouvernement_{leg_roman}.json",
            "questions", "uid",
        ),
        "questions_orales": (
            data_dir / f"Questions_orales_{leg_roman}.json",
            "questions", "uid",
        ),
        "questions_ecrites": (
            data_dir / f"Questions_ecrites_{leg_roman}.json",
            "questions", "uid",
        ),
    }

def build_senat_categories(data_dir: Path) -> dict[str, tuple]:
    """
    Retourne un dict { clé_catégorie : (Path, collection_name, id_field) }
    pour le Sénat (structure de répertoires Tricoteuses-Sénat).
    """
    return {
        "senat_acteurs": (
            data_dir / "acteurs_nettoye",
            "senat_acteurs",
            "uid",
        ),
        "senat_organes": (
            data_dir / "organes_nettoye",
            "senat_organes",
            "uid",
        ),
        "senat_amendements": (
            data_dir / "amendements_nettoye",
            "senat_amendements",
            "uid",
        ),
        "senat_dossiers": (
            data_dir / "dossiers_nettoye",
            "senat_dossiers",
            "uid",
        ),
    }


# ---------------------------------------------------------------------------
# Index MongoDB recommandés
# ---------------------------------------------------------------------------

def ensure_indexes(db: Any) -> None:
    """Crée les index de base sur chaque collection."""
    index_map = {
        "acteurs":           [("uid", 1), ("etatCivil.ident.nom", 1)],
        "organes":           [("uid", 1), ("codeType", 1)],
        "scrutins":          [("uid", 1), ("dateScrutin", -1)],
        "amendements":       [("uid", 1), ("texteLegislatifRef", 1)],
        "dossiers":          [("uid", 1), ("legislature", 1)],
        "reunions":          [("uid", 1), ("timestampDebut", -1)],
        "questions":         [("uid", 1), ("type", 1)],
        "senat_acteurs":     [("uid", 1)],
        "senat_organes":     [("uid", 1)],
        "senat_amendements": [("uid", 1)],
        "senat_dossiers":    [("uid", 1)],
    }
    for coll_name, indexes in index_map.items():
        coll = db[coll_name]
        for field, direction in indexes:
            try:
                coll.create_index([(field, direction)], background=True)
            except Exception as e:
                log.warning("Index non créé (%s.%s) : %s", coll_name, field, e)
    log.info("✔ Index créés")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Ingestion des données Tricoteuses dans MongoDB"
    )
    parser.add_argument(
        "--assemblee-data",
        type=Path,
        default=Path("./assemblee-data"),
        help="Répertoire local des données Assemblée (défaut: ./assemblee-data)",
    )
    parser.add_argument(
        "--senat-data",
        type=Path,
        default=None,
        help="Répertoire local des données Sénat (optionnel)",
    )
    parser.add_argument(
        "--mongo-uri",
        default="mongodb://localhost:27017",
        help="URI MongoDB (défaut: mongodb://localhost:27017)",
    )
    parser.add_argument(
        "--db",
        default="parlement",
        help="Nom de la base MongoDB (défaut: parlement)",
    )
    parser.add_argument(
        "--legislature",
        default="16",
        choices=["14", "15", "16", "17"],
        help="Numéro de législature (défaut: 16)",
    )
    parser.add_argument(
        "--categories",
        nargs="+",
        default=["acteurs", "organes", "scrutins"],
        help=(
            "Catégories à charger. Assemblée : acteurs organes scrutins "
            "amendements dossiers reunions questions. "
            "Sénat : senat_acteurs senat_organes senat_amendements senat_dossiers. "
            "(défaut: acteurs organes scrutins)"
        ),
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Taille des batches d'upsert (défaut: 500)",
    )
    parser.add_argument(
        "--skip-indexes",
        action="store_true",
        help="Ne pas créer les index MongoDB",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Point d'entrée
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    # Connexion MongoDB
    log.info("Connexion à MongoDB : %s / base '%s'", args.mongo_uri, args.db)
    try:
        # client = MongoClient(args.mongo_uri, serverSelectionTimeoutMS=5000)
        client = client_
        client.server_info()  # lève une exception si MongoDB est inaccessible
    except Exception as e:
        log.error("Impossible de se connecter à MongoDB : %s", e)
        sys.exit(1)

    db = client[args.db]

    # Index
    if not args.skip_indexes:
        ensure_indexes(db)

    # Catégories disponibles
    all_categories = build_assemblee_categories(args.assemblee_data, args.legislature)
    if args.senat_data:
        all_categories.update(build_senat_categories(args.senat_data))

    # Filtrage selon --categories
    unknown = set(args.categories) - set(all_categories)
    if unknown:
        log.error("Catégories inconnues : %s", unknown)
        log.info("Disponibles : %s", list(all_categories.keys()))
        sys.exit(1)

    # Ingestion
    for cat_key in args.categories:
        data_path, coll_name, id_field = all_categories[cat_key]
        ingest_category(
            collection=db[coll_name],
            data_dir=data_path,
            label=cat_key,
            id_field=id_field,
            batch_size=args.batch_size,
        )

    client.close()
    log.info("✅ Ingestion terminée.")

#####


#### Ajout de HeatScore et autres agrégats

client = client_

"""
Cellule notebook : pré-calcule heat score + agrégats utiles sur DossierLegislatif.

Prérequis dans le notebook :
  - `client` : une instance pymongo MongoClient déjà connectée.

Champs écrits sur chaque dossier (tous via $set → idempotent, ré-exécutable
sans accumulation) :
  - heatScore (0-1)
  - heatComponents (détail signaux)
  - procedureAcceleree (bool)
  - currentStage (str | null)         — ex. "1re lecture Assemblée nationale"
  - currentStatus (str)               — "promulgue" | "adopte" | "rejete" | "en_cours"
  - derniereDecision ({date, sort, scrutinUid} | null)
  - dossierBadge (str)                — badge UI mutuellement exclusif :
       "promulgue" > "rejete" > "retire" > "caduc"
     > "actif" > "en_pause" > "en_cours" > "inactif"
  - heatComputedAt (timestamp UTC)
"""

import math
from datetime import datetime, timezone
from pymongo import UpdateOne

# ─── Paramètres ──────────────────────────────────────────────────────────────
DB_NAME = "parlement"
LEGISLATURE = "17"
BATCH_SIZE = 200
LIMIT = 0  # 0 = tous

WEIGHTS = {
    "amendements_density": 0.40,
    "debate_breadth": 0.30,
    "political_tension": 0.30,
}
SCALE = {
    "amendements_density": 30,
    "debate_breadth": 50,
    "political_tension": 0.30,
}
RECENCY_HALFLIFE_DAYS = 60

# Seuils pour le badge UI
HEAT_BADGE_THRESHOLD = 0.30   # heatScore >= → "actif"
EN_PAUSE_DAYS = 120           # last acte commission + > N jours → "en_pause"
EN_COURS_DAYS = 120           # last acte < N jours (et pas actif) → "en_cours"

# Mapping codeActe → étape lisible.
# Le préfixe avant le premier tiret donne la phase principale.
STAGE_LABELS = {
    "AN1":    "1re lecture Assemblée nationale",
    "SN1":    "1re lecture Sénat",
    "AN2":    "2e lecture Assemblée nationale",
    "SN2":    "2e lecture Sénat",
    "AN3":    "3e lecture Assemblée nationale",
    "SN3":    "3e lecture Sénat",
    "ANNL":   "Nouvelle lecture Assemblée nationale",
    "SNNL":   "Nouvelle lecture Sénat",
    "CMP":    "Commission mixte paritaire",
    "ANLDEF": "Lecture définitive Assemblée nationale",
    "CC":     "Conseil constitutionnel",
    "PROM":   "Promulgation",
}

db = client[DB_NAME]  # noqa: F821


# ─── Walk recursif des actesLegislatifs ──────────────────────────────────────

def walk_actes(actes_container):
    if not actes_container:
        return
    inner = actes_container.get("acteLegislatif") if isinstance(actes_container, dict) else None
    if not inner:
        return
    if isinstance(inner, dict):
        inner = [inner]
    for a in inner:
        if not isinstance(a, dict):
            continue
        yield a
        yield from walk_actes(a.get("actesLegislatifs"))


def extract_links(dossier):
    """Collecte uids textes, scrutins, dates et codes d'actes."""
    texte_uids, scrutin_uids = set(), set()
    actes_summary = []  # list of {codeActe, dateActe}
    for a in walk_actes(dossier.get("actesLegislatifs")):
        t = a.get("texteAssocie")
        if isinstance(t, str) and t:
            texte_uids.add(t)
        votes = a.get("voteRefs")
        if isinstance(votes, dict):
            vr = votes.get("voteRef")
            if isinstance(vr, str) and vr:
                scrutin_uids.add(vr)
            elif isinstance(vr, list):
                for v in vr:
                    if isinstance(v, str) and v:
                        scrutin_uids.add(v)
        code = a.get("codeActe")
        date = a.get("dateActe")
        nom = a.get("nomCanonique") or a.get("libelle") or ""
        if isinstance(code, str) and code:
            actes_summary.append({"code": code, "date": date if isinstance(date, str) else None, "nom": nom})
    return texte_uids, scrutin_uids, actes_summary


# ─── Helpers numériques ──────────────────────────────────────────────────────

def parse_iso_date(s):
    if not s or not isinstance(s, str):
        return None
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except Exception:
            return None


def recency_multiplier(date_str):
    dt = parse_iso_date(date_str)
    if dt is None:
        return 0.05
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    age_days = (datetime.now(timezone.utc) - dt).total_seconds() / 86400
    return math.exp(-age_days / RECENCY_HALFLIFE_DAYS)


def days_since(date_str):
    dt = parse_iso_date(date_str)
    if dt is None:
        return float("inf")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - dt).total_seconds() / 86400


def normalize(value, scale):
    return 0.0 if scale <= 0 else min(1.0, value / scale)


def _to_int(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return 0


# ─── Signaux heat ────────────────────────────────────────────────────────────

def compute_amendements_signals(texte_uids):
    if not texte_uids:
        return {"total": 0, "n_articles": 0, "n_auteurs": 0, "density": 0.0}
    pipeline = [
        {"$match": {"texteLegislatifRef": {"$in": list(texte_uids)}}},
        {"$group": {
            "_id": None,
            "total": {"$sum": 1},
            "articles": {"$addToSet": "$pointeurFragmentTexte.division.articleDesignation"},
            "auteurs": {"$addToSet": "$signataires.auteur.acteurRef"},
        }},
    ]
    agg = next(db.amendements.aggregate(pipeline), None)
    if not agg:
        return {"total": 0, "n_articles": 0, "n_auteurs": 0, "density": 0.0}
    n_articles = sum(1 for a in agg["articles"] if isinstance(a, str) and a)
    n_auteurs = sum(1 for a in agg["auteurs"] if isinstance(a, str) and a)
    density = agg["total"] / n_articles if n_articles > 0 else 0.0
    return {"total": agg["total"], "n_articles": n_articles,
            "n_auteurs": n_auteurs, "density": density}


def compute_political_tension(scrutin_uids):
    if not scrutin_uids:
        return {"tension": 0.0, "scrutins": 0, "dissidents": 0, "total_votes": 0,
                "derniere_decision": None}
    total_dissidents = total_votes = nb_scrutins = 0
    derniere = None  # {date, sort, uid}
    cursor = db.scrutins.find(
        {"uid": {"$in": list(scrutin_uids)}},
        {"uid": 1, "dateScrutin": 1, "sort": 1, "ventilationVotes": 1},
    )
    for s in cursor:
        nb_scrutins += 1

        # Suivi de la décision la plus récente (par dateScrutin)
        d = s.get("dateScrutin")
        sort_code = (s.get("sort") or {}).get("code")
        if isinstance(d, str) and sort_code:
            if derniere is None or d > derniere["date"]:
                derniere = {"date": d, "sort": sort_code, "uid": s["uid"]}

        # Calcul dissidence
        ventil = (s.get("ventilationVotes") or {}).get("organe") or {}
        groupes = (ventil.get("groupes") or {}).get("groupe", [])
        if isinstance(groupes, dict):
            groupes = [groupes]
        for g in groupes:
            if not isinstance(g, dict):
                continue
            vote = g.get("vote") or {}
            pos_maj = vote.get("positionMajoritaire")
            if pos_maj not in ("pour", "contre", "abstention"):
                continue
            dv = vote.get("decompteVoix") or {}
            pour = _to_int(dv.get("pour"))
            contre = _to_int(dv.get("contre"))
            absten = _to_int(dv.get("abstentions"))
            exprimes = pour + contre + absten
            if exprimes < 2:
                continue
            in_majority = {"pour": pour, "contre": contre, "abstention": absten}[pos_maj]
            total_votes += exprimes
            total_dissidents += exprimes - in_majority

    tension = total_dissidents / total_votes if total_votes > 0 else 0.0
    return {"tension": tension, "scrutins": nb_scrutins,
            "dissidents": total_dissidents, "total_votes": total_votes,
            "derniere_decision": derniere}


# ─── Agrégats supplémentaires ────────────────────────────────────────────────

def is_procedure_acceleree(dossier):
    pp = dossier.get("procedureParlementaire") or {}
    if not isinstance(pp, dict):
        return False
    libelle = (pp.get("libelle") or "").lower()
    return "accélér" in libelle or "accelere" in libelle


def latest_act(actes_summary):
    """Retourne l'acte avec la dateActe la plus récente, ou None."""
    with_dates = [a for a in actes_summary if a["date"]]
    if not with_dates:
        return None
    return max(with_dates, key=lambda a: a["date"])


def derive_stage(actes_summary):
    """Étape lisible déduite du préfixe codeActe de l'acte le plus récent."""
    latest = latest_act(actes_summary)
    if not latest:
        return None
    code = latest["code"]
    prefix = code.split("-")[0]
    return STAGE_LABELS.get(prefix, prefix)


def _has_retrait_act(actes_summary):
    """True si un acte de retrait est présent dans la chronologie (via code ou nomCanonique)."""
    for a in actes_summary:
        if "RETRAIT" in (a.get("code") or "").upper():
            return True
        if "retrait" in (a.get("nom") or "").lower():
            return True
    return False


def _has_final_decision_act(actes_summary):
    """
    True si le dossier a un acte de décision *final* :
      - ANLUNI-DEBATS-DEC : lecture unique (résolutions — pas de navette)
      - ANLDEF-DEBATS-DEC : lecture définitive (lois après échec CMP)
    Pour les lois en navette classique, un vote "adopté" intermédiaire ne suffit
    pas à considérer le texte comme définitivement adopté — il faut PROM.
    """
    full_codes = {a["code"] for a in actes_summary}
    return (
        "ANLUNI-DEBATS-DEC" in full_codes
        or "ANLDEF-DEBATS-DEC" in full_codes
    )


def derive_status(actes_summary, derniere_decision):
    """
    Statut macro :
      - "promulgue" si un acte PROM est présent
      - "rejete" si la dernière décision a un sort = rejeté/refusé
      - "adopte" si la dernière décision = adopté ET le dossier a un acte de
        décision finale (ANLUNI/ANLDEF). Sinon "en_cours".
    """
    codes = {a["code"].split("-")[0] for a in actes_summary}
    if "PROM" in codes:
        return "promulgue"
    if derniere_decision:
        sort = (derniere_decision.get("sort") or "").lower()
        if "rejet" in sort or "refus" in sort:
            return "rejete"
        if ("adopt" in sort or "valid" in sort) and _has_final_decision_act(actes_summary):
            return "adopte"
    if _has_retrait_act(actes_summary):
        return "retire"
    return "en_cours"


def derive_badge(
    actes_summary,
    derniere_decision,
    dossier_legislature,
    current_legislature,
    heat_score,
):
    """
    Badge UI mutuellement exclusif, par ordre de priorité décroissante :
      1. "promulgue"  : un acte PROM est présent
      2. "rejete"     : dernière décision = rejet/refus
      3. "retire"     : dernière décision = retrait
      4. "adopte"     : dernière décision = adopté/validé ET le dossier a un
                        acte de décision finale (ANLUNI-DEBATS-DEC pour les
                        résolutions, ANLDEF-DEBATS-DEC pour les lois en lecture
                        définitive). Pour les lois en navette classique, un
                        vote "adopté" intermédiaire ne déclenche pas ce badge.
      5. "caduc"      : légis < courante ET pas de statut final
      6. "actif"      : heatScore >= seuil (priorité sur "en_pause")
      7. "en_pause"   : dernier acte est de type commission ET > EN_PAUSE_DAYS
      8. "en_cours"   : dernier acte < EN_COURS_DAYS
      9. "inactif"    : default
    """
    codes = {a["code"].split("-")[0] for a in actes_summary}

    if "PROM" in codes:
        return "promulgue"

    if derniere_decision:
        sort = (derniere_decision.get("sort") or "").lower()
        if "rejet" in sort or "refus" in sort:
            return "rejete"
        if "retir" in sort:
            return "retire"
        if ("adopt" in sort or "valid" in sort) and _has_final_decision_act(actes_summary):
            return "adopte"

    # Retrait détecté via acte (initiatives retirées sans scrutin associé)
    if _has_retrait_act(actes_summary):
        return "retire"

    # Caduc : légis passée, pas de statut final
    if (
        dossier_legislature
        and current_legislature
        and dossier_legislature != current_legislature
    ):
        return "caduc"

    if heat_score >= HEAT_BADGE_THRESHOLD:
        return "actif"

    latest = latest_act(actes_summary)
    if not latest:
        return "inactif"

    last_date_str = latest.get("date")
    days_ago = days_since(last_date_str)

    # En pause : dernier acte = commission AND > 120j sans mouvement
    last_code = (latest.get("code") or "").upper()
    is_commission = "COM" in last_code  # COMFOND, COMSAISI, COMNL, etc.
    if days_ago > EN_PAUSE_DAYS and is_commission:
        return "en_pause"

    if days_ago < EN_COURS_DAYS:
        return "en_cours"

    return "inactif"


# ─── Composition ─────────────────────────────────────────────────────────────

def compute_score(dossier):
    texte_uids, scrutin_uids, actes_summary = extract_links(dossier)
    last_date = (latest_act(actes_summary) or {}).get("date")

    amend = compute_amendements_signals(texte_uids)
    tension = compute_political_tension(scrutin_uids)

    raw_score = (
        WEIGHTS["amendements_density"] * normalize(amend["density"], SCALE["amendements_density"])
        + WEIGHTS["debate_breadth"] * normalize(amend["n_auteurs"], SCALE["debate_breadth"])
        + WEIGHTS["political_tension"] * normalize(tension["tension"], SCALE["political_tension"])
    )
    multiplier = recency_multiplier(last_date)
    final_score = round(raw_score * multiplier, 4)

    badge = derive_badge(
        actes_summary,
        tension["derniere_decision"],
        dossier_legislature=dossier.get("legislature"),
        current_legislature=LEGISLATURE,
        heat_score=final_score,
    )

    return {
        "heatScore": final_score,
        "heatComponents": {
            "n_textes": len(texte_uids),
            "n_scrutins": len(scrutin_uids),
            "amendements_total": amend["total"],
            "amendements_density": round(amend["density"], 2),
            "n_articles_touches": amend["n_articles"],
            "n_auteurs_uniques": amend["n_auteurs"],
            "tension": round(tension["tension"], 3),
            "votes_dissidents": tension["dissidents"],
            "votes_total_exprimes": tension["total_votes"],
            "scrutins_analyses": tension["scrutins"],
            "last_acte_date": last_date,
            "recency_multiplier": round(multiplier, 3),
            "raw_score": round(raw_score, 4),
        },
        "procedureAcceleree": is_procedure_acceleree(dossier),
        "currentStage": derive_stage(actes_summary),
        "currentStatus": derive_status(actes_summary, tension["derniere_decision"]),
        "derniereDecision": tension["derniere_decision"],  # {date, sort, uid} ou None
        "dossierBadge": badge,
        "heatComputedAt": datetime.now(timezone.utc),
    }


# ─── Exécution ────────────────────────────────────────────────────────────────

## Commençons par charger les données de la législature courante pour avoir des dossiers à mettre à jour.
sys.argv = [
    "ingest_tricoteuses.py",
    "--assemblee-data", "./assemblee-data",
    "--legislature", "17",
    "--categories", "questions_orales", "questions_ecrites", "questions_gouvernement", "amendements", "reunions", "dossiers", "reunions", "scrutins" , "acteurs", "organes"
]
main()

# Ensuite, on peut calculer les heat scores + agrégats sur tous les dossiers (ou limiter à N pour tester).

# On itère sur TOUTES les législatures pour pouvoir marquer "caduc" les
# dossiers des législatures passées. LEGISLATURE sert de référence "courante".
# Inclut tous les types de dossiers (DossierLegislatif_Type, DossierResolutionAN,
# DossierMissionControle_Type, DossierMissionInformation_Type,
# DossierCommissionEnquete_Type, DossierIniativeExecutif_Type, …) mais exclut
# les documents annexes (texteLoi_Type, rapportParlementaire_Type, etc.).
query = {"@xsi:type": {"$regex": "^Dossier"}}
total = db.dossiers.count_documents(query)
print(f"Computing heat scores + aggregates for {total} dossiers (db={DB_NAME}, current legislature={LEGISLATURE})…")

cursor = db.dossiers.find(query)
if LIMIT > 0:
    cursor = cursor.limit(LIMIT)
    total = min(total, LIMIT)

ops, processed = [], 0
for dossier in cursor:
    ops.append(UpdateOne({"uid": dossier["uid"]}, {"$set": compute_score(dossier)}))
    if len(ops) >= BATCH_SIZE:
        db.dossiers.bulk_write(ops, ordered=False)
        ops = []
    processed += 1
    if processed % 100 == 0:
        print(f"  {processed}/{total}")
if ops:
    db.dossiers.bulk_write(ops, ordered=False)

# Index utiles (create_index est idempotent)
db.dossiers.create_index([("heatScore", -1)])
db.dossiers.create_index([("currentStatus", 1), ("heatScore", -1)])
db.dossiers.create_index([("dossierBadge", 1), ("heatScore", -1)])
db.dossiers.create_index([("procedureAcceleree", 1), ("heatScore", -1)])

print(f"Done — {processed} dossiers updated.\n")

# ─── Dénormalisation enrichissement → dossiers ───────────────────────────────
# Copie keywords + themes_senat de dossiers_enrichis vers dossiers pour
# permettre leur indexation dans Atlas Search sans cross-collection join.

print("Denormalizing enrichment keywords + themes into dossiers…")

enrichis = db.dossiers_enrichis.find(
    {},
    {
        "uid": 1,
        "dossier_summary_enrichment.qualification.keywords": 1,
        "dossier_summary_enrichment.qualification.themes_senat": 1,
    },
)

enrich_ops = []
enrich_count = 0

for doc in enrichis:
    uid = doc.get("uid")
    if not uid:
        continue
    qual = (doc.get("dossier_summary_enrichment") or {}).get("qualification") or {}

    keywords = qual.get("keywords")
    themes = qual.get("themes_senat")

    # Ne garder que les listes non vides de strings
    kw_clean = [k for k in (keywords or []) if isinstance(k, str) and k]
    th_clean = [t for t in (themes or []) if isinstance(t, str) and t]

    if not kw_clean and not th_clean:
        continue

    fields = {}
    if kw_clean:
        fields["enrichmentKeywords"] = kw_clean
    if th_clean:
        fields["enrichmentThemes"] = th_clean

    enrich_ops.append(UpdateOne({"uid": uid}, {"$set": fields}))
    enrich_count += 1

    if len(enrich_ops) >= BATCH_SIZE:
        db.dossiers.bulk_write(enrich_ops, ordered=False)
        enrich_ops = []

if enrich_ops:
    db.dossiers.bulk_write(enrich_ops, ordered=False)

print(f"Done — {enrich_count} dossiers enriched with keywords/themes.\n")

# ─── Aperçu du top 10 ────────────────────────────────────────────────────────
print("=== Top 10 dossiers (heat score) ===")
top = db.dossiers.find(
    query,
    {"uid": 1, "titreDossier.titre": 1, "heatScore": 1, "heatComponents": 1,
     "currentStage": 1, "currentStatus": 1, "procedureAcceleree": 1},
).sort("heatScore", -1).limit(10)
for d in top:
    titre = (d.get("titreDossier") or {}).get("titre", "—")
    hc = d.get("heatComponents", {})
    flags = []
    if d.get("procedureAcceleree"):
        flags.append("⚡")
    flags.append(d.get("currentStatus", "?"))
    print(f"  {d['uid']}  {d.get('heatScore', 0):.3f}  | "
          f"amd={hc.get('amendements_total', 0)} "
          f"auteurs={hc.get('n_auteurs_uniques', 0)} "
          f"tension={hc.get('tension', 0):.2f}  | "
          f"{' '.join(flags):<15} | "
          f"{(d.get('currentStage') or '—')[:30]:<30} | "
          f"{titre[:50]}")


##### Cour des comptes

page = 1
results = []

import datetime
today = datetime.datetime.now()
annee = int(today.year)

while True:
    print(page)
    a = requests.get('https://www.ccomptes.fr/fr/publications?f%5B0%5D=daterange%3A{annee}&f%5B3%5D=institution%3A98&page={page}'.format(page = page, annee = annee))
    bsobj = BeautifulSoup(a.content, 'html.parser')

    try:
        tmp = ["https://www.ccomptes.fr" + x.a["href"] for x in bsobj.find("ul", {"class": "search-list-results"}).find_all("li", {"class": "search-result"})]
        results += tmp

        print(len(tmp))

        if len(tmp) == 0:
            break
        
        page += 1
    except Exception as e:
        print(e)
        break   


import re

existing_docs = [x['url'] for x in client_.parlement.ccomptes.find({}, {"url": 1})]

for e in [x for x in results if x not in existing_docs]:
    print(e)
    bsobj = BeautifulSoup(requests.get(e).content, 'html.parser')

    titre = bsobj.find("meta", {"name": "twitter:title"})["content"]
    date = bsobj.find("time", {"class": "date"})["datetime"]

    documents = [{
        "href":  "https://www.ccomptes.fr" + x["href"],
        "type": x["data-document"]
        } for x in bsobj.find_all("a", {"data-document": True})]
    
    teaser = bsobj.find("div", {"class": "teaser-text"}).p.get_text(separator="\n", strip=True)

    try:
        content = bsobj.find("div", {"class": "text-formatted"}).find("div", {"class": "field__item"})
    except Exception as ex:
        print(ex)
        content = None

    structured_data = [{
        "type": "paragraph",
        "content": teaser
    }]


    if content is not None:
        for child in content.find_all(recursive=False):
            if child.name == "h4":
                structured_data.append({
                    "type": "title",
                    "content": child.get_text(strip=True)
                })
            elif child.name == "p":
                structured_data.append({
                    "type": "paragraph",
                    "content": child.get_text(separator="\n", strip=True)
                })

    doc = {
        "url": e,
        "titre": titre,
        "date": date,
        "documents": documents,
        "content": structured_data,
        "teaser": teaser
    }

    client_.parlement.ccomptes.update_one({"url": e}, {"$set": doc}, upsert=True)

    time.sleep(5)
