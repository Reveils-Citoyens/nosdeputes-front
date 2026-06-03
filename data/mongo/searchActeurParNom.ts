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
  /** Infos affichables du groupe parlementaire (libellé, abrev, couleur) */
  groupeParlementaire: {
    libelle: string | null;
    libelleAbrev: string | null;
    couleurAssociee: string | null;
  } | null;
  score: number;
  /** Vrai si tous les mandats ASSEMBLEE (L17) ont une dateFin → ex-député */
  mandatAcheve: boolean;
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

  try {
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
                  cond: {
                    $and: [
                      { $eq: ["$$m.typeOrgane", "GP"] },
                      { $eq: ["$$m.dateFin", null] },
                    ],
                  },
                },
              },
              as: "gp",
              in: "$$gp.organes.organeRef",
            },
          },
        },
        // Vrai s'il n'existe AUCUN mandat ASSEMBLEE L17 actif (dateFin null).
        mandatAcheve: {
          $eq: [
            {
              $size: {
                $filter: {
                  input: "$mandats.mandat",
                  as: "m",
                  cond: {
                    $and: [
                      { $eq: ["$$m.legislature", "17"] },
                      { $eq: ["$$m.typeOrgane", "ASSEMBLEE"] },
                      { $eq: ["$$m.dateFin", null] },
                    ],
                  },
                },
              },
            },
            0,
          ],
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
        mandatAcheve: 1,
        numCirco: "$mandatAN.election.lieu.numCirco",
        numDepartement: "$mandatAN.election.lieu.numDepartement",
        departement: "$mandatAN.election.lieu.departement",
      },
    },
    // Lookup du groupe parlementaire pour récupérer libellé, abrev, couleur.
    {
      $lookup: {
        from: "organes",
        localField: "groupeParlementaireUid",
        foreignField: "uid",
        as: "_gp",
        pipeline: [
          {
            $project: {
              _id: 0,
              libelle: 1,
              libelleAbrev: 1,
              couleurAssociee: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        groupeParlementaire: {
          $ifNull: [{ $arrayElemAt: ["$_gp", 0] }, null],
        },
      },
    },
    { $project: { _gp: 0 } },
  ];

  const results = await db
    .collection("acteurs")
    .aggregate(pipeline)
    .toArray();

  return results as ActeurSearchResult[];
  } catch (error) {
    console.error("[searchActeurParNom] erreur:", error);
    return [];
  }
}
