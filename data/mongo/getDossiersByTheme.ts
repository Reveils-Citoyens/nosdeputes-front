import { getParlementDb } from "@/lib/mongodb";
import { ThemeSlug } from "@/data/themes";

export type ThemeDossierResult = {
  uid: string;
  legislature: number;
  titre: string;
  type_initiative: string;
  date_depot: Date | null;
  date_dernier_acte: Date | null;
  tldr: string | null;
  current_stage: string | null;
  intensity: string | null;
  themes: string[];
  dossierBadge: string | null;
  heatScore: number;
};

export async function getDossiersByTheme(
  slug: ThemeSlug,
  options: { limit?: number; skip?: number; sort?: "relevance" | "date" } = {}
): Promise<{ items: ThemeDossierResult[]; total: number }> {
  try {
  const { limit = 20, skip = 0, sort = "relevance" } = options;
  const db = await getParlementDb();

  const matchStage = {
    "dossier_summary_enrichment.qualification.themes_senat": slug,
  };

  const total = await db
    .collection("dossiers_enrichis")
    .countDocuments(matchStage);

  const pipeline = [
    { $match: matchStage },
    // Lookup vers dossiers pour récupérer badge + heatScore
    {
      $lookup: {
        from: "dossiers",
        localField: "uid",
        foreignField: "uid",
        as: "_dossier",
        pipeline: [
          { $project: { _id: 0, dossierBadge: 1, heatScore: 1 } },
        ],
      },
    },
    { $addFields: { _d: { $arrayElemAt: ["$_dossier", 0] } } },
    {
      $sort:
        sort === "date"
          ? { date_dernier_acte: -1 }
          : { "_d.heatScore": -1, date_dernier_acte: -1 },
    },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        uid: 1,
        legislature: 1,
        titre: 1,
        type_initiative: 1,
        date_depot: 1,
        date_dernier_acte: 1,
        tldr: "$dossier_summary_enrichment.structured_summary.tldr",
        current_stage: "$dossier_summary_enrichment.navette_situation.current_stage",
        intensity: "$dossier_summary_enrichment.navette_situation.intensity",
        themes: "$dossier_summary_enrichment.qualification.themes_senat",
        dossierBadge: "$_d.dossierBadge",
        heatScore: { $ifNull: ["$_d.heatScore", 0] },
      },
    },
  ];

  const docs = await db
    .collection("dossiers_enrichis")
    .aggregate(pipeline)
    .toArray();

  return {
    items: docs.map((d) => ({
      uid: d.uid,
      legislature: d.legislature,
      titre: d.titre,
      type_initiative: d.type_initiative,
      date_depot: d.date_depot ?? null,
      date_dernier_acte: d.date_dernier_acte ?? null,
      tldr: d.tldr ?? null,
      current_stage: d.current_stage ?? null,
      intensity: d.intensity ?? null,
      themes: Array.isArray(d.themes) ? d.themes : [],
      dossierBadge: d.dossierBadge ?? null,
      heatScore: d.heatScore ?? 0,
    })),
    total,
  };
  } catch (error) {
    console.error("[getDossiersByTheme] erreur:", error);
    return { items: [], total: 0 };
  }
}
