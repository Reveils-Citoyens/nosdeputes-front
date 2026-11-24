import { getParlementDb } from "@/lib/mongodb";

export type DossierSearchResult = {
  uid: string;
  titre: string;
  legislature: string;
  typeLibelle: string | null;
  score: number;
  heatScore: number;
  discussionScore: number;
  amendementsTotal: number;
  auteursUniques: number;
  scrutinsTotal: number;
  nextAgendaDate: string | null;
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

const CHEMINS_TITRES = ["titreDossier.titre", "titres.titrePrincipal", "titres.titrePrincipalCourt"];

/** Mots sans valeur de recherche : l'analyseur français les ignore aussi. */
const MOTS_VIDES = new Set([
  "de", "du", "des", "la", "le", "les", "l", "d", "a", "à", "au", "aux", "et", "ou",
  "en", "un", "une", "pour", "par", "sur", "dans",
]);

/** « Réforme des retraites » → ["réforme", "retraites"] ; « l'aide à mourir » → ["aide", "mourir"]. */
export function motsSignificatifs(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s'’]+/)
    .map((m) => m.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter((m) => m && !MOTS_VIDES.has(m));
}

/**
 * Clause Atlas Search. Un seul mot : recherche approchée (une faute tolérée)
 * et par début de mot (« Arcelor » → « ArcelorMittal »).
 *
 * Plusieurs mots : chacun est exigé, et l'expression exacte remonte en tête.
 * Sans cela, `text` renvoyait les titres contenant l'UN des mots : « Mettre
 * fin au devoir conjugal » sortait pour « fin de vie », « Réformer le
 * collège » pour « réforme des retraites ».
 */
export function clauseRecherche(query: string) {
  const mots = motsSignificatifs(query);
  if (mots.length <= 1) {
    return {
      compound: {
        should: [
          {
            text: {
              query,
              path: CHEMINS_TITRES,
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
              path: CHEMINS_TITRES,
              allowAnalyzedField: true,
              score: { boost: { value: 2 } },
            },
          },
        ],
      },
    };
  }
  const texte = (mot: string) => ({
    text: {
      query: mot,
      path: CHEMINS_TITRES,
      // Une faute tolérée sur les mots longs seulement : sur un mot court,
      // elle en change le sens (« vie » → « vote »).
      ...(mot.length >= 5 ? { fuzzy: { maxEdits: 1, prefixLength: 2 } } : {}),
    },
  });
  return {
    compound: {
      must: mots.map((mot, i) =>
        i < mots.length - 1
          ? texte(mot)
          : {
              // Dernier mot : aussi par son début, pour la recherche pendant la
              // frappe (« intelligence art » → « intelligence artificielle »).
              compound: {
                should: [
                  texte(mot),
                  { wildcard: { query: `${mot}*`, path: CHEMINS_TITRES, allowAnalyzedField: true } },
                ],
                minimumShouldMatch: 1,
              },
            }
      ),
      should: [{ phrase: { query, path: CHEMINS_TITRES, slop: 1, score: { boost: { value: 3 } } } }],
    },
  };
}

/**
 * Recherche de dossiers législatifs par titre via Atlas Search.
 * Les titres des textes d'un dossier (proposition, texte adopté…) sont
 * cherchés aussi, puis rattachés à leur dossier : le dossier « Fin de vie »
 * n'était pas trouvé par « aide à mourir », qui ne figure que dans le titre de
 * ses textes. Un seul résultat par dossier, avec le meilleur score.
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
    sort?: "relevance" | "date" | "agenda";
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
        ...clauseRecherche(query),
      },
    },
    // Un texte trouvé compte pour son dossier, avec le meilleur score des deux.
    {
      $group: {
        _id: { $ifNull: ["$dossierRef", "$uid"] },
        _searchScore: { $max: { $meta: "searchScore" } },
      },
    },
    {
      $lookup: {
        from: "dossiers",
        localField: "_id",
        foreignField: "uid",
        as: "_dossier",
        pipeline: [
          {
            $project: {
              uid: 1, "@xsi:type": 1, legislature: 1, dossierRef: 1, chambre: 1,
              titreDossier: 1, titres: 1, procedureParlementaire: 1, classification: 1,
              dossierBadge: 1, heatComponents: 1, heatScore: 1, discussionScore: 1, nextAgendaDate: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$_dossier" },
    { $replaceRoot: { newRoot: { $mergeObjects: ["$_dossier", { _searchScore: "$_searchScore" }] } } },
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
              candidate: { $ifNull: ["$nextAgendaDate", "$heatComponents.last_acte_date"] },
            },
            in: {
              $cond: [
                {
                  $gt: [
                    { $convert: { input: "$$candidate", to: "date", onError: null, onNull: null } },
                    new Date(),
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
      // La pertinence textuelle reste prioritaire, mais seuls des signaux de
      // discussion réels peuvent apporter un bonus de popularité.
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
    {
      $addFields: {
        _finalScore: {
          $add: [
            "$_searchScore",
            { $multiply: ["$_discussionScore", HEAT_BOOST_FACTOR] },
          ],
        },
      },
    },
    // Seuil de pertinence : on écarte les matchs trop faibles (wildcard seul, faute
    // tolérée sur mot court, 1 mot sur 5…). Affecte également le total retourné.
    { $match: { _searchScore: { $gte: MIN_SEARCH_SCORE } } },
    { $match: sort === "agenda" ? { _nextAgendaDate: { $ne: null } } : {} },
    {
      $sort:
        sort === "agenda"
          ? { _nextAgendaDate: 1, _finalScore: -1 }
          : sort === "date"
            ? { _lastSignalDate: -1, _finalScore: -1 }
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
