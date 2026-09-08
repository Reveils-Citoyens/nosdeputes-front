"""
resolution_orateurs.py
======================

Rattachement d'un orateur de compte rendu de commission à un député.

Pourquoi c'est nécessaire — et pourquoi c'est le maillon faible
---------------------------------------------------------------
Les comptes rendus de séance publique, publiés en open data par l'Assemblée,
portent un `id_acteur` sur chaque prise de parole : l'attribution y est exacte,
il n'y a rien à deviner.

Les comptes rendus de commission, eux, ne sont pas publiés en open data.
L'Assemblée ne les met en ligne qu'en HTML ; Tricoteuses les moissonne et les
republie. Dans ces fichiers, l'orateur n'est qu'une chaîne de caractères — le
champ `id` est systématiquement vide. Rattacher « M. le président Éric
Coquerel » au député PA721202 suppose donc un rapprochement de noms.

Aucun acteur de la chaîne ne peut faire mieux : l'API Tricoteuses procède elle
aussi par rapprochement. La différence est qu'ici la règle est lisible, et que
les orateurs non rattachés sont conservés et comptés au lieu d'être perdus —
c'est ce qui permet de publier un taux de résolution plutôt que d'afficher un
chiffre dont personne ne peut dire ce qu'il omet.

Ce qui n'est volontairement pas rattaché
----------------------------------------
Une bonne part des orateurs en commission ne sont pas des députés : ministres,
sénateurs, personnes auditionnées. Ne pas les rattacher est le comportement
correct, pas un échec. Le taux de résolution doit se lire en gardant ça en tête,
d'où la liste des noms non résolus dans le rapport : elle permet de vérifier
qu'aucun député ne s'y trouve.
"""

from __future__ import annotations

import re
import unicodedata
from collections import Counter
from typing import Any, Iterable

# Fonctions parlementaires citées à la place du nom (« M. le rapporteur »).
# Elles sont résolues via le nom associé à la même fonction plus haut dans le
# même compte rendu.
FONCTIONS = (
    "rapporteur general",
    "rapporteure generale",
    "rapporteur pour avis",
    "rapporteure pour avis",
    "rapporteur special",
    "rapporteure speciale",
    "rapporteur",
    "rapporteure",
    "president",
    "presidente",
    "vice president",
    "vice presidente",
    "ministre",
    "secretaire d etat",
)

_CIVILITES = re.compile(r"^(m|mme|mlle|mr)\s+")
_FONCTION_EN_TETE = re.compile(r"^(le|la|l)\s+(" + "|".join(FONCTIONS) + r")\b")
_PARENTHESES = re.compile(r"\s*\([^)]*\)")


def normaliser(texte: str | None) -> str:
    """Minuscules, sans accents ni ponctuation, espaces normalisés."""
    if not texte:
        return ""
    sans_accent = (
        unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode("ascii")
    )
    sans_ponctuation = re.sub(r"[.'’\-]", " ", sans_accent.lower())
    return " ".join(sans_ponctuation.split())


def construire_index(acteurs: Iterable[dict], legislature: int) -> tuple[dict[str, str], set[str]]:
    """
    Index « prénom nom » normalisé → uid, restreint aux députés de la législature.

    Restreindre aux députés est ce qui évite d'attribuer à un sénateur ou à un
    ministre non député une intervention en commission.

    Les homonymes sont écartés plutôt qu'arbitrés : mieux vaut une intervention
    non attribuée qu'une intervention attribuée au mauvais député. Ils sont
    renvoyés à part pour pouvoir être signalés.
    """
    index: dict[str, str] = {}
    ambigus: set[str] = set()

    for acteur in acteurs:
        uid = acteur.get("uid")
        if not uid or not _est_depute(acteur, legislature):
            continue
        identite = ((acteur.get("etatCivil") or {}).get("ident")) or {}
        cle = normaliser(f"{identite.get('prenom', '')} {identite.get('nom', '')}")
        if not cle or cle.isspace():
            continue
        if cle in index and index[cle] != uid:
            ambigus.add(cle)
        else:
            index[cle] = uid

    for cle in ambigus:
        index.pop(cle, None)

    return index, ambigus


