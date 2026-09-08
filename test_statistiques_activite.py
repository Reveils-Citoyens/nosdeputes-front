"""
Vérification de `statistiques_activite.py` sur les fichiers bruts, sans MongoDB.

Ces statistiques sont destinées à être contestées : il faut pouvoir montrer que
le calcul fait bien ce qu'il annonce. Ce script rejoue le calcul complet sur les
fichiers téléchargés dans ./assemblee-data et vérifie des invariants qui, s'ils
tombent, signalent une régression silencieuse dans les chiffres publiés.

    python test_statistiques_activite.py [--assemblee-data ./assemblee-data]

Prérequis : avoir exécuté `npm run data:download` et cloné le dépôt des comptes
rendus de commission (cf. .github/workflows/imports_nocturnes.yml).
"""

from __future__ import annotations

import argparse
import glob
import json
import logging
import sys
from pathlib import Path

import resolution_orateurs
import statistiques_activite as sp

log = logging.getLogger("test")

# Valeurs de référence, recalculées à la main depuis les comptes rendus bruts et
# recoupées avec l'API Tricoteuses sur la même fenêtre temporelle.
# Éric Coquerel sert de témoin : il est à la fois très actif en séance et
# président de la commission des finances, donc sensible aux deux défauts qu'on
# corrige (comptage des séances au lieu des jours, comptes rendus de commission
# comptés comme de l'hémicycle).
COQUEREL = "PA721202"
SEMAINE_BUDGET = "2024-10-21"  # semaine du budget 2025, 6 jours de séance
JOURS_COQUEREL_SEMAINE_BUDGET = 6


def charger(
    motif: str, extra: dict | None = None, champs: tuple[str, ...] | None = None
) -> list[dict]:
    """
    Charge des fichiers JSON bruts comme le ferait l'ingestion de ND.py.

    `champs` limite les clés conservées : les amendements se comptent en
    centaines de milliers, tout garder en mémoire n'apporterait rien.
    """
    documents = []
    for chemin in glob.glob(motif, recursive=True):
        with open(chemin, encoding="utf-8") as fichier:
            document = json.load(fichier)
        if len(document) == 1:
            document = next(iter(document.values()))
        if isinstance(document.get("uid"), dict):
            document["uid"] = document["uid"].get("#text", document["uid"])
        if champs:
            document = {cle: document[cle] for cle in champs if cle in document}
        if extra:
            document.update(extra)
        documents.append(document)
    return documents


class CollectionFichiers:
    """Le sous-ensemble de l'API pymongo `find()` utilisé par le calcul."""

    def __init__(self, documents: list[dict]):
        self.documents = documents

    @staticmethod
    def _resoudre(document, chemin: str) -> list:
        # Comme MongoDB : traverser une liste teste chacun de ses éléments.
        valeurs = [document]
        for partie in chemin.split("."):
            suivantes = []
            for valeur in valeurs:
                if isinstance(valeur, list):
                    suivantes += [v.get(partie) for v in valeur if isinstance(v, dict)]
                elif isinstance(valeur, dict):
                    suivantes.append(valeur.get(partie))
            valeurs = [v for v in suivantes if v is not None]
        return valeurs

    def find(self, filtre=None, projection=None):
        for document in self.documents:
            if filtre and not self._correspond(document, filtre):
                continue
            yield document

    def find_one(self, filtre=None, projection=None):
        return next(self.find(filtre, projection), None)

    def _correspond(self, document, filtre) -> bool:
        for chemin, attendu in filtre.items():
            valeurs = self._resoudre(document, chemin)
            if isinstance(attendu, dict):  # {"$exists": True}
                if not valeurs:
                    return False
            elif attendu not in valeurs:
                return False
        return True


