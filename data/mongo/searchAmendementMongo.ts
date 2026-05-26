import { getParlementDb } from "@/lib/mongodb";
import { searchDossierParTitre } from "./searchDossierParTitre";

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

// Pool maximal de dossiers à considérer (réduit pour ne pas noyer l'utilisateur
// dans des milliers d'amendements quand un grand dossier matche le titre).
const DOSSIER_POOL = 5;

/**
 * Recherche d'amendements via Mongo + tri par pertinence.
 *
 * Stratégie :
 *   1. Atlas Search sur les titres de dossiers (DOSSIER_POOL plus chauds matchant)
 *   2. Lookup des texteLoi_Type → DossierLegislatif
 *   3. Pipeline amendements triés par dateSort desc, puis dateDepot desc
 *
 * Supporte la pagination via `skip` pour le lazy load côté UI.
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

  // 1) Top dossiers matchant le titre (limité strictement pour la pertinence)
  const { items: dossiers } = await searchDossierParTitre(q, { limit: DOSSIER_POOL, legislature });
  if (dossiers.length === 0) return { items: [], total: 0 };
  const dossierUids = dossiers.map((d) => d.uid);
  const dossierTitres = new Map<string, string>(
    dossiers.map((d) => [d.uid, d.titre])
  );

  // 2) Textes de loi reliés
  const textes = await db
    .collection("dossiers")
    .find(
      {
        "@xsi:type": "texteLoi_Type",
        dossierRef: { $in: dossierUids },
        legislature,
      },
      { projection: { _id: 0, uid: 1, dossierRef: 1, legislature: 1 } }
    )
    .toArray();

  if (textes.length === 0) return { items: [], total: 0 };

  const texteUidToDossier = new Map<
    string,
    { dossierUid: string; legislature: string }
  >();
  for (const t of textes) {
    texteUidToDossier.set(t.uid, {
      dossierUid: t.dossierRef,
      legislature: t.legislature,
    });
  }
  const texteUids = Array.from(texteUidToDossier.keys());

  // 3) Total (avant skip/limit, pour calcul "X restants")
  const total = await db
    .collection("amendements")
    .countDocuments({ texteLegislatifRef: { $in: texteUids } });

  // 4) Pipeline amendements — tri chronologique dans les deux modes
  const amendements = await db
    .collection("amendements")
    .aggregate([
      { $match: { texteLegislatifRef: { $in: texteUids } } },
      {
        $sort: { "cycleDeVie.dateSort": -1, "cycleDeVie.dateDepot": -1 },
      },
      { $skip: skip },
      { $limit: limit },
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
        },
      },
    ])
    .toArray();

  return {
    items: amendements.map((a) => {
      const link = texteUidToDossier.get(a.texteLegislatifRef);
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
        dateDepot: a.cycleDeVie?.dateDepot ? new Date(a.cycleDeVie.dateDepot) : null,
        dateSort: a.cycleDeVie?.dateSort ? new Date(a.cycleDeVie.dateSort) : null,
        dossierRefUid: link?.dossierUid ?? null,
        dossierTitre: link ? dossierTitres.get(link.dossierUid) ?? null : null,
        dossierLegislature: link?.legislature ?? String(a.legislature ?? legislature),
        acteurRefUid: a.signataires?.auteur?.acteurRef ?? null,
      };
    }),
    total,
  };
}
