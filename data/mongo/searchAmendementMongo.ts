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
 * Après tri et pagination sur des clés légères : relecture des documents
 * retenus puis rattachement texte de loi → dossier parent.
 */
const PIPELINE_ENRICHISSEMENT: Record<string, unknown>[] = [
  {
    $lookup: {
      from: "amendements", localField: "_id", foreignField: "_id", as: "_original",
    },
  },
  { $replaceRoot: { newRoot: { $arrayElemAt: ["$_original", 0] } } },
  // ── Lookup texte de loi → dossier parent ────────────────────────────────
  // Les textes sont dans `documents`, alimentée par l'import nocturne. La
  // collection `dossiers` en contient aussi d'anciens, non mis à jour : les
  // textes récents (dont ceux de commission, « BTC ») y manquent, et 9,5 % des
  // amendements restaient sans dossier.
  {
    $lookup: {
      from: "documents",
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

/**
 * Une date absente est stockée comme objet `{ "@xsi:nil": "true" }` : sans ce
 * filtre, `new Date(objet)` donnait « Invalid Date » à l'affichage.
 */
function versDate(valeur: unknown): Date | null {
  if (typeof valeur !== "string" && !(valeur instanceof Date)) return null;
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Document enrichi (pipeline ci-dessus) → carte de résultat. */
function versResultat(a: Record<string, any>, legislature: string): AmendementSearchResult {
  const cosignataires = a.signataires?.cosignataires?.acteurRef;
  const nombreCoSignataires = Array.isArray(cosignataires)
    ? cosignataires.length
    : cosignataires
    ? 1
    : 0;
  const rawSort = a.cycleDeVie?.sort;
  const sortStr = typeof rawSort === "string" && rawSort.trim() ? rawSort : null;

  return {
    uid: a.uid,
    numeroLong: a.identification?.numeroLong ?? null,
    sortAmendement: sortStr,
    dispositif: a.corps?.contenuAuteur?.dispositif ?? null,
    exposeSommaire: a.corps?.contenuAuteur?.exposeSommaire ?? null,
    nombreCoSignataires,
    typeAuteur: a.signataires?.auteur?.typeAuteur ?? null,
    dateDepot: versDate(a.cycleDeVie?.dateDepot),
    dateSort: versDate(a.cycleDeVie?.dateSort),
    dossierRefUid: a._dossierInfo?.uid ?? null,
    dossierTitre: a._dossierInfo?.titre ?? null,
    dossierLegislature: a._dossierInfo?.legislature
      ? String(a._dossierInfo.legislature)
      : String(a.legislature ?? legislature),
    acteurRefUid: a.signataires?.auteur?.acteurRef ?? null,
  };
}

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

type OptionsRecherche = {
  limit?: number;
  skip?: number;
  legislature?: string;
  sort?: "relevance" | "date";
};
type ResultatsRecherche = { items: AmendementSearchResult[]; total: number };

/**
 * Recherche d'amendements dans le contenu (exposeSommaire + dispositif).
 *
 * Index Atlas Search `amendements_search` quand il est interrogeable (créé par
 * `scripts/creer_index_recherche_amendements.mjs`), sinon parcours par
 * expressions régulières. Le repli couvre l'index absent, en construction ou
 * en panne : `$search` sur un index inexistant ne lève pas d'erreur, il ne
 * renvoie simplement rien, d'où la vérification préalable.
 */
export async function searchAmendementMongo(
  query: string,
  options: OptionsRecherche = {}
): Promise<ResultatsRecherche> {
  const q = query.trim();
  if (q.length < 5) return { items: [], total: 0 };

  if (await indexRechercheDisponible()) {
    try {
      return await searchAmendementAtlas(q, options);
    } catch (error) {
      console.error("[searchAmendementMongo] Atlas Search en échec, repli regex:", error);
    }
  }
  return searchAmendementRegex(q, options);
}

export const INDEX_RECHERCHE_AMENDEMENTS = "amendements_search";
const CHEMIN_EXPOSE = "corps.contenuAuteur.exposeSommaire";
const CHEMIN_DISPOSITIF = "corps.contenuAuteur.dispositif";
/** Sous-champ racinisé (français) de l'index, cf. le script de création. */
const MULTI_RACINES = "racines";

/** L'état de l'index n'est relu que toutes les 10 minutes. */
const DUREE_ETAT_INDEX_MS = 10 * 60 * 1000;
let etatIndex: { interrogeable: boolean; jusqua: number } | null = null;

async function indexRechercheDisponible(): Promise<boolean> {
  if (etatIndex && Date.now() < etatIndex.jusqua) return etatIndex.interrogeable;
  let interrogeable = false;
  try {
    const db = await getParlementDb();
    const index = await db
      .collection("amendements")
      .listSearchIndexes(INDEX_RECHERCHE_AMENDEMENTS)
      .toArray();
    interrogeable = index.some(
      (i) => i.name === INDEX_RECHERCHE_AMENDEMENTS && (i as { queryable?: boolean }).queryable === true
    );
  } catch {
    interrogeable = false;
  }
  etatIndex = { interrogeable, jusqua: Date.now() + DUREE_ETAT_INDEX_MS };
  return interrogeable;
}

/**
 * Forme d'un mot telle que l'index la stocke : minuscules, sans accents, sans
 * élision. Nécessaire pour `wildcard`, qui n'analyse pas sa requête.
 */
function formeIndexee(mot: string): string {
  return mot
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/^(?:l|d|j|m|n|s|t|c|qu|jusqu|lorsqu|puisqu)['’]/, "");
}

/**
 * Pertinence calquée sur le parcours regex : l'exposé sommaire (argumentaire)
 * pèse plus que le dispositif (texte juridique formulaïque), la forme exacte
 * plus que la forme racinisée (« logement » trouve aussi « logements »).
 * Pour un mot seul, le début de mot (« décentralis » → « décentralisation »)
 * est conservé.
 */
export function operateurRecherche(q: string, legislature: string) {
  const should: Record<string, unknown>[] = [
    { phrase: { query: q, path: CHEMIN_EXPOSE, score: { boost: { value: 5 } } } },
    { phrase: { query: q, path: { value: CHEMIN_EXPOSE, multi: MULTI_RACINES }, score: { boost: { value: 3 } } } },
    { phrase: { query: q, path: CHEMIN_DISPOSITIF, score: { boost: { value: 1 } } } },
    { phrase: { query: q, path: { value: CHEMIN_DISPOSITIF, multi: MULTI_RACINES }, score: { boost: { value: 0.5 } } } },
  ];
  const mot = formeIndexee(q);
  if (/^[\p{L}\p{N}]+$/u.test(mot)) {
    should.push({
      wildcard: {
        query: `${mot}*`,
        path: [CHEMIN_EXPOSE, CHEMIN_DISPOSITIF],
        allowAnalyzedField: true,
        score: { boost: { value: 1 } },
      },
    });
  }
  return {
    compound: {
      // Mêmes périmètres que le parcours regex : législature, et exposé comme
      // dispositif renseignés (une valeur présente n'est jamais vide en base).
      filter: [
        { equals: { path: "legislature", value: legislature } },
        { exists: { path: CHEMIN_EXPOSE } },
        { exists: { path: CHEMIN_DISPOSITIF } },
      ],
      should,
      minimumShouldMatch: 1,
    },
  };
}

/**
 * Les dates absentes sont stockées comme objet `xsi:nil` : non indexées, elles
 * passent en tête (`noData: "highest"`), comme dans le tri MongoDB où un objet
 * se classe après une chaîne.
 */
const DATE_DESC = { order: -1, noData: "highest" };

export async function searchAmendementAtlas(
  q: string,
  { limit = 5, skip = 0, legislature = "17", sort = "relevance" }: OptionsRecherche
): Promise<ResultatsRecherche> {
  const db = await getParlementDb();
  const collection = db.collection("amendements");
  const operateur = operateurRecherche(q, legislature);

  const [amendements, meta] = await Promise.all([
    collection
      .aggregate([
        {
          $search: {
            index: INDEX_RECHERCHE_AMENDEMENTS,
            ...operateur,
            sort:
              sort === "date"
                ? { "cycleDeVie.dateSort": DATE_DESC, "cycleDeVie.dateDepot": DATE_DESC }
                : { score: { $meta: "searchScore" }, "cycleDeVie.dateSort": DATE_DESC },
          },
        },
        { $skip: skip },
        { $limit: limit },
        { $project: { _id: 1 } },
        ...PIPELINE_ENRICHISSEMENT,
      ])
      .toArray(),
    collection
      .aggregate([
        {
          $searchMeta: {
            index: INDEX_RECHERCHE_AMENDEMENTS,
            ...operateur,
            count: { type: "total" },
          },
        },
      ])
      .toArray(),
  ]);

  const total = Number(meta[0]?.count?.total ?? 0);
  return { items: amendements.map((a) => versResultat(a, legislature)), total };
}

/**
 * Parcours par expressions régulières (repli sans index).
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
export async function searchAmendementRegex(
  q: string,
  options: OptionsRecherche
): Promise<ResultatsRecherche> {
  try {
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

  const itemsPipeline = [
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
    // Trier des clés légères : les HTML et signataires peuvent représenter
    // plusieurs Mo par document. Même une pagination profonde doit rester
    // sous la limite mémoire de $facet (qui ne peut pas déborder sur disque).
    { $project: { _id: 1, _relevance: 1, "cycleDeVie.dateSort": 1, "cycleDeVie.dateDepot": 1 } },
    {
      $sort:
        sort === "date"
          ? { "cycleDeVie.dateSort": -1, "cycleDeVie.dateDepot": -1 }
          : { _relevance: -1, "cycleDeVie.dateSort": -1 },
    },
    { $skip: skip },
    { $limit: limit },
    ...PIPELINE_ENRICHISSEMENT,
  ];

  // Une seule lecture du filtre, avec exactement les mêmes règles de
  // correspondance et de pertinence. Pas de migration d'index ni de données.
  const [result] = await db
    .collection("amendements")
    .aggregate([
      { $match: matchStage },
      { $facet: { items: itemsPipeline, count: [{ $count: "total" }] } },
    ])
    .toArray();
  const amendements = result?.items ?? [];
  const total: number = result?.count?.[0]?.total ?? 0;

  return { items: amendements.map((a: Record<string, any>) => versResultat(a, legislature)), total };
  } catch (error) {
    console.error("[searchAmendementMongo] erreur:", error);
    return { items: [], total: 0 };
  }
}
