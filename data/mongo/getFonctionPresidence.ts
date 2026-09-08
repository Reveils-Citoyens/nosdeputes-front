import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";

/**
 * Fonction de présidence de séance exercée par un député, s'il en a une.
 *
 * Présider, c'est distribuer la parole et conduire les débats — pas prendre
 * position sur un texte. Les interventions faites à ce titre sont donc écartées
 * du compteur d'interventions, ce qui fait apparaître la présidente de
 * l'Assemblée à zéro alors qu'elle a pris la parole près de 9 500 fois.
 *
 * On ne nomme ici que les fonctions du Bureau — présidence et vice-présidences
 * de l'Assemblée. Les titres de président abondent ailleurs dans les mandats
 * (147 présidents de groupes d'amitié, par exemple) sans avoir de rapport avec
 * la conduite de la séance : les retenir désignerait n'importe qui.
 *
 * Pour tous les autres, dont les présidents de commission, l'explication passe
 * par le nombre d'interventions écartées affiché sur la carte et son (i).
 */

/**
 * Fonctions du Bureau qui impliquent de présider la séance publique.
 *
 * On reconnaît la fonction sur `libQualite`, que l'Assemblée publie toujours au
 * masculin — c'est sa clé canonique, pas un libellé d'affichage.
 */
const FONCTIONS_PRESIDENCE = [
  "président de l'assemblée nationale",
  "présidente de l'assemblée nationale",
  "vice-président de l'assemblée nationale",
  "vice-présidente de l'assemblée nationale",
  "président d'âge de l'assemblée nationale",
  "présidente d'âge de l'assemblée nationale",
];

const normaliser = (texte: string) =>
  texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "'")
    .trim();

const FONCTIONS_NORMALISEES = FONCTIONS_PRESIDENCE.map(normaliser);

/* eslint-disable @typescript-eslint/no-explicit-any */
function estPresidence(mandat: any): boolean {
  if (mandat?.typeOrgane !== "BUREAU" || mandat?.dateFin) return false;
  const qualite = mandat?.infosQualite?.libQualite;
  if (typeof qualite !== "string") return false;
  return FONCTIONS_NORMALISEES.includes(normaliser(qualite));
}

/**
 * Libellé à afficher : `libQualiteSex` porte le titre accordé au genre de la
 * personne. S'en passer ferait écrire « Président de l'Assemblée nationale »
 * sous le nom de Yaël Braun-Pivet.
 */
function libelle(mandat: any): string | null {
  const qualite = mandat?.infosQualite;
  return qualite?.libQualiteSex || qualite?.libQualite || null;
}

export const getFonctionPresidence = cache(
  async (acteurUid: string): Promise<string | null> => {
    if (!acteurUid) return null;
    try {
      const db = await getParlementDb();
      const acteur = await db
        .collection("acteurs")
        .findOne({ uid: acteurUid }, { projection: { _id: 0, "mandats.mandat": 1 } });

      const mandats = (acteur as any)?.mandats?.mandat;
      if (!mandats) return null;

      const liste = Array.isArray(mandats) ? mandats : [mandats];
      const presidence = liste.find(estPresidence);
      return presidence ? libelle(presidence) : null;
    } catch (error) {
      console.error("Error fetching fonction de présidence:", error);
      return null;
    }
  }
);
