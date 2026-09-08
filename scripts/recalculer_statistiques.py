"""
Recalcul des statistiques d'activité, hors import nocturne complet.

`ND.py` fait tout : téléchargement, ingestion de tous les jeux de données, heat
scores, puis statistiques. Ce script ne fait que la dernière étape, et
optionnellement l'ingestion des comptes rendus et des documents.

Il sert dans deux cas :

  - rattrapage, quand des collections sont vides en production alors que la
    copie locale d'assemblee-data est à jour pour ces jeux-là seulement ;
  - reprise du seul calcul après un changement de règle, sans réingérer.

Il n'écrit jamais dans les collections qu'il ne recalcule pas. C'est
volontaire : rejouer l'ingestion complète depuis une copie locale partiellement
rafraîchie remplacerait des données de production par des versions plus
anciennes.

L'URI de connexion est lue dans la variable d'environnement MONGODB_URI (ou
MONGO_URI), et à défaut dans le fichier .env du projet.

    .venv/bin/python scripts/recalculer_statistiques.py --ingerer
    .venv/bin/python scripts/recalculer_statistiques.py            # calcul seul
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from pymongo import MongoClient, UpdateOne

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import statistiques_activite  # noqa: E402

log = logging.getLogger("recalcul")

ROMAN = {14: "XIV", 15: "XV", 16: "XVI", 17: "XVII"}

CLES_URI = ("MONGODB_URI", "MONGO_URI")


def lire_uri(racine_projet: Path) -> str | None:
    """
    URI MongoDB, depuis l'environnement ou depuis le .env du projet.

    Les valeurs du .env sont entre guillemets — les passer au shell avec un
    `cut` les transmet littéralement à pymongo, qui rejette alors le scheme.
    On les retire ici pour que l'appel se fasse sans contorsion.
    """
    for cle in CLES_URI:
        valeur = os.environ.get(cle)
        if valeur and valeur.strip():
            return valeur.strip().strip("\"'")

    fichier_env = racine_projet / ".env"
    if not fichier_env.exists():
        return None

    for ligne in fichier_env.read_text(encoding="utf-8").splitlines():
        ligne = ligne.strip()
        if not ligne or ligne.startswith("#") or "=" not in ligne:
            continue
        cle, _, valeur = ligne.partition("=")
        if cle.strip() in CLES_URI:
            valeur = valeur.strip().strip("\"'")
            if valeur:
                return valeur
    return None


def jeux_a_ingerer(racine: Path, legislature: int) -> list[tuple[str, Path, str, dict | None]]:
    """(libellé, répertoire, collection, champs ajoutés) — aligné sur ND.py."""
    roman = ROMAN[legislature]
    return [
        (
            "comptes_rendus_seance",
            racine / f"Comptes_Rendus_Seances_{roman}",
            "comptes_rendus",
            {"typeCompteRendu": "seance_publique"},
        ),
        (
            "comptes_rendus_commissions",
            racine / f"Comptes_Rendus_Commissions_{roman}",
            "comptes_rendus",
            {"typeCompteRendu": "commission"},
        ),
        (
            "documents",
            racine / f"Dossiers_Legislatifs_{roman}.json" / "document",
            "documents",
            None,
        ),
    ]


def ingerer(collection, repertoire: Path, libelle: str, extra: dict | None) -> int:
    """Upsert par uid, idempotent : rejouer l'ingestion ne duplique rien."""
    if not repertoire.exists():
        log.error("Répertoire introuvable, ingestion ignorée : %s", repertoire)
        return 0

    total, lot = 0, []
    for chemin in sorted(repertoire.rglob("*.json")):
        with open(chemin, encoding="utf-8") as fichier:
            document = json.load(fichier)
        # Les exports encapsulent souvent l'objet sous une clé unique.
        if len(document) == 1:
            document = next(iter(document.values()))
        if isinstance(document.get("uid"), dict):
            document["uid"] = document["uid"].get("#text", document["uid"])
        if extra:
            document.update(extra)
        if "uid" not in document:
            continue
        lot.append(UpdateOne({"uid": document["uid"]}, {"$set": document}, upsert=True))
        if len(lot) >= 500:
            collection.bulk_write(lot, ordered=False)
            total += len(lot)
            lot = []
    if lot:
        collection.bulk_write(lot, ordered=False)
        total += len(lot)

    log.info("✔ %-28s %6d documents ingérés", libelle, total)
    return total


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assemblee-data", type=Path, default=Path("../assemblee-data"))
    parser.add_argument("--legislature", type=int, default=17)
    parser.add_argument("--db", default="parlement")
    parser.add_argument(
        "--ingerer",
        action="store_true",
        help="Ingérer d'abord les comptes rendus et les documents",
    )
    arguments = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(message)s",
        datefmt="%H:%M:%S",
    )

    racine_projet = Path(__file__).resolve().parent.parent
    uri = lire_uri(racine_projet)
    if not uri:
        log.error(
            "URI MongoDB introuvable : définir MONGODB_URI, ou la renseigner "
            "dans %s", racine_projet / ".env",
        )
        return 1
    if not uri.startswith(("mongodb://", "mongodb+srv://")):
        log.error("URI MongoDB invalide : elle doit commencer par mongodb:// ou mongodb+srv://")
        return 1

    db = MongoClient(uri, serverSelectionTimeoutMS=10000)[arguments.db]

    if arguments.ingerer:
        for libelle, repertoire, nom_collection, extra in jeux_a_ingerer(
            arguments.assemblee_data, arguments.legislature
        ):
            avant = db[nom_collection].estimated_document_count()
            ingerer(db[nom_collection], repertoire, libelle, extra)
            log.info(
                "  %s : %d → %d documents",
                nom_collection, avant, db[nom_collection].estimated_document_count(),
            )

    resultat = statistiques_activite.calculer_et_stocker(
        db, legislature=arguments.legislature
    )
    log.info("Résultat : %s", resultat)
    return 0


if __name__ == "__main__":
    sys.exit(main())
