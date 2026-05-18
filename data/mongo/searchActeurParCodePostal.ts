import { getParlementDb } from "@/lib/mongodb";
import { ActeurSearchResult } from "./searchActeurParNom";
import communeToCirco from "@/data/commune-to-circo.json";

type CircoEntry = { d: string; c: number };
const circoMap = communeToCirco as Record<string, CircoEntry>;

const PROJECTION_STAGES = [
  {
    $project: {
      _id: 0,
      uid: 1,
      prenom: "$etatCivil.ident.prenom",
      nom: "$etatCivil.ident.nom",
      score: { $literal: 1 },
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

/**
 * Retrouve le(s) député(s) dont la circonscription correspond au code postal donné.
 * Stratégie :
 *   1. Appel geo.api.gouv.fr pour obtenir les codes INSEE des communes du code postal.
 *   2. Lookup dans le mapping statique commune→(département, numéro de circonscription)
 *      (extrait des résultats officiels des législatives 2022, toujours valide en 2024).
 *   3. Requête MongoDB sur les champs election.lieu.numDepartement + numCirco.
 */
export async function searchActeurParCodePostal(
  codePostal: string
): Promise<ActeurSearchResult[]> {
  if (!codePostal.trim()) return [];

  const cp = codePostal.trim();

  // 1. Communes pour ce code postal
  let communes: { code: string }[] = [];
  try {
    const res = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(cp)}&fields=code`,
      { next: { revalidate: 86400 } }
    );
    if (res.ok) communes = await res.json();
  } catch {
    // fall through to department-level fallback
  }

  // 2. Déduplication des circonscriptions trouvées
  const circosMap = new Map<string, { dept: string; circo: number }>();
  for (const { code } of communes) {
    const entry = circoMap[code];
    if (entry) {
      const key = `${entry.d}-${entry.c}`;
      if (!circosMap.has(key)) {
        circosMap.set(key, { dept: entry.d, circo: entry.c });
      }
    }
  }

  const db = await getParlementDb();

  if (circosMap.size > 0) {
    // 3a. Recherche précise par (numDepartement, numCirco)
    const circos = Array.from(circosMap.values());
    const pipeline = [
      {
        $match: {
          $or: circos.map(({ dept, circo }) => ({
            "mandats.mandat": {
              $elemMatch: {
                legislature: "17",
                typeOrgane: "ASSEMBLEE",
                dateFin: null,
                // numDepartement peut être stocké "01" ou "1" selon la source
                "election.lieu.numDepartement": {
                  $in: [dept, String(parseInt(dept, 10))],
                },
                "election.lieu.numCirco": circo,
              },
            },
          })),
        },
      },
      ...PROJECTION_STAGES,
    ];

    const results = await db
      .collection("acteurs")
      .aggregate(pipeline)
      .toArray();

    if (results.length > 0) return results as ActeurSearchResult[];
  }

  // 3b. Fallback département (préfixe 2 premiers chiffres du code postal)
  const pipeline = [
    {
      $match: {
        "adresses.adresse": {
          $elemMatch: {
            typeLibelle: "Adresse publiée de circonscription",
            codePostal: { $regex: `^${cp.slice(0, 2)}` },
          },
        },
        "mandats.mandat": {
          $elemMatch: {
            legislature: "17",
            typeOrgane: "ASSEMBLEE",
            dateFin: null,
          },
        },
      },
    },
    ...PROJECTION_STAGES,
  ];

  return (await db
    .collection("acteurs")
    .aggregate(pipeline)
    .toArray()) as ActeurSearchResult[];
}
