import { getParlementDb } from "@/lib/mongodb";

/**
 * Forme compatible avec ce que `components/folders/AmendementCard.tsx`
 * attend : on ne définit que les champs réellement lus par le composant.
 */
export type AmendementSearchResult = {
  uid: string;
  numeroLong: string | null;
  sortAmendement: string | null;
  dispositif: string | null;
  exposeSommaire: string | null;
  nombreCoSignataires: number;
  typeAuteur: string | null;
  dateDepot: Date | null;
  dateSort: Date | null;
  dossierRefUid: string | null;
  dossierTitre: string | null;
  dossierLegislature: string | null;
  acteurRefUid: string | null;
};

/**
 * Convertit un texte brut en pattern regex qui matche à la fois le texte brut
 * ET les caractères encodés en HTML (&#x00E9; style entités).
 * Nécessaire car exposeSommaire/dispositif contiennent du HTML encodé.
 */
function buildHtmlAwarePattern(text: string): string {
  let pattern = "";
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code < 128) {
      // ASCII : échapper les caractères spéciaux regex
      pattern += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    } else {
      // Non-ASCII (é, à, ê…) : matcher le caractère brut OU toute entité HTML
      const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      pattern += `(?:${escaped}|&#[^;]{1,8};)`;
    }
  }
  return pattern;
}

/**
 * Recherche d'amendements directement dans le contenu (exposeSommaire + dispositif).
 *
 * Stratégie :
 *   1. Regex match sur `exposeSommaire` et/ou `dispositif` dans la collection amendements.
 *   2. Score de pertinence différencié :
 *      - Préfixe de mot dans exposeSommaire → fort (substance argumentative)
 *      - Sous-chaîne dans exposeSommaire → moyen
 *      - Préfixe dans dispositif → faible (texte souvent formulaique / orthographique)
 *      - Sous-chaîne dans dispositif seul → très faible
 *   3. Lookup pipeline pour récupérer le titre du dossier parent.
 */
