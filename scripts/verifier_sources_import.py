"""Vérifie les entrées de ND.py sans connexion à MongoDB.

Les chemins sont ceux de build_assemblee_categories (législature XVII).
Une source doit être non vide et chaque JSON doit être lisible par l'importeur,
avec un uid exploitable. Ce contrôle ne valide pas tout le schéma parlementaire
ni l'exhaustivité de l'export fourni en amont.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path


SOURCES = (
    "AMO20_dep_sen_min_tous_mandats_et_organes_XVII.json/acteur",
    "AMO20_dep_sen_min_tous_mandats_et_organes_XVII.json/organe",
    "Agenda_XVII.json/reunion",
    "Amendements_XVII.json",
    "Dossiers_Legislatifs_XVII.json/dossierParlementaire",
    "Dossiers_Legislatifs_XVII.json/document",
    "Scrutins_XVII.json",
    "Questions_orales_XVII.json",
    "Questions_ecrites_XVII.json",
    "Questions_gouvernement_XVII.json",
    "Comptes_Rendus_Seances_XVII",
)
COMMISSIONS = "Comptes_Rendus_Commissions_XVII"


def verifier_source(repertoire: Path) -> int:
    if not repertoire.is_dir():
        raise ValueError(f"Répertoire absent : {repertoire}")
    nombre = 0
    for chemin in repertoire.rglob("*.json"):
        try:
            with chemin.open(encoding="utf-8") as fichier:
                document = json.load(fichier)
        except (OSError, ValueError) as erreur:
            raise ValueError(f"JSON illisible : {chemin}") from erreur
        # Même déballage que dans ND.py, y compris les uid XML {"#text": ...}.
        if isinstance(document, dict) and len(document) == 1:
            document = next(iter(document.values()))
        if not isinstance(document, dict):
            raise ValueError(f"Objet JSON attendu : {chemin}")
        uid = document.get("uid")
        if isinstance(uid, dict):
            uid = uid.get("#text")
        if not isinstance(uid, str) or not uid.strip():
            raise ValueError(f"UID absent ou invalide : {chemin}")
        nombre += 1
    if not nombre:
        raise ValueError(f"Aucun document JSON : {repertoire}")
    return nombre


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assemblee-data", type=Path, required=True)
    parser.add_argument("--commissions-only", action="store_true")
    args = parser.parse_args()
    sources = (COMMISSIONS,) if args.commissions_only else SOURCES
    lignes = []
    erreurs = []
    for source in sources:
        try:
            nombre = verifier_source(args.assemblee_data / source)
            lignes.append(f"- {source} : {nombre} documents vérifiés.")
        except ValueError as erreur:
            erreurs.append(str(erreur))
            lignes.append(f"- ÉCHEC : {erreur}")
    for ligne in lignes:
        print(ligne, flush=True)
    resume = os.environ.get("GITHUB_STEP_SUMMARY")
    if resume:
        with open(resume, "a", encoding="utf-8") as fichier:
            fichier.write("\nVérification des sources d'ingestion\n\n")
            fichier.write("\n".join(lignes) + "\n")
    if erreurs:
        print("Validation refusée : aucune ingestion autorisée pour ces sources.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
