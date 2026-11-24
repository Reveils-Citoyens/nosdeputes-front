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


def scrutin_solennel(numero: int, jour: str, *groupes: dict) -> dict:
    """`groupes` : {"organeRef", positions…} → un groupe de la ventilation."""
    return {
        "uid": f"VTANR5L17V{numero}",
        "numero": str(numero),
        "legislature": "17",
        "dateScrutin": jour,
        "typeVote": {"codeTypeVote": "SPS"},
        "ventilationVotes": {"organe": {"groupes": {"groupe": [
            {
                "organeRef": groupe["organeRef"],
                "vote": {
                    # Champ de l'Assemblée, volontairement faux : la majorité
                    # doit être recalculée à partir des votes.
                    "positionMajoritaire": "abstention",
                    "decompteNominatif": {
                        cle: {"votant": votants}
                        for cle, votants in groupe.items()
                        if cle in sp.RUBRIQUES_VOTE
                    },
                },
            }
            for groupe in groupes
        ]}}},
    }


def depute(uid: str, debut: str = "2024-07-18", fin: str | None = None) -> dict:
    return {"uid": uid, "mandats": {"mandat": [
        {"typeOrgane": "ASSEMBLEE", "legislature": "17", "dateDebut": debut, "dateFin": fin},
    ]}}


class PositionMajoritaire(unittest.TestCase):
    def test_position_la_plus_suivie_et_egalite(self):
        decompte = lambda **n: {  # noqa: E731
            cle: {"votant": [votant(f"PA{i}") for i in range(nombre)]} for cle, nombre in n.items()
        }
        self.assertEqual(sp.position_majoritaire(decompte(pours=121, abstentions=2)), "pour")
        self.assertEqual(sp.position_majoritaire(decompte(contres=3, abstentions=5)), "abstention")
        self.assertIsNone(sp.position_majoritaire(decompte(pours=4, contres=4)))
        self.assertIsNone(sp.position_majoritaire({}))


class VotesSolennels(unittest.TestCase):
    def setUp(self):
        self.base = Base(
            scrutins=[
                scrutin_solennel(
                    1, "2025-01-14",
                    {"organeRef": "PO1",
                     "pours": [votant("PA1"), votant("PA2", delegation="true")],
                     # S'abstenir quand son groupe vote pour : dissidence.
                     "abstentions": [votant("PA3")]},
                    {"organeRef": "PONI",
                     "pours": [votant("PA4")]},
                ),
                scrutin_solennel(
                    2, "2025-02-11",
                    {"organeRef": "PO1",
                     "contres": [votant("PA1"), votant("PA6")],
                     # Présidant la séance : ne pouvait pas voter.
                     "nonVotants": [{**votant("PA2"), "causePositionVote": "PSE"}]},
                    {"organeRef": "PONI",
                     "contres": [votant("PA4")]},
                ),
                # Scrutin ordinaire : hors champ.
                {**scrutin(3, "2025-02-12", pours=[votant("PA1")]), "typeVote": {"codeTypeVote": "SPO"}},
            ],
            acteurs=[
                depute("PA1"), depute("PA2"), depute("PA4"),
                # PA3 n'était pas encore député lors du second scrutin.
                depute("PA3", debut="2025-01-01", fin="2025-01-31"),
                # PA5 en mandat, n'a jamais voté.
                depute("PA5"),
            ],
            organes=[{"uid": "PONI", "codeType": "GP", "libelleAbrev": "NI", "legislature": "17"}],
        )
        metriques, self.distributions = sp.calculer_votes_solennels(
            self.base, 17, {"PA1", "PA2", "PA3", "PA4", "PA5"}
        )
        self.par = {
            (m["mesure"], m["acteurUid"]): m for m in metriques if m["periode"] == "LEGISLATURE"
        }

    def test_participation(self):
        p = lambda uid: self.par[(sp.MESURE_PARTICIPATION, uid)]  # noqa: E731
        self.assertEqual((p("PA1")["votes"], p("PA1")["scrutins"], p("PA1")["valeur"]), (2, 2, 100.0))
        # Délégation : vote émis ; présidence : scrutin hors dénominateur.
        self.assertEqual((p("PA2")["votes"], p("PA2")["scrutins"], p("PA2")["votesDelegation"]), (1, 1, 1))
        # Hors mandat lors du second scrutin.
        self.assertEqual(p("PA3")["scrutins"], 1)
        self.assertEqual(p("PA5")["valeur"], 0.0)

    def test_dissidence(self):
        d = lambda uid: self.par[(sp.MESURE_DISSIDENCE, uid)]  # noqa: E731
        self.assertEqual((d("PA1")["votesDissidents"], d("PA1")["votesExprimes"]), (0, 2))
        self.assertEqual((d("PA3")["votesDissidents"], d("PA3")["valeur"]), (1, 100.0))
        # Non-inscrit : pas de groupe dont s'écarter, taux indéfini.
        self.assertEqual(d("PA4")["votesExprimes"], 0)
        self.assertIsNone(d("PA4")["valeur"])
        self.assertIsNone(d("PA5")["valeur"])

    def test_distribution_sans_les_taux_indefinis(self):
        par_mesure = {
            d["mesure"]: d for d in self.distributions if d["periode"] == "LEGISLATURE"
        }
        self.assertEqual(par_mesure[sp.MESURE_PARTICIPATION]["effectifReference"], 5)
        # PA4 (non-inscrit) et PA5 (aucun vote) n'ont pas de taux de dissidence.
        self.assertEqual(par_mesure[sp.MESURE_DISSIDENCE]["effectifReference"], 3)


