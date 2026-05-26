import { getParlementDb } from "@/lib/mongodb";

export type QuestionSearchResult = {
  uid: string;
  legislature: string;
  type: string | null;
  numero: number;
  dateDepot: Date | null;
  titre: string;
  rubrique: string | null;
  texteQuestion: string | null;
  texteReponse: string | null;
  erratumQuestion: string | null;
  erratumReponse: string | null;
  ministerInteroge: { libelleAbrege: string } | null;
  acteurRefUid: string | null;
  acteurSlug: string | null;
  groupeAbrev: string | null;
};

export type SortMode = "relevance" | "date";

/**
 * Recherche dans la collection `questions` (QG + QE + QOSD).
 *
 * Tri :
 *   - "relevance" (défaut) : score calculé selon où la regex matche
 *     (titre/analyse > rubrique > texte question > texte réponse),
 *     date desc en tie-breaker.
 *   - "date" : par dateCloture desc (ou infoJO de la question si présente).
 */
export async function searchQuestion(
  query: string,
  options: {
    limit?: number;
    skip?: number;
    legislature?: string;
    sort?: SortMode;
  } = {}
): Promise<{ items: QuestionSearchResult[]; total: number }> {
  if (!query.trim() || query.trim().length < 5) {
    return { items: [], total: 0 };
  }

  const { limit = 5, skip = 0, legislature = "17", sort = "relevance" } = options;
  const db = await getParlementDb();

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");
  const regexCondition = { $regex: escaped, $options: "i" };
  // Préfixe de mot : le terme ne doit pas être précédé d'une lettre (ASCII ou accentuée).
  // Couvre "écologie", "écologique" mais PAS "gynécologie".
  const wordPrefixPattern = `(?<![A-Za-zÀ-ÿ])${escaped}`;
  const wordPrefixCondition = { $regex: wordPrefixPattern, $options: "i" };

  /**
   * $regexMatch exige un input de type string.
   * Certains champs (ex. analyses.analyse) peuvent être un tableau ou null.
   * Cette helper normalise : tableau → premier élément, null/autre → "".
   */
  function safeStr(fieldPath: string): object {
    return {
      $cond: {
        if: { $isArray: `$${fieldPath}` },
        then: { $ifNull: [{ $arrayElemAt: [`$${fieldPath}`, 0] }, ""] },
        else: {
          $cond: {
            if: { $eq: [{ $type: `$${fieldPath}` }, "string"] },
            then: `$${fieldPath}`,
            else: "",
          },
        },
      },
    };
  }

  const matchStage = {
    "identifiant.legislature": legislature,
    $or: [
      { "indexationAN.analyses.analyse": regex },
      { "indexationAN.rubrique": regex },
      { "textesQuestion.texteQuestion.texte": regex },
      { "textesReponse.texteReponse.texte": regex },
    ],
  };

  // Total
  const total = await db.collection("questions").countDocuments(matchStage);

  // Date pour tri (peut venir de cloture ou infoJO)
  const dateExpr = {
    $ifNull: [
      "$cloture.dateCloture",
      "$textesQuestion.texteQuestion.infoJO.dateJO",
    ],
  };

  // Pipeline : match + score + sort + skip + limit + projection
  const pipeline: object[] = [
    { $match: matchStage },
    {
      $addFields: {
        _sortDate: dateExpr,
        _relevance:
          sort === "relevance"
            ? {
                $add: [
                  // ── Titre (analyse) ──────────────────────────────────────
                  // Sous-chaîne dans le titre → +20
                  {
                    $cond: [
                      { $regexMatch: { input: safeStr("indexationAN.analyses.analyse"), regex: regexCondition.$regex, options: regexCondition.$options } },
                      20,
                      0,
                    ],
                  },
                  // Préfixe de mot dans le titre → +50 supplémentaires
                  {
                    $cond: [
                      { $regexMatch: { input: safeStr("indexationAN.analyses.analyse"), regex: wordPrefixCondition.$regex, options: wordPrefixCondition.$options } },
                      50,
                      0,
                    ],
                  },
                  // ── Rubrique ─────────────────────────────────────────────
                  // Sous-chaîne dans la rubrique → +10
                  {
                    $cond: [
                      { $regexMatch: { input: safeStr("indexationAN.rubrique"), regex: regexCondition.$regex, options: regexCondition.$options } },
                      10,
                      0,
                    ],
                  },
                  // Préfixe de mot dans la rubrique → +30 supplémentaires
                  {
                    $cond: [
                      { $regexMatch: { input: safeStr("indexationAN.rubrique"), regex: wordPrefixCondition.$regex, options: wordPrefixCondition.$options } },
                      30,
                      0,
                    ],
                  },
                  // ── Texte de la question ──────────────────────────────────
                  // Sous-chaîne → +5
                  {
                    $cond: [
                      { $regexMatch: { input: safeStr("textesQuestion.texteQuestion.texte"), regex: regexCondition.$regex, options: regexCondition.$options } },
                      5,
                      0,
                    ],
                  },
                  // Préfixe de mot → +10 supplémentaires
                  {
                    $cond: [
                      { $regexMatch: { input: safeStr("textesQuestion.texteQuestion.texte"), regex: wordPrefixCondition.$regex, options: wordPrefixCondition.$options } },
                      10,
                      0,
                    ],
                  },
                  // ── Texte de la réponse ───────────────────────────────────
                  // Sous-chaîne → +2
                  {
                    $cond: [
                      { $regexMatch: { input: safeStr("textesReponse.texteReponse.texte"), regex: regexCondition.$regex, options: regexCondition.$options } },
                      2,
                      0,
                    ],
                  },
                  // Préfixe de mot → +5 supplémentaires
                  {
                    $cond: [
                      { $regexMatch: { input: safeStr("textesReponse.texteReponse.texte"), regex: wordPrefixCondition.$regex, options: wordPrefixCondition.$options } },
                      5,
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
          ? { _sortDate: -1 }
          : { _relevance: -1, _sortDate: -1 },
    },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        uid: 1,
        "@xsi:type": 1,
        type: 1,
        "identifiant.legislature": 1,
        "identifiant.numero": 1,
        "indexationAN.rubrique": 1,
        "indexationAN.analyses.analyse": 1,
        "textesQuestion.texteQuestion.texte": 1,
        "textesQuestion.texteQuestion.infoJO.dateJO": 1,
        "textesReponse.texteReponse.texte": 1,
        "minInt.abrege": 1,
        "minInt.developpe": 1,
        "auteur.identite.acteurRef": 1,
        "auteur.groupe.abrege": 1,
        "cloture.dateCloture": 1,
      },
    },
  ];

  const docs = await db.collection("questions").aggregate(pipeline).toArray();

  // Batch lookup acteurRef → slug
  const acteurUids = Array.from(
    new Set(
      docs
        .map((d) => d.auteur?.identite?.acteurRef)
        .filter((v): v is string => !!v)
    )
  );
  const slugMap = new Map<string, string>();
  if (acteurUids.length > 0) {
    const acteurs = await db
      .collection("acteurs")
      .find({ uid: { $in: acteurUids } }, { projection: { _id: 0, uid: 1, slug: 1 } })
      .toArray();
    for (const a of acteurs) {
      if (a.slug) slugMap.set(a.uid, a.slug);
    }
  }

  const items = docs.map((d) => {
    const code: string | undefined = d.type ?? undefined;
    const rawType: string | undefined = d["@xsi:type"];
    let type: string | null = null;
    if (code === "QG") type = "Question au Gouvernement";
    else if (code === "QE") type = "Question écrite";
    else if (code === "QOSD") type = "Question orale sans débat";
    else if (rawType) {
      const cleaned = rawType.replace(/_Type$/, "");
      type =
        cleaned === "QuestionGouvernement"
          ? "Question au Gouvernement"
          : cleaned === "QuestionEcrite"
          ? "Question écrite"
          : cleaned === "QuestionOrale"
          ? "Question orale"
          : cleaned;
    }

    const dateDepotStr =
      d.textesQuestion?.texteQuestion?.infoJO?.dateJO ??
      d.cloture?.dateCloture ??
      null;

    const ministerInteroge = d.minInt?.abrege
      ? { libelleAbrege: d.minInt.abrege as string }
      : null;

    const numeroStr = d.identifiant?.numero;
    const numero = numeroStr ? parseInt(numeroStr, 10) || 0 : 0;

    return {
      uid: d.uid,
      legislature: d.identifiant?.legislature ?? legislature,
      type,
      numero,
      dateDepot: dateDepotStr ? new Date(dateDepotStr) : null,
      titre: d.indexationAN?.analyses?.analyse ?? "—",
      rubrique: d.indexationAN?.rubrique ?? null,
      texteQuestion: d.textesQuestion?.texteQuestion?.texte ?? null,
      texteReponse: d.textesReponse?.texteReponse?.texte ?? null,
      erratumQuestion: null,
      erratumReponse: null,
      ministerInteroge,
      acteurRefUid: d.auteur?.identite?.acteurRef ?? null,
      acteurSlug:
        d.auteur?.identite?.acteurRef
          ? slugMap.get(d.auteur.identite.acteurRef) ?? null
          : null,
      groupeAbrev: d.auteur?.groupe?.abrege ?? null,
    };
  });

  return { items, total };
}
