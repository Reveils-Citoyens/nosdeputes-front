import { getParlementDb } from "@/lib/mongodb";

export type DossierSearchResult = {
  uid: string;
  titre: string;
  legislature: string;
  typeLibelle: string | null;
  score: number;
};

/**
 * Recherche de dossiers législatifs par titre via Atlas Search.
 * Ne retourne que les dossiers racines (dossierRef: null), donc un seul
 * résultat distinct par dossier.
 * Filtre optionnel sur la législature (défaut : "17").
 */
export async function searchDossierParTitre(
  query: string,
  options: {
    limit?: number;
    legislature?: string;
  } = {}
): Promise<DossierSearchResult[]> {
  if (!query.trim()) return [];

  const { limit = 10, legislature = "17" } = options;

  const db = await getParlementDb();

  // Les DossierLegislatif_Type ont leur titre dans titreDossier.titre.
  // Les autres types (accordInternational, texteLoi, etc.) ont titres.titrePrincipal.
  // On cherche sur les deux chemins ; le filtre dossierRef=null garantit
  // de ne retourner qu'un résultat par dossier (pas de doublons sur les textes associés).
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
              wildcard: {
                query: `${query.toLowerCase()}*`,
                path: ["titreDossier.titre", "titres.titrePrincipal", "titres.titrePrincipalCourt"],
                allowAnalyzedField: true,
              },
            },
          ],
        },
      },
    },
    {
      $match: {
        legislature,
        dossierRef: null,
        chambre: { $ne: "SN" }, // les dossiers AN n'ont pas de champ chambre; seuls les dossiers SN l'ont
      },
    },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        uid: 1,
        // Titre : titreDossier.titre pour les DossierLegislatif_Type,
        // titres.titrePrincipal pour les autres
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
        score: { $meta: "searchScore" },
      },
    },
  ];

  const results = await db
    .collection("dossiers")
    .aggregate(pipeline)
    .toArray();

  return results as DossierSearchResult[];
}
