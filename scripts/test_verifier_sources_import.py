"""Tests hors ligne des garde-fous de l'import nocturne, sans MongoDB."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from scripts.verifier_sources_import import COMMISSIONS, SOURCES, verifier_source
from alertes_import import _rediger


class VerificationSourcesTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def ecrire(self, repertoire, document, nom="document.json"):
        chemin = self.root / repertoire / nom
        chemin.parent.mkdir(parents=True, exist_ok=True)
        chemin.write_text(json.dumps(document), encoding="utf-8")
        return chemin

    def lancer(self, *args):
        return subprocess.run(
            [
                sys.executable, "-m", "scripts.verifier_sources_import",
                "--assemblee-data", str(self.root), *args,
            ],
            cwd=Path(__file__).resolve().parents[1],
            env={**os.environ, "GITHUB_STEP_SUMMARY": str(self.root / "summary.md")},
            capture_output=True,
            text=True,
        )

    def test_formats_acceptes_par_importeur(self):
        self.ecrire("source", {"acteur": {"uid": {"#text": "PA1"}}}, "acteur.json")
        self.ecrire("source", {"uid": "CR1", "contenu": {}}, "sous/reunion.json")
        self.assertEqual(verifier_source(self.root / "source"), 2)

    def test_repertoire_absent_ou_vide_refuse(self):
        with self.assertRaisesRegex(ValueError, "absent"):
            verifier_source(self.root / "source")
        (self.root / "source").mkdir()
        with self.assertRaisesRegex(ValueError, "Aucun document"):
            verifier_source(self.root / "source")

    def test_tous_les_fichiers_sont_verifies(self):
        self.ecrire("source", {"uid": "CR1", "contenu": {}}, "valide.json")
        mauvais = self.ecrire("source", {}, "invalide.json")
        mauvais.write_text('{"uid":', encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "JSON illisible"):
            verifier_source(self.root / "source")

    def test_objets_et_identifiants_invalides_refuses(self):
        for document in ([], None, "texte", {"contenu": {}},
                         {"uid": [], "contenu": {}}, {"uid": " ", "contenu": {}},
                         {"uid": {"autre": "CR1"}, "contenu": {}}):
            with self.subTest(document=document):
                self.ecrire("source", document)
                with self.assertRaises(ValueError):
                    verifier_source(self.root / "source")

    def test_sources_principales_valides_sans_commissions(self):
        for source in SOURCES:
            self.ecrire(source, {"uid": "TEST1", "contenu": {}})
        resultat = self.lancer()
        self.assertEqual(resultat.returncode, 0, resultat.stdout + resultat.stderr)
        self.assertFalse((self.root / COMMISSIONS).exists())
        self.assertIn("documents vérifiés", (self.root / "summary.md").read_text())

    def test_source_principale_manquante_bloque(self):
        for source in SOURCES[:-1]:
            self.ecrire(source, {"uid": "TEST1", "contenu": {}})
        resultat = self.lancer()
        self.assertEqual(resultat.returncode, 1)
        self.assertIn("Comptes_Rendus_Seances_XVII", resultat.stdout)

    def test_commissions_validees_independamment(self):
        self.assertEqual(self.lancer("--commissions-only").returncode, 1)
        self.ecrire(COMMISSIONS, {"uid": "CRC1", "contenu": {}})
        resultat = self.lancer("--commissions-only")
        self.assertEqual(resultat.returncode, 0, resultat.stdout + resultat.stderr)
        mauvais = self.ecrire(COMMISSIONS, {}, "autre.json")
        avant = mauvais.read_bytes()
        self.assertEqual(self.lancer("--commissions-only").returncode, 1)
        self.assertEqual(mauvais.read_bytes(), avant)

    def test_alerte_distingue_arret_et_mode_degrade(self):
        arret = _rediger("Échec", ["Erreur"], "Lien", interrompu=True)
        self.assertIn("L'import a échoué", arret)
        self.assertIn("partielle", arret)
        degrade = _rediger("Dégradé", ["Commissions absentes"], "Lien")
        self.assertIn("L'import continue", degrade)
        self.assertNotIn("pas erronés", degrade)


if __name__ == "__main__":
    unittest.main()
