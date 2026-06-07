import { unstable_cache } from "next/cache";
import { getParlementDb } from "@/lib/mongodb";
import { ThemeSlug } from "@/data/themes";

async function getThemeCountsUncached(): Promise<Record<ThemeSlug, number>> {
  // Pas de try/catch ici : on laisse l'erreur remonter pour qu'unstable_cache
  // NE mette PAS en cache un résultat vide en cas de panne Mongo (sinon des
  // compteurs à 0 seraient figés une heure). L'appelant gère le fallback.
  const db = await getParlementDb();
  const result = await db
    .collection("dossiers_enrichis")
    .aggregate([
      { $unwind: "$dossier_summary_enrichment.qualification.themes_senat" },
      {
        $group: {
          _id: "$dossier_summary_enrichment.qualification.themes_senat",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  return Object.fromEntries(result.map((r) => [r._id, r.count])) as Record<
    ThemeSlug,
    number
  >;
}

// Agrégation lourde mise en cache 1h (persistée entre requêtes) : exécutée une
// fois par heure au lieu d'à chaque visite — important sur une instance modeste.
// unstable_cache ne conserve pas les exceptions → une panne Mongo transitoire
// est réessayée à la requête suivante.
const cachedThemeCounts = unstable_cache(getThemeCountsUncached, ["theme-counts"], {
  revalidate: 3600,
});

export async function getThemeCounts(): Promise<Record<ThemeSlug, number>> {
  try {
    return await cachedThemeCounts();
  } catch (error) {
    console.error("[getThemeCounts] erreur:", error);
    return {} as Record<ThemeSlug, number>;
  }
}