class BaseFichiers:
    def __init__(self, **collections):
        self._collections = collections

    def __getattr__(self, nom):
        return self._collections[nom]

    def __getitem__(self, nom):
        return self._collections[nom]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assemblee-data", type=Path, default=Path("./assemblee-data"))
    parser.add_argument("--legislature", type=int, default=17)
    parser.add_argument(
        "--alerter",
        action="store_true",
        help=(
            "Envoie une alerte par e-mail au lieu de sortir en erreur. Destiné "
            "à l'import nocturne, qu'une vérification en échec ne doit pas "
            "interrompre : mieux vaut des données à jour et un avertissement "
            "que pas de données du tout."
        ),
    )
    arguments = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)-7s %(message)s")
    racine = arguments.assemblee_data
    legislature = arguments.legislature
    roman = {14: "XIV", 15: "XV", 16: "XVI", 17: "XVII"}[legislature]

    seances = charger(
        f"{racine}/Comptes_Rendus_Seances_{roman}/**/*.json",
        extra={"typeCompteRendu": "seance_publique"},
    )
    commissions = charger(
        f"{racine}/Comptes_Rendus_Commissions_{roman}/**/*.json",
        extra={"typeCompteRendu": "commission"},
    )
    reunions = charger(f"{racine}/Agenda_{roman}.json/reunion/**/*.json")
    amendements = charger(
        f"{racine}/Amendements_{roman}.json/**/*.json",
        champs=("uid", "legislature", "cycleDeVie", "signataires"),
    )
    documents_legislatifs = charger(
        f"{racine}/Dossiers_Legislatifs_{roman}.json/document/**/*.json",
        champs=("uid", "legislature", "cycleDeVie", "auteurs"),
    )
    questions = []
    for famille in ("ecrites", "orales", "gouvernement"):
        questions += charger(
            f"{racine}/Questions_{famille}_{roman}.json/**/*.json",
            champs=("uid", "type", "auteur", "textesQuestion"),
        )
    acteurs = charger(
        f"{racine}/AMO20_dep_sen_min_tous_mandats_et_organes_{roman}.json/acteur/**/*.json"
    )

    if not seances or not reunions or not acteurs:
        log.error(
            "Données manquantes dans %s — lancer `npm run data:download` d'abord.", racine
        )
        return 1
    log.info(
        "%d CR de séance, %d CR de commission, %d réunions, %d acteurs, "
        "%d amendements, %d documents, %d questions",
        len(seances), len(commissions), len(reunions), len(acteurs),
        len(amendements), len(documents_legislatifs), len(questions),
    )

    db = BaseFichiers(
        comptes_rendus=CollectionFichiers(seances + commissions),
        reunions=CollectionFichiers(reunions),
        acteurs=CollectionFichiers(acteurs),
        amendements=CollectionFichiers(amendements),
        documents=CollectionFichiers(documents_legislatifs),
        questions=CollectionFichiers(questions),
    )

    population = sp.population_par_semaine(db, legislature)
    effectifs = [len(membres) for membres in population.values()]
    # 577 sièges : moins, c'est que des mandats manquent ; beaucoup plus, c'est
    # que des mandats clos ou des non-députés se sont glissés dans la population.
    assert min(effectifs) >= 577, f"population trop petite : {min(effectifs)}"
    assert max(effectifs) <= 650, f"population trop large : {max(effectifs)}"

    resultat = sp.calculer_tout(db, legislature)
    quotidien, hebdomadaire = resultat.quotidiennes, resultat.hebdomadaires
    resolution = resultat.resolution
    par_type = {
        type_statistique: [l for l in quotidien if l["type"] == type_statistique]
        for type_statistique in sp.TOUS_LES_TYPES
    }

    # Le défaut d'origine : des comptes rendus de commission comptés comme de
    # l'hémicycle, ce qui gonflait la présence en séance et la comptait deux fois.
    for type_seance in (sp.TYPE_SEANCE_PUBLIQUE, sp.TYPE_INTERVENTION_SEANCE):
        sources = {
            detail["compteRenduUid"]
            for ligne in par_type[type_seance]
            for detail in ligne["details"]
        }
        intrus = sorted(uid for uid in sources if not uid.startswith("CRS"))
        assert not intrus, f"{type_seance} : comptes rendus étrangers {intrus[:5]}"

    sources_commission = {
        detail["compteRenduUid"]
        for ligne in par_type[sp.TYPE_INTERVENTION_COMMISSION]
        for detail in ligne["details"]
    }
    intrus = sorted(uid for uid in sources_commission if not uid.startswith("CRC"))
    assert not intrus, f"comptes rendus étrangers en commission : {intrus[:5]}"

    # Le rapprochement de noms ne doit jamais laisser de côté un député : les
    # orateurs non résolus sont attendus non-députés (ministres, sénateurs,
    # personnes auditionnées). Si un député y apparaît, la règle a régressé.
    index_deputes, _ = resolution_orateurs.construire_index(acteurs, legislature)
    deputes_manques = [
        entree for entree in resolution["principauxNonResolus"]
        if resolution_orateurs.decomposer(entree["nom"])[0] in index_deputes
    ]
    assert not deputes_manques, f"députés non rattachés : {deputes_manques[:5]}"
    log.info(
        "Rattachement des orateurs de commission : %.1f %% (%d / %d)",
        100 * resolution["tauxResolution"], resolution["resolus"], resolution["total"],
    )
    assert resolution["tauxResolution"] >= 0.70, resolution["tauxResolution"]

    # Une semaine compte sept jours : au-delà, l'unité a de nouveau dérivé vers
    # la séance (matin / après-midi / soir), qui était le défaut d'origine.
    debordements = [
        ligne for ligne in hebdomadaire
        if ligne["type"] == sp.TYPE_SEANCE_PUBLIQUE and ligne["valeur"] > 7
    ]
    assert not debordements, f"semaines de plus de 7 jours : {debordements[:3]}"

    semaine_budget = [
        ligne for ligne in hebdomadaire
        if ligne["acteurUid"] == COQUEREL
        and ligne["type"] == sp.TYPE_SEANCE_PUBLIQUE
        and ligne["semaineDebut"] == SEMAINE_BUDGET
    ]
    assert semaine_budget, f"semaine {SEMAINE_BUDGET} absente pour {COQUEREL}"
    assert semaine_budget[0]["valeur"] == JOURS_COQUEREL_SEMAINE_BUDGET, semaine_budget[0]

    # Médiane et maximum décrivent la même population : l'une ne peut pas
    # dépasser l'autre.
    for type_statistique in sp.TOUS_LES_TYPES:
        par_semaine: dict[int, dict[str, int]] = {}
        for ligne in hebdomadaire:
            if ligne["type"] != type_statistique:
                continue
            if ligne["acteurUid"] in ("median", "max"):
                par_semaine.setdefault(ligne["semaineIndex"], {})[
                    ligne["acteurUid"]
                ] = ligne["valeur"]
        for semaine, valeurs in par_semaine.items():
            assert valeurs["median"] <= valeurs["max"], (type_statistique, semaine, valeurs)

    for type_statistique, lignes in par_type.items():
        log.info(
            "%-28s %6d lignes | %7d %s | attribution : %s",
            type_statistique,
            len(lignes),
            sum(l["valeur"] for l in lignes),
            sp.UNITES[type_statistique] + "s",
            sp.ATTRIBUTIONS[type_statistique],
        )
    # Le dénominateur doit accompagner chaque valeur, sinon « 3 réunions » ne
    # se rapporte à rien.
    com = [l for l in quotidien if l["type"] == sp.TYPE_COMMISSION]
    assert all("convocations" in l for l in com), "convocations manquantes"
    incoherentes = [
        l for l in com
        if l["valeur"] + l["excusees"] + l["absences"] != l["convocations"]
    ]
    assert not incoherentes, f"états incohérents : {incoherentes[:2]}"
    assert all(l["valeur"] <= l["convocations"] for l in com), "plus de présences que de convocations"

    # Dénominateur de la séance publique : les jours où l'Assemblée a siégé.
    seances = {l["semaineIndex"]: l["valeur"] for l in hebdomadaire
               if l["type"] == sp.TYPE_SEANCE_PUBLIQUE and l["acteurUid"] == "assemblee"}
    assert seances, "dénominateur de séance absent"
    assert all(1 <= v <= 7 for v in seances.values()), "jours de séance hors bornes"
    trop = [l for l in hebdomadaire
            if l["type"] == sp.TYPE_SEANCE_PUBLIQUE and l["acteurUid"] not in ("assemblee", "median", "max")
            and l["valeur"] > seances.get(l["semaineIndex"], 0)]
    assert not trop, f"présent plus de jours que de séances : {trop[:2]}"
    log.info(
        "Dénominateurs : %d semaines de séance (%d à %d jours), "
        "convocations en commission sur %d lignes",
        len(seances), min(seances.values()), max(seances.values()), len(com),
    )

    log.info("%d lignes hebdomadaires au total", len(hebdomadaire))

    # Les interventions faites en présidant sont écartées du compteur mais
    # doivent rester accessibles : sans elles, la présidente de l'Assemblée
    # apparaît à zéro sans explication.
    presidence = [
        m for m in resultat.metriques
        if m["mesure"] == "interventions"
        and m["periode"] == "LEGISLATURE"
        and m.get("interventionsPresidence")
    ]
    assert presidence, "aucune intervention de présidence remontée jusqu'aux métriques"
    presidence.sort(key=lambda m: -m["interventionsPresidence"])
    log.info(
        "Présidence de séance : %d députés concernés, maximum %d interventions "
        "écartées (pour une valeur affichée de %d)",
        len(presidence),
        presidence[0]["interventionsPresidence"],
        presidence[0]["valeur"],
    )

    # Les cartes de la fiche député : un total par (mesure, période) et une
    # distribution par mesure, calculés sur les députés en exercice.
    assert resultat.distributions, "aucune distribution calculée"
    effectifs = {d["effectifReference"] for d in resultat.distributions}
    assert len(effectifs) == 1, f"population de référence incohérente : {effectifs}"
    log.info(
        "%d métriques, %d distributions, sur %d députés en exercice",
        len(resultat.metriques), len(resultat.distributions), effectifs.pop(),
    )
    for distribution in resultat.distributions:
        if distribution["periode"] != "LEGISLATURE":
            continue
        log.info(
            "  %-30s min=%-4d q20=%-4d q40=%-4d q60=%-4d q80=%-5d max=%-5d (%s)",
            distribution["mesure"], distribution["minimum"], distribution["q20"],
            distribution["q40"], distribution["q60"], distribution["q80"],
            distribution["maximum"], distribution["attribution"],
        )
        # Un quantile ne peut pas décroître.
        quantiles = [distribution[f"q{q}"] for q in (20, 40, 60, 80, 100)]
        assert quantiles == sorted(quantiles), (distribution["mesure"], quantiles)
    log.info("✅ Toutes les vérifications passent.")
    return 0


