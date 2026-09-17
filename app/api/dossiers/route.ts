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
  const sortParam = sp.get("sort");
  const sort = sortParam === "recent" || sortParam === "agenda" ? sortParam : "popular";
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

  const now = new Date();
  const sortSpec: Record<string, 1 | -1> =
    sort === "agenda"
      ? { _nextAgendaDate: 1, _discussionScore: -1, uid: 1 }
      : sort === "recent"
        ? { _lastSignalDate: -1, _discussionScore: -1, uid: 1 }
        : { _discussionScore: -1, _lastSignalDate: -1, heatScore: -1, uid: 1 };

  const pipeline: Record<string, unknown>[] = [
    { $match: matchFilter },
    {
      // Compatibilité avec les documents calculés avant l'ajout de
      // discussionScore/nextAgendaDate : on reconstruit des clés sûres à
      // partir des compteurs existants jusqu'au prochain import nocturne.
      $addFields: {
        _hasDiscussion: {
          $or: [
            { $gt: [{ $ifNull: ["$heatComponents.amendements_total", 0] }, 0] },
            { $gt: [{ $ifNull: ["$heatComponents.n_scrutins", 0] }, 0] },
          ],
        },
        _nextAgendaDate: {
          $let: {
            vars: {
              candidate: {
                $ifNull: ["$nextAgendaDate", "$heatComponents.last_acte_date"],
              },
            },
            in: {
              $cond: [
                {
                  $gt: [
                    {
                      $convert: {
                        input: "$$candidate",
                        to: "date",
                        onError: null,
                        onNull: null,
                      },
                    },
                    now,
                  ],
                },
                "$$candidate",
                null,
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        _discussionScore: {
          $cond: [
            "$_hasDiscussion",
            { $ifNull: ["$discussionScore", { $ifNull: ["$heatScore", 0] }] },
            0,
          ],
        },
        _lastSignalDate: {
          $cond: ["$_hasDiscussion", "$heatComponents.last_signal_date", null],
        },
      },
    },
    ...(sort === "agenda" ? [{ $match: { _nextAgendaDate: { $ne: null } } }] : []),
    { $sort: sortSpec },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              uid: 1,
              titre: { $ifNull: ["$titreDossier.titre", ""] },
              legislature: 1,
              typeLibelle: { $ifNull: ["$procedureParlementaire.libelle", null] },
              score: { $literal: 0 },
              heatScore: { $ifNull: ["$heatScore", 0] },
              discussionScore: "$_discussionScore",
              amendementsTotal: { $ifNull: ["$heatComponents.amendements_total", 0] },
              auteursUniques: { $ifNull: ["$heatComponents.n_auteurs_uniques", 0] },
              scrutinsTotal: { $ifNull: ["$heatComponents.n_scrutins", 0] },
              nextAgendaDate: "$_nextAgendaDate",
              badge: { $ifNull: ["$dossierBadge", null] },
            },
          },
        ],
        total: [{ $count: "n" }],
      },
    },
  ];

  const [facet] = await db.collection("dossiers").aggregate(pipeline).toArray();
  const results = (facet?.items ?? []) as DossierSearchResult[];
  const total = (facet?.total?.[0]?.n ?? 0) as number;

  return NextResponse.json({ items: results, total });
}