export async function searchAmendementMongo(
  query: string,
  options: {
    limit?: number;
    skip?: number;
    legislature?: string;
    sort?: "relevance" | "date";
  } = {}
): Promise<{ items: AmendementSearchResult[]; total: number }> {
  const q = query.trim();
  if (q.length < 5) return { items: [], total: 0 };

  const { limit = 5, skip = 0, legislature = "17", sort = "relevance" } = options;
  const db = await getParlementDb();

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Les champs exposeSommaire et dispositif contiennent du HTML avec des entités
  // encodées (ex. &#x00E9; pour é). On construit un pattern qui matche à la fois
  // le caractère brut ET n'importe quelle entité HTML à sa place.
  const htmlAwareEscaped = buildHtmlAwarePattern(q);

  const regex = new RegExp(htmlAwareEscaped, "i");
  const wordPrefixPattern = `(?<![A-Za-zÀ-ÿ&])${htmlAwareEscaped}`;

  // La legislature peut être stockée en entier (17) ou en string ("17") selon les docs.
  const legInt = parseInt(legislature, 10);
  const legFilter = { $in: [legInt, legislature] };

  const contentFilter = {
    "corps.contenuAuteur.exposeSommaire": { $exists: true, $nin: [null, ""] },
    "corps.contenuAuteur.dispositif": { $exists: true, $nin: [null, ""] },
  };

  const matchStage = {
    legislature: legFilter,
    ...contentFilter,
    $or: [
      { "corps.contenuAuteur.exposeSommaire": regex },
      { "corps.contenuAuteur.dispositif": regex },
    ],
  };

  // Total pour la pagination ("X restants")
  const total = await db.collection("amendements").countDocuments(matchStage);
  if (total === 0) return { items: [], total: 0 };

  const pipeline = [
    { $match: matchStage },
    // ── Scoring de pertinence ────────────────────────────────────────────────
    {
      $addFields: {
        _relevance:
          sort === "relevance"
            ? {
                $add: [
                  // Préfixe de mot dans exposé sommaire → argumentaire ciblé
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: { $ifNull: ["$corps.contenuAuteur.exposeSommaire", ""] },
                          regex: wordPrefixPattern,
                          options: "i",
                        },
                      },
                      50,
                      0,
                    ],
                  },
                  // Sous-chaîne dans exposé sommaire
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: { $ifNull: ["$corps.contenuAuteur.exposeSommaire", ""] },
                          regex: escaped,
                          options: "i",
                        },
                      },
                      20,
                      0,
                    ],
                  },
                  // Préfixe de mot dans dispositif (texte juridique, souvent formulaïque)
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: { $ifNull: ["$corps.contenuAuteur.dispositif", ""] },
                          regex: wordPrefixPattern,
                          options: "i",
                        },
                      },
                      10,
                      0,
                    ],
                  },
                  // Sous-chaîne dans dispositif seul
                  {
                    $cond: [
                      {
                        $regexMatch: {
                          input: { $ifNull: ["$corps.contenuAuteur.dispositif", ""] },
                          regex: escaped,
                          options: "i",
                        },
                      },
                      3,
                      0,
                    ],
                  },
                ],
              }
            : 0,
      },
    },
    {
      $sort:
        sort === "date"
          ? { "cycleDeVie.dateSort": -1, "cycleDeVie.dateDepot": -1 }
          : { _relevance: -1, "cycleDeVie.dateSort": -1 },
    },
    { $skip: skip },
    { $limit: limit },
    // ── Lookup texte de loi → dossier parent ────────────────────────────────
    {
      $lookup: {
        from: "dossiers",
        localField: "texteLegislatifRef",
        foreignField: "uid",
        as: "_texte",
        pipeline: [{ $project: { _id: 0, dossierRef: 1, legislature: 1 } }],
      },
    },
    { $addFields: { _texteInfo: { $arrayElemAt: ["$_texte", 0] } } },
    {
      $lookup: {
        from: "dossiers",
        localField: "_texteInfo.dossierRef",
        foreignField: "uid",
        as: "_dossier",
        pipeline: [
          {
            $project: {
              _id: 0,
              uid: 1,
              titre: { $ifNull: ["$titreDossier.titre", "$titres.titrePrincipal"] },
              legislature: 1,
            },
          },
        ],
      },
    },
    { $addFields: { _dossierInfo: { $arrayElemAt: ["$_dossier", 0] } } },
    {
      $project: {
        _id: 0,
        uid: 1,
        legislature: 1,
        texteLegislatifRef: 1,
        "identification.numeroLong": 1,
        "cycleDeVie.sort": 1,
        "cycleDeVie.dateDepot": 1,
        "cycleDeVie.dateSort": 1,
        "corps.contenuAuteur.exposeSommaire": 1,
        "corps.contenuAuteur.dispositif": 1,
        "signataires.auteur.acteurRef": 1,
        "signataires.auteur.typeAuteur": 1,
        "signataires.cosignataires.acteurRef": 1,
        _dossierInfo: 1,
        _texteInfo: 1,
      },
    },
  ];

  const amendements = await db
    .collection("amendements")
    .aggregate(pipeline)
    .toArray();

  return {
    items: amendements.map((a) => {
      const cosignataires = a.signataires?.cosignataires?.acteurRef;
      const nombreCoSignataires = Array.isArray(cosignataires)
        ? cosignataires.length
        : cosignataires
        ? 1
        : 0;
      const rawSort = a.cycleDeVie?.sort;
      const sortStr =
        typeof rawSort === "string" && rawSort.trim() ? rawSort : null;

      return {
        uid: a.uid,
        numeroLong: a.identification?.numeroLong ?? null,
        sortAmendement: sortStr,
        dispositif: a.corps?.contenuAuteur?.dispositif ?? null,
        exposeSommaire: a.corps?.contenuAuteur?.exposeSommaire ?? null,
        nombreCoSignataires,
        typeAuteur: a.signataires?.auteur?.typeAuteur ?? null,
        dateDepot: a.cycleDeVie?.dateDepot
          ? new Date(a.cycleDeVie.dateDepot)
          : null,
        dateSort: a.cycleDeVie?.dateSort
          ? new Date(a.cycleDeVie.dateSort)
          : null,
        dossierRefUid: a._dossierInfo?.uid ?? null,
        dossierTitre: a._dossierInfo?.titre ?? null,
        dossierLegislature: a._dossierInfo?.legislature
          ? String(a._dossierInfo.legislature)
          : String(a.legislature ?? legislature),
        acteurRefUid: a.signataires?.auteur?.acteurRef ?? null,
      };
    }),
    total,
  };
}
