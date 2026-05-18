import { getParlementDb } from "@/lib/mongodb";

export type ActeurSearchResult = {
  uid: string;
  prenom: string;
  nom: string;
  /** Numéro de circonscription */
  numCirco: number | null;
  numDepartement: string | null;
  departement: string | null;
  groupeParlementaireUid: string | null;
  score: number;
};

/**
 * Recherche des députés (législature 17) par nom et/ou prénom via Atlas Search.
 * Tolère 1 faute de frappe sur les mots de 5+ caractères.
 */
export async function searchActeurParNom(
  query: string,
  limit = 10
): Promise<ActeurSearchResult[]> {
  if (!query.trim()) return [];

  const db = await getParlementDb();

  const pipeline = [
    {
      $search: {
        index: "acteurs_search",
        compound: {
          should: [
            {
              text: {
                query,
                path: ["etatCivil.ident.nom", "etatCivil.ident.prenom", "etatCivil.ident.alpha"],
                fuzzy: { maxEdits: 1, prefixLength: 2 },
                score: { boost: { value: 2 } },
              },
            },
            {
              wildcard: {
                query: `${query.toLowerCase()}*`,
                path: ["etatCivil.ident.nom", "etatCivil.ident.prenom", "etatCivil.ident.alpha"],
                allowAnalyzedField: true,
              },
            },
          ],
        },
      },
    },
    // On ne garde que les députés AN legislature 17
    {
      $match: {
        "mandats.mandat": {
          $elemMatch: { legislature: "17", typeOrgane: "ASSEMBLEE" },
        },
      },
    },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        uid: 1,
        prenom: "$etatCivil.ident.prenom",
        nom: "$etatCivil.ident.nom",
        score: { $meta: "searchScore" },
        // Extraction du mandat AN L17 pour la circonscription
        mandatAN: {
          $first: {
            $filter: {
              input: "$mandats.mandat",
              as: "m",
              cond: {
                $and: [
                  { $eq: ["$$m.legislature", "17"] },
                  { $eq: ["$$m.typeOrgane", "ASSEMBLEE"] },
                ],
              },
            },
          },
        },
        groupeParlementaireUid: {
          $first: {
            $map: {
              input: {
                $filter: {
                  input: "$mandats.mandat",
                  as: "m",
                  cond: { $eq: ["$$m.typeOrgane", "GP"] },
                },
              },
              as: "gp",
              in: "$$gp.organes.organeRef",
            },
          },
        },
      },
    },
    {
      $project: {
        uid: 1,
        prenom: 1,
        nom: 1,
        score: 1,
        groupeParlementaireUid: 1,
        numCirco: "$mandatAN.election.lieu.numCirco",
        numDepartement: "$mandatAN.election.lieu.numDepartement",
        departement: "$mandatAN.election.lieu.departement",
      },
    },
  ];

  const results = await db
    .collection("acteurs")
    .aggregate(pipeline)
    .toArray();

  return results as ActeurSearchResult[];
}
