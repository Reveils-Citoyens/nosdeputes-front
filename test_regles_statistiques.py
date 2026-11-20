"""
Règles de calcul des statistiques, vérifiées sans base ni fichiers bruts.

    python -m unittest test_regles_statistiques
"""

from __future__ import annotations

import json
import unittest
from datetime import date
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


def votant(acteur: str, delegation: str = "false") -> dict:
    return {"acteurRef": acteur, "parDelegation": delegation, "numPlace": "1"}


def scrutin(numero: int, jour: str, **positions: list[dict]) -> dict:
    """`positions` : pours, contres, abstentions, nonVotants → liste de votants."""
    return {
        "uid": f"VTANR5L17V{numero}",
        "numero": str(numero),
        "legislature": "17",
        "dateScrutin": jour,
        "ventilationVotes": {"organe": {"groupes": {"groupe": [{
            "vote": {"decompteNominatif": {
                cle: ({"votant": votants[0] if len(votants) == 1 else votants} if votants else None)
                for cle, votants in positions.items()
            }},
        }]}}},
    }


def compte_rendu(jour_compact: str, *paragraphes: tuple[str, str]) -> dict:
    return {
        "uid": f"CRSANR5L17S{jour_compact}",
        "typeCompteRendu": "seance_publique",
        "metadonnees": {"dateSeance": jour_compact, "legislature": "17"},
        "contenu": {"paragraphe": [{"id_acteur": a, "texte": t} for a, t in paragraphes]},
    }


LONG = "Monsieur le ministre, cet amendement vise à corriger une erreur de rédaction."


class VotesEnPersonne(unittest.TestCase):
    def test_exclut_les_votes_par_delegation_et_les_non_votants(self):
        base = Base(scrutins=[scrutin(
            12, "2025-03-04",
            pours=[votant("PA1"), votant("PA2", delegation="true")],
            contres=[votant("PA3")],
            # Un seul votant : l'export rend un objet, pas une liste.
            abstentions=[votant("PA4")],
            nonVotants=[votant("PA5")],
        )])
        votes = sp.calculer_votes_en_personne(base, 17)
        jour = date(2025, 3, 4)
        self.assertEqual(set(votes), {("PA1", jour), ("PA3", jour), ("PA4", jour)})
        self.assertEqual(
            votes[("PA4", jour)],
            [{"scrutinUid": "VTANR5L17V12", "numero": "12", "position": "abstention"}],
        )

    def test_delegation_manquante_ne_prouve_rien(self):
        base = Base(scrutins=[scrutin(1, "2025-03-04", pours=[{"acteurRef": "PA1"}])])
        self.assertEqual(sp.calculer_votes_en_personne(base, 17), {})

    def test_jour_de_vote_seul_et_jour_de_parole_et_de_vote(self):
        base = Base(
            scrutins=[
                scrutin(12, "2025-03-04", pours=[votant("PA1"), votant("PA2")]),
                scrutin(11, "2025-03-04", contres=[votant("PA1")]),
                scrutin(13, "2025-03-05", pours=[votant("PA3", delegation="true")]),
            ],
            comptes_rendus=[
                compte_rendu("20250304150000000", ("PA1", LONG), ("PA9", LONG)),
                # PA3 a délégué son vote et n'a dit que « Très bien ! » : absent.
                compte_rendu("20250305150000000", ("PA3", "Très bien !")),
            ],
        )
        lignes = sp.calculer_presences_seance_publique(
            base, 17, sp.calculer_votes_en_personne(base, 17)
        )
        par_acteur = {ligne["acteurUid"]: ligne for ligne in lignes}
        self.assertEqual(set(par_acteur), {"PA1", "PA2", "PA9"})
        self.assertTrue(all(ligne["valeur"] == 1 for ligne in lignes))

        # Parole et vote le même jour : un seul jour, pas « vote seul ».
        self.assertEqual(par_acteur["PA1"]["joursVoteSeul"], 0)
        self.assertEqual(par_acteur["PA1"]["interventionsRetenues"], 1)
        self.assertEqual([v["numero"] for v in par_acteur["PA1"]["scrutins"]], ["11", "12"])
        # Vote sans parole.
        self.assertEqual(par_acteur["PA2"]["joursVoteSeul"], 1)
        self.assertEqual(par_acteur["PA2"]["details"], [])
        # Parole sans vote.
        self.assertEqual(par_acteur["PA9"]["joursVoteSeul"], 0)
        self.assertEqual(par_acteur["PA9"]["scrutins"], [])


class Parametres(unittest.TestCase):
    def test_seuil_lu_dans_le_fichier_partage_avec_le_site(self):
        fichier = json.loads((Path(__file__).parent / "config" / "statistiques.json").read_text())
        self.assertEqual(sp.SEUIL_CARACTERES, fichier["seuilCaracteres"])


if __name__ == "__main__":
    unittest.main()
