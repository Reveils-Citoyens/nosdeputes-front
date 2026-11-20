import { unstable_cache } from "next/cache";
import { getParlementDb } from "@/lib/mongodb";
import { VALEURS_PAR_DEFAUT, type ValeursMethode } from "@/data/methodeStatistiques";

const LEGISLATURE = 17;

/**
 * Valeurs citées dans les explications des statistiques : effectif de
 * comparaison, taux de rattachement des orateurs de commission, date du
 * dernier calcul. Toutes produites par statistiques_activite.py.
 *
 * En cas de panne, renvoie les valeurs par défaut (seuil seul) : les phrases
 * qui citent une valeur inconnue sont alors omises, jamais affichées à trous.
 */
async function lireValeurs(): Promise<ValeursMethode> {
  try {
    const db = await getParlementDb();
    const [distribution, qualite] = await Promise.all([
      db
        .collection("statistiques_distributions")
        .findOne(
          { legislature: LEGISLATURE, periode: "LAST_YEAR", mesure: "interventions" },
          { projection: { _id: 0, effectifReference: 1 } },
        ),
      db
        .collection("statistiques_qualite")
        .findOne({ legislature: LEGISLATURE }, { projection: { _id: 0, tauxResolution: 1, calculeLe: 1 } }),
    ]);
    return {
      ...VALEURS_PAR_DEFAUT,
      effectif: typeof distribution?.effectifReference === "number" ? distribution.effectifReference : null,
      tauxRattachement: typeof qualite?.tauxResolution === "number" ? qualite.tauxResolution : null,
      // Stockée en Date ou en chaîne selon l'écriture : normalisée en ISO.
      dateCalcul: qualite?.calculeLe ? new Date(qualite.calculeLe).toISOString() : null,
    };
  } catch (error) {
    console.error("[getValeursMethode]", error);
    throw error;
  }
}

// Une panne n'est pas mise en cache (unstable_cache ne stocke pas les
// exceptions) ; l'appelant se replie alors sur les valeurs par défaut.
const enCache = unstable_cache(lireValeurs, ["valeurs-methode-statistiques-v2"], { revalidate: 3600 });

export async function getValeursMethode(): Promise<ValeursMethode> {
  try {
    return await enCache();
  } catch {
    return VALEURS_PAR_DEFAUT;
  }
}