class MandatAcheve(unittest.TestCase):
    def test_totaux_sur_le_mandat_seulement(self):
        def ligne(type_statistique: str, jour: str, valeur: int, **annexes) -> dict:
            return {"type": type_statistique, "acteurUid": "PA9", "date": jour, "valeur": valeur, **annexes}

        quotidiennes = [
            ligne(sp.TYPE_INTERVENTION_SEANCE, "2025-03-04", 3),
            ligne(sp.TYPE_INTERVENTION_COMMISSION, "2025-03-05", 2),
            # Après la fin du mandat (devenu ministre) : écartée.
            ligne(sp.TYPE_INTERVENTION_SEANCE, "2025-11-04", 7),
            ligne(sp.TYPE_COMMISSION, "2025-03-05", 1, convocations=2),
            # Un député en exercice n'est pas concerné.
            {**ligne(sp.TYPE_AMENDEMENT, "2025-03-05", 4), "acteurUid": "PA1"},
        ]
        mandats = {"PA9": [(date(2024, 7, 18), date(2025, 9, 30))]}
        metriques = sp.calculer_metriques_mandat(quotidiennes, 17, mandats, {"PA9"})
        par_mesure = {m["mesure"]: m for m in metriques}

        self.assertTrue(all(m["periode"] == sp.PERIODE_MANDAT for m in metriques))
        self.assertEqual({m["acteurUid"] for m in metriques}, {"PA9"})
        self.assertEqual(par_mesure["interventions"]["valeur"], 5)
        self.assertEqual(par_mesure["presence-commission"]["convocations"], 2)
        self.assertEqual(par_mesure["amendements"]["valeur"], 0)

    def test_votes_solennels_sur_le_mandat(self):
        base = Base(
            scrutins=[
                scrutin_solennel(1, "2025-01-14", {"organeRef": "PO1", "pours": [votant("PA1"), votant("PA9")]}),
                scrutin_solennel(2, "2025-12-02", {"organeRef": "PO1", "contres": [votant("PA1")]}),
            ],
            acteurs=[depute("PA1"), depute("PA9", fin="2025-09-30")],
            organes=[],
        )
        metriques, distributions = sp.calculer_votes_solennels(base, 17, {"PA1"}, {"PA9"})
        mandat = {m["mesure"]: m for m in metriques if m["periode"] == sp.PERIODE_MANDAT}
        # Seul le premier scrutin tombe pendant son mandat.
        self.assertEqual(
            (mandat[sp.MESURE_PARTICIPATION]["votes"], mandat[sp.MESURE_PARTICIPATION]["scrutins"]), (1, 1)
        )
        # Les anciens députés n'entrent dans aucune distribution.
        self.assertTrue(all(d["periode"] != sp.PERIODE_MANDAT for d in distributions))


def paragraphe(code: str, acteur: str, orateur: str, texte: str = LONG, ordre: int = 1) -> dict:
    return {
        "code_grammaire": code,
        "id_acteur": acteur,
        "ordre_absolu_seance": str(ordre),
        "orateurs": {"orateur": {"nom": orateur}},
        "texte": texte,
    }


