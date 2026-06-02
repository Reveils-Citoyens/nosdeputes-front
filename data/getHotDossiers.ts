import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";

export type HotDossier = {
  uid: string;
  legislature: string;
  titre: string;
  typeLabel: string | null;
  heatScore: number;
  badge: string | null;
  tldr: string | null;
  themes: string[];
};

async function getHotDossiersUnCached(
  limit = 12,
  legislature = "17"
): Promise<HotDossier[]> {
  const db = await getParlementDb();

  const pipeline = [
    {
      $match: {
        "@xsi:type": { $regex: /^Dossier/ },
        legislature,
        heatScore: { $gt: 0 },
      },
    },
    { $sort: { heatScore: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "dossiers_enrichis",
        localField: "uid",
        foreignField: "uid",
        as: "_enrichi",
        pipeline: [
          {
            $project: {
              _id: 0,
              tldr: "$dossier_summary_enrichment.structured_summary.tldr",
              themes: "$dossier_summary_enrichment.qualification.themes_senat",
            },
          },
        ],
      },
    },
    {
      $project: {
        _id: 0,
        uid: 1,
        legislature: 1,
        titre: "$titreDossier.titre",
        typeLabel: "$procedureParlementaire.libelle",
        heatScore: 1,
        badge: "$dossierBadge",
        tldr: { $arrayElemAt: ["$_enrichi.tldr", 0] },
        themes: { $arrayElemAt: ["$_enrichi.themes", 0] },
      },
    },
  ];

  const docs = await db.collection("dossiers").aggregate(pipeline).toArray();

  return docs.map((d) => ({
    uid: d.uid,
    legislature: d.legislature,
    titre: d.titre ?? "",
    typeLabel: typeof d.typeLabel === "string" ? d.typeLabel : null,
    heatScore: d.heatScore ?? 0,
    badge: d.badge ?? null,
    tldr: typeof d.tldr === "string" ? d.tldr : null,
    themes: Array.isArray(d.themes)
      ? d.themes.filter((t: unknown) => typeof t === "string")
      : [],
  }));
}

export const getHotDossiers = cache(getHotDossiersUnCached);
