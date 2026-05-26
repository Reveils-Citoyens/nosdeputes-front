import { NextRequest, NextResponse } from "next/server";
import { getParlementDb } from "@/lib/mongodb";
import type { DossierSearchResult } from "@/data/mongo/searchDossierParTitre";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * GET /api/dossiers
 * Listing paginé de dossiers législatifs depuis MongoDB, triés par heatScore desc.
 * Paramètres :
 *   - legislature (défaut : "17")
 *   - codeProcedure (optionnel, filtre sur procedureParlementaire.code)
 *   - skip (défaut : 0)
 *   - limit (défaut : 20, max 50)
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const legislature = sp.get("legislature") ?? "17";
  const codeProcedure = sp.get("codeProcedure") ?? "";
  const skip = Math.max(parseInt(sp.get("skip") ?? "0", 10) || 0, 0);
  const limit = Math.min(parseInt(sp.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);

  const db = await getParlementDb();

  // Inclut tous les types de dossier (DossierLegislatif_Type, DossierResolutionAN,
  // DossierMissionControle_Type, DossierMissionInformation_Type, etc.)
  // mais exclut les documents annexes (texteLoi_Type, rapportParlementaire_Type, …).
  const matchFilter: Record<string, unknown> = {
    "@xsi:type": { $regex: /^Dossier/ },
    legislature,
    dossierRef: null,
    chambre: { $ne: "SN" },
  };
  if (codeProcedure) {
    matchFilter["procedureParlementaire.code"] = codeProcedure;
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
      .sort({ heatScore: -1 })
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
