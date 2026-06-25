import { getParlementDb } from "@/lib/mongodb";

export type DossierSearchResult = {
  uid: string;
  titre: string;
  legislature: string;
  typeLibelle: string | null;
  score: number;
  heatScore: number;
  amendementsTotal: number;
  auteursUniques: number;
  badge: string | null;
};

/**
 * Boost additif appliqué au heatScore (0-1) dans le tri final.
 * Le searchScore Atlas est typiquement dans la fourchette 1-10 pour les
 * matchs textuels. Un boost de 4 fait remonter significativement les dossiers
 * "chauds" à pertinence textuelle équivalente, sans écraser un match exact.
 */
const HEAT_BOOST_FACTOR = 4;

/**
 * Score Atlas Search minimal en dessous duquel un dossier est écarté.
 * Les scores < 1.5 correspondent typiquement à des matchs très partiels
 * (wildcard seul, 1 mot sur N, faute tolérée sur un mot court).
 */
const MIN_SEARCH_SCORE = 1.5;

/**
 * Recherche de dossiers législatifs par titre via Atlas Search.
 * Ne retourne que les dossiers racines (dossierRef: null), donc un seul
 * résultat distinct par dossier.
 * Filtre optionnel sur la législature (défaut : "17").
 *
 * Le ranking combine :
 *   - pertinence textuelle Atlas Search
 *   - heatScore pré-calculé (densité d'amendements, débat, dissidence)
 *     via `scripts/compute_dossier_heat_score.py`
 */
export async function searchDossierParTitre(
  query: string,
  options: {
    limit?: number;
    skip?: number;
    legislature?: string;
    sort?: "relevance" | "date";
    codeProcedure?: string;
    badge?: string;
    theme?: string;
  } = {}
): Promise<{ items: DossierSearchResult[]; total: number }> {
  if (!query.trim()) return { items: [], total: 0 };

  const { limit = 10, skip = 0, legislature = "17", sort = "relevance", codeProcedure, badge, theme } = options;

  try {
  const db = await getParlementDb();

  // Filtre par thème : les thèmes vivent dans dossiers_enrichis (themes_senat).
  // On récupère les UIDs correspondants pour les injecter dans le $match du search.
  let themeUids: string[] | null = null;
  if (theme) {
    const enrichis = await db
      .collection("dossiers_enrichis")
      .find(
        { "dossier_summary_enrichment.qualification.themes_senat": theme },
        { projection: { _id: 0, uid: 1 } }
      )
      .toArray();
    themeUids = enrichis.map((d) => d.uid).filter(Boolean);
    // Aucun dossier pour ce thème → résultat vide garanti.
    if (themeUids.length === 0) return { items: [], total: 0 };
  }

  const pipeline = [
    {
      $search: {
        index: "dossiers_search",
        compound: {
          should: [
            {
              text: {
                query,
                path: ["titreDossier.titre", "titres.titrePrincipal", "titres.titrePrincipalCourt"],
                fuzzy: { maxEdits: 1, prefixLength: 2 },
                score: { boost: { value: 2 } },
              },
            },
            {
              // Match par préfixe : "Arcelor" → "ArcelorMittal". C'est un signal
              // FORT (l'utilisateur tape le début d'un mot), donc on le booste
              // pour qu'il passe le seuil MIN_SEARCH_SCORE (sinon score plat ~1.0,
              // écarté comme du bruit).
              wildcard: {
                query: `${query.toLowerCase()}*`,
                path: ["titreDossier.titre", "titres.titrePrincipal", "titres.titrePrincipalCourt"],
                allowAnalyzedField: true,
                score: { boost: { value: 2 } },
              },
            },
          ],
        },
      },
    },
    {
      $match: {
        // Tous les types de dossier — exclut les documents enfants (texteLoi_Type, etc.)
        // Les docs enfants ont par ailleurs tous un dossierRef non-null, donc
        // le filtre suivant les exclut aussi : ceinture + bretelles.
        "@xsi:type": { $regex: /^Dossier/ },
        legislature,
        dossierRef: null,
        chambre: { $ne: "SN" }, // les dossiers AN n'ont pas de champ chambre; seuls les dossiers SN l'ont
        ...(codeProcedure ? { "procedureParlementaire.code": codeProcedure } : {}),
        ...(badge ? { dossierBadge: badge } : {}),
        ...(themeUids ? { uid: { $in: themeUids } } : {}),
      },
    },
    {
      // Combine relevance textuelle et heat score pour le tri final.
      $addFields: {
        _searchScore: { $meta: "searchScore" },
        _finalScore: {
          $add: [
            { $meta: "searchScore" },
            {
              $multiply: [
                { $ifNull: ["$heatScore", 0] },
                HEAT_BOOST_FACTOR,
              ],
            },
          ],
        },
      },
    },
    // Seuil de pertinence : on écarte les matchs trop faibles (wildcard seul, faute
    // tolérée sur mot court, 1 mot sur 5…). Affecte également le total retourné.
    { $match: { _searchScore: { $gte: MIN_SEARCH_SCORE } } },
    // En mode "date", tri par date du dernier acte législatif (heatComponents.last_acte_date),
    // tie-breaker sur _finalScore. Les dossiers sans date remontent en dernier ($ifNull → "").
    {
      $addFields:
        sort === "date"
          ? { _lastActeDate: { $ifNull: ["$heatComponents.last_acte_date", ""] } }
          : {},
    },
    {
      $sort:
        sort === "date"
          ? { _lastActeDate: -1, _finalScore: -1 }
          : { _finalScore: -1 },
    },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              uid: 1,
              titre: {
                $ifNull: ["$titreDossier.titre", "$titres.titrePrincipal"],
              },
              legislature: 1,
              typeLibelle: {
                $ifNull: [
                  "$procedureParlementaire.libelle",
                  "$classification.type.libelle",
                ],
              },
              score: "$_searchScore",
              heatScore: { $ifNull: ["$heatScore", 0] },
              amendementsTotal: { $ifNull: ["$heatComponents.amendements_total", 0] },
              auteursUniques: { $ifNull: ["$heatComponents.n_auteurs_uniques", 0] },
              badge: { $ifNull: ["$dossierBadge", null] },
            },
          },
        ],
        total: [{ $count: "n" }],
      },
    },
  ];

  const [facet] = await db
    .collection("dossiers")
    .aggregate(pipeline)
    .toArray();

  return {
    items: (facet?.items ?? []) as DossierSearchResult[],
    total: (facet?.total?.[0]?.n ?? 0) as number,
  };
  } catch (error) {
    console.error("[searchDossierParTitre] erreur:", error);
    return { items: [], total: 0 };
  }
}