CONTEXTE_ALERTE = (
    "L'import nocturne s'est poursuivi malgré cet échec : les chiffres publiés "
    "cette nuit n'ont donc PAS été validés. Ce n'est pas la même chose que de "
    "les savoir faux — mais plus rien ne garantit qu'ils sont justes."
)


def _alerter_puis_taire(resume: str, detail: str) -> int:
    """Signale l'échec et renvoie 0, pour ne pas faire tomber l'import."""
    import alertes_import

    alertes_import.signaler(
        "Vérifications des statistiques en échec",
        [resume],
        contexte=f"{CONTEXTE_ALERTE}\n\n{detail}",
    )
    return 0


if __name__ == "__main__":
    # `--alerter` est repéré ici plutôt que dans le résultat de argparse : quand
    # une vérification tombe, `main()` lève avant d'avoir rien pu nous rendre.
    _alerter = "--alerter" in sys.argv
    try:
        _code = main()
    except Exception:
        if not _alerter:
            raise
        import traceback

        _trace = traceback.format_exc()
        # La dernière ligne de la trace porte l'assertion qui a cédé : c'est
        # elle qui dit ce qui ne va pas, le reste est du contexte.
        _code = _alerter_puis_taire(_trace.strip().splitlines()[-1], _trace)
    else:
        # Sortie non nulle sans exception : les données brutes manquent, le
        # calcul n'a même pas pu être tenté. Aussi grave, et plus fréquent.
        if _code != 0 and _alerter:
            _code = _alerter_puis_taire(
                f"le script de vérification a rendu {_code} sans rien vérifier",
                "Cause la plus probable : les données brutes n'ont pas été "
                "téléchargées, ou le dépôt des comptes rendus de commission "
                "n'a pas pu être cloné. Voir le journal du job.",
            )
    sys.exit(_code)
