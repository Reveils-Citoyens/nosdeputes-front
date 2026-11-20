"""
Règles de calcul des statistiques, vérifiées sans base ni fichiers bruts.

    python -m unittest test_regles_statistiques
"""

from __future__ import annotations

import json
import unittest
from pathlib import Path

import statistiques_activite as sp


class Collection:
    def __init__(self, documents: list[dict]):
        self.documents = documents

    def find(self, *_args, **_kwargs):
        return iter(self.documents)


class Base:
    def __init__(self, **collections: list[dict]):
        for nom, documents in collections.items():
            setattr(self, nom, Collection(documents))


def document(uid: str, *auteurs: str, jour: str = "2025-03-04") -> dict:
    return {
        "uid": uid,
        "legislature": "17",
        "cycleDeVie": {"chrono": {"dateCreation": jour}},
        "auteurs": {"auteur": [{"acteur": {"acteurRef": a, "qualite": "auteur"}} for a in auteurs]},
    }


class DocumentsSignes(unittest.TestCase):
    def test_exclut_les_motions_de_censure(self):
        base = Base(documents=[
            document("PIONANR5L17B0001", "PA1"),
            document("RAPPANR5L17B0002", "PA1", "PA2"),
            document("MIONANR5L17-N1", "PA1", "PA2", "PA3"),
        ])
        lignes = sp.calculer_documents_publies(base, 17)
        comptes = {ligne["acteurUid"]: ligne["valeur"] for ligne in lignes}
        self.assertEqual(comptes, {"PA1": 2, "PA2": 1})
        self.assertNotIn("MIONANR5L17-N1", json.dumps([ligne["details"] for ligne in lignes]))


class Parametres(unittest.TestCase):
    def test_seuil_lu_dans_le_fichier_partage_avec_le_site(self):
        fichier = json.loads((Path(__file__).parent / "config" / "statistiques.json").read_text())
        self.assertEqual(sp.SEUIL_CARACTERES, fichier["seuilCaracteres"])


if __name__ == "__main__":
    unittest.main()
