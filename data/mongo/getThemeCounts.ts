import { getParlementDb } from "@/lib/mongodb";
import { ThemeSlug } from "@/data/themes";

export async function getThemeCounts(): Promise<Record<ThemeSlug, number>> {
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
