import { NextRequest, NextResponse } from "next/server";
import { getParlementDb } from "@/lib/mongodb";
import type { DossierSearchResult } from "@/data/mongo/searchDossierParTitre";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const legislature = sp.get("legislature") ?? "17";
  const codeProcedure = sp.get("codeProcedure") ?? "";
  const badge = sp.get("badge") ?? "";
  const theme = sp.get("theme") ?? "";
  const sort = sp.get("sort") === "popular" ? "popular" : "recent";
  const skip = Math.max(parseInt(sp.get("skip") ?? "0", 10) || 0, 0);
  const limit = Math.min(parseInt(sp.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);

  const db = await getParlementDb();

  const matchFilter: Record<string, unknown> = {
    "@xsi:type": { $regex: /^Dossier/ },
    legislature,
    dossierRef: null,
    chambre: { $ne: "SN" },
  };
  if (codeProcedure) matchFilter["procedureParlementaire.code"] = codeProcedure;
  if (badge) matchFilter["dossierBadge"] = badge;

  if (theme) {
    const enrichis = await db
      .collection("dossiers_enrichis")
      .find(
        { "dossier_summary_enrichment.qualification.themes_senat": theme },
        { projection: { _id: 0, uid: 1 } }
      )
      .toArray();
    const uids = enrichis.map((d) => d.uid).filter(Boolean);
    matchFilter["uid"] = { $in: uids };
  }

  const [items, totalArr] = await Promise.all([
    db.collection("dossiers")
      .find(matchFilter, {
        projection: {
          _id: 0,
          uid: 1,
          legislature: 1,
          "titreDossier.titre": 1,
          "procedureParlementaire.libelle": 1,
          heatScore: 1,
          dossierBadge: 1,
          "heatComponents.amendements_total": 1,
          "heatComponents.n_auteurs_uniques": 1,
        },
      })
      .sort(sort === "popular" ? { heatScore: -1 } : { "heatComponents.last_acte_date": -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("dossiers").countDocuments(matchFilter),
  ]);

  const results: DossierSearchResult[] = items.map((d) => ({
    uid: d.uid,
    titre: d.titreDossier?.titre ?? "",
    legislature: d.legislature,
    typeLibelle: d.procedureParlementaire?.libelle ?? null,
    score: 0,
    heatScore: d.heatScore ?? 0,
    amendementsTotal: d.heatComponents?.amendements_total ?? 0,
    auteursUniques: d.heatComponents?.n_auteurs_uniques ?? 0,
    badge: (d.dossierBadge as string | undefined) ?? null,
  }));

  return NextResponse.json({ items: results, total: totalArr });
}