def _est_depute(acteur: dict, legislature: int) -> bool:
    mandats = (acteur.get("mandats") or {}).get("mandat")
    if mandats is None:
        return False
    if not isinstance(mandats, list):
        mandats = [mandats]
    return any(
        isinstance(m, dict)
        and m.get("typeOrgane") == "ASSEMBLEE"
        and str(m.get("legislature") or "") == str(legislature)
        for m in mandats
    )


def decomposer(nom_brut: str) -> tuple[str, str | None]:
    """
    Sépare un libellé d'orateur en (nom normalisé, fonction).

    « M. le président Éric Coquerel »   → ("eric coquerel", "president")
    « M. Charles Alloncle, rapporteur » → ("charles alloncle", "rapporteur")
    « M. le rapporteur »                → ("", "rapporteur")
    « M. Thibault Bazin (DR) »          → ("thibault bazin", None)
    """
    fonction = _detecter_fonction(nom_brut)

    nom = _PARENTHESES.sub("", nom_brut.split(",")[0])
    nom = normaliser(nom)
    nom = _CIVILITES.sub("", nom)
    nom = _FONCTION_EN_TETE.sub("", nom).strip()
    # « M. le président d'âge Roger Chudeau » : le qualificatif résiduel n'est
    # pas un prénom, on le retire s'il précède encore un nom composé.
    nom = re.sub(r"^d\s+age\s+", "", nom)

    return nom, fonction


def fonction_de_lorateur(nom_brut: str) -> str | None:
    """
    Fonction parlementaire portée par un libellé d'orateur, s'il y en a une.

    « Mme la présidente » → "presidente", « M. le rapporteur » → "rapporteur",
    « M. Thibault Bazin » → None.
    """
    return _detecter_fonction(nom_brut)


def _detecter_fonction(nom_brut: str) -> str | None:
    normalise = normaliser(nom_brut)
    for fonction in FONCTIONS:  # ordonnées du plus spécifique au plus général
        if re.search(rf"\b{re.escape(fonction)}\b", normalise):
            return fonction
    return None


class ResolveurOrateurs:
    """
    Résout les orateurs d'un compte rendu, dans l'ordre du débat.

    L'état est volontairement limité à un compte rendu : une fonction
    (« le rapporteur ») désigne une personne différente d'un texte à l'autre, la
    mémoriser au-delà du document produirait des attributions fausses.
    """

    def __init__(self, index: dict[str, str]):
        self.index = index
        self.compteur = Counter()
        self.non_resolus = Counter()

    def nouveau_compte_rendu(self) -> None:
        self._fonction_vers_uid: dict[str, str] = {}

    def resoudre(self, nom_brut: str) -> str | None:
        nom, fonction = decomposer(nom_brut)

        uid = self.index.get(nom) if nom else None
        if uid is not None:
            # Le nom est explicite : on retient la fonction qu'il occupe pour
            # résoudre les « M. le rapporteur » qui suivront dans ce document.
            if fonction:
                self._fonction_vers_uid[fonction] = uid
            self.compteur["resolus_par_nom"] += 1
            return uid

        if fonction and not nom:
            uid = self._fonction_vers_uid.get(fonction)
            if uid is not None:
                self.compteur["resolus_par_fonction"] += 1
                return uid

        self.compteur["non_resolus"] += 1
        if nom_brut.strip():
            self.non_resolus[nom_brut.strip()] += 1
        return None

    def rapport(self, limite: int = 30) -> dict[str, Any]:
        """Bilan chiffré, destiné à être publié avec les statistiques."""
        resolus = (
            self.compteur["resolus_par_nom"] + self.compteur["resolus_par_fonction"]
        )
        total = resolus + self.compteur["non_resolus"]
        return {
            "total": total,
            "resolus": resolus,
            "resolusParNom": self.compteur["resolus_par_nom"],
            "resolusParFonction": self.compteur["resolus_par_fonction"],
            "nonResolus": self.compteur["non_resolus"],
            "tauxResolution": round(resolus / total, 4) if total else 0.0,
            # Permet de vérifier qu'aucun député ne figure parmi les non résolus :
            # on n'y attend que des ministres, sénateurs et personnes auditionnées.
            "principauxNonResolus": [
                {"nom": nom, "occurrences": n}
                for nom, n in self.non_resolus.most_common(limite)
            ],
        }