class InterventionsDeFond(unittest.TestCase):
    def test_codes_retenus_et_ecartes(self):
        retenus = [
            paragraphe("PAROLE_GENERIQUE", "PA1", "M. Dupont"),
            # Défense d'un amendement, question orale sans débat : code de rubrique.
            paragraphe("DISC_ARTICLES_3_4_1", "PA1", "M. Dupont"),
            paragraphe("QOSD_2_2", "PA1", "M. Dupont", {"_": LONG, "stime": "12"}),
            # La présidence en parole générique reste comptée (à part).
            paragraphe("PAROLE_GENERIQUE", "PA2", "Mme la présidente"),
        ]
        ecartes = [
            paragraphe("INTERRUPTION_1_10", "PA1", "M. Dupont"),
            paragraphe("RAP_REGLEMENT_2_2", "PA1", "M. Dupont"),
            # Formules de la présidence sous un code de rubrique.
            paragraphe("SCRUT_PUB_ADT_1_2", "PA2", "Mme la présidente"),
            paragraphe("DISC_ARTICLES_3_1", "PA2", "Mme la présidente"),
            # Identifiant sans orateur nommé : « Présidence de M. X ».
            paragraphe("OUV_SEAN_1_1", "PA2", ""),
            paragraphe("DISC_ARTICLES_4_20", "PA1", "M. Dupont", ""),
        ]
        self.assertTrue(all(sp.est_intervention_de_fond(p) for p in retenus))
        self.assertFalse(any(sp.est_intervention_de_fond(p) for p in ecartes))

    def test_texte_vide_jamais_compte(self):
        self.assertFalse(sp.est_intervention_de_fond(paragraphe("PAROLE_GENERIQUE", "PA1", "M. Dupont", "")))


class PrisesDeParole(unittest.TestCase):
    def seance(self, *paragraphes: dict) -> dict:
        cr = compte_rendu("20250304150000000")
        cr["contenu"] = {"point": list(paragraphes)}
        lignes = sp.calculer_interventions_seance_publique(Base(comptes_rendus=[cr]), 17)
        return {ligne["acteurUid"]: ligne for ligne in lignes}

    def test_une_prise_de_parole_malgre_les_paragraphes_et_les_interruptions(self):
        par_acteur = self.seance(
            paragraphe("PAROLE_GENERIQUE", "PA9", "Mme la présidente", "La parole est à M. Dupont.", ordre=1),
            paragraphe("PAROLE_GENERIQUE", "PA1", "M. Dupont", ordre=2),
            paragraphe("PAROLE_GENERIQUE", "PA1", "M. Dupont", ordre=3),
            # Interruption depuis les bancs, puis rappel à l'ordre : la parole reste à M. Dupont.
            paragraphe("INTERRUPTION_1_10", "PA2", "M. Martin", "C'est faux !", ordre=4),
            paragraphe("INTERRUPTION_1_10", "PA9", "Mme la présidente", "Veuillez conclure.", ordre=5),
            paragraphe("DISC_ARTICLES_3_4_1", "PA1", "M. Dupont", ordre=6),
            # Conteneur d'un bloc d'amendements : texte vide, ne coupe rien.
            paragraphe("DISC_ARTICLES_4_50", "PA9", "", "", ordre=7),
            paragraphe("PAROLE_GENERIQUE", "PA1", "M. Dupont", ordre=8),
        )
        self.assertEqual(par_acteur["PA1"]["valeur"], 1)
        self.assertEqual(
            par_acteur["PA1"]["details"][0]["paragraphes"],
            [{"ordre": 2, "presidence": False, "suite": [3, 6, 8]}],
        )
        # Les interruptions ne comptent pas comme intervention.
        self.assertNotIn("PA2", par_acteur)
        # La présidence : une prise de parole comptée à part.
        self.assertEqual(par_acteur["PA9"]["valeur"], 0)
        self.assertEqual(par_acteur["PA9"]["interventionsPresidence"], 1)

    def test_un_autre_orateur_coupe_la_parole(self):
        par_acteur = self.seance(
            paragraphe("DISC_ARTICLES_3_4_1", "PA1", "M. Dupont", ordre=1),
            paragraphe("PAROLE_GENERIQUE", "PA9", "Mme la présidente", "Quel est l'avis de la commission ?", ordre=2),
            paragraphe("PAROLE_GENERIQUE", "PA3", "M. le rapporteur", "Défavorable.", ordre=3),
            paragraphe("PAROLE_GENERIQUE", "PA1", "M. Dupont", ordre=4),
        )
        self.assertEqual(par_acteur["PA1"]["valeur"], 2)
        # « Défavorable. » : une prise de parole, sans seuil de longueur.
        self.assertEqual(par_acteur["PA3"]["valeur"], 1)

    def test_formules_et_rappels_au_reglement_ne_comptent_pas(self):
        par_acteur = self.seance(
            paragraphe("SCRUT_PUB_ADT_1_2", "PA9", "Mme la présidente", "Je mets aux voix l'amendement no 12.", ordre=1),
            paragraphe("RAP_REGLEMENT_2_2", "PA1", "M. Dupont", ordre=2),
        )
        self.assertEqual(par_acteur, {})


class Parametres(unittest.TestCase):
    def test_seuil_lu_dans_le_fichier_partage_avec_le_site(self):
        fichier = json.loads((Path(__file__).parent / "config" / "statistiques.json").read_text())
        self.assertEqual(sp.SEUIL_CARACTERES, fichier["seuilCaracteres"])


if __name__ == "__main__":
    unittest.main()
