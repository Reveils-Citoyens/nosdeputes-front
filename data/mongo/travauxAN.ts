import { getParlementDb } from "@/lib/mongodb";
import { documentDepuisAN } from "./conversionDocumentAN";
import { dossierDepuisAN } from "./conversionDossierAN";
import { pdfDisponible } from "./documentsAN";

/**
 * Travaux d'un député (onglet « Travaux » de sa page) : textes dont il est
 * l'auteur principal et dossiers qu'il a initiés, lus dans notre base plutôt
 * que dans l'API Tricoteuses. Serveur uniquement.
 *
 * Mêmes listes que l'API (`/documents?auteurPrincipalUid=…`,
 * `/dossiers?acteurPrincipalRefUid=…`) sur les députés comparés, à ceci près
 * que les tomes et annexes de rapports, sans classe dans l'API, ne sont pas
 * repris : la page ne les affichait pas.
 */

export type DocumentTravaux = {
  uid: string;
  classeCode: string | null;
  titrePrincipalCourt: string;
  dateCreation: string | null;
  pdfUrl: string | null;
  dossierRefUid: string | null;
};

export type DossierTravaux = {
  uid: string;
  legislature: number | null;
  titre: string | null;
  dateDernierActe: string | null;
};

/** Classes de textes affichées par l'onglet ; les autres n'ont pas besoin de leur PDF. */
const CLASSES_AFFICHEES = new Set(["PIONLOI", "PIONRES", "RAPPORT", "RAPINF"]);

export async function getTravauxActeurAN(
  acteurUid: string
): Promise<{ documents: DocumentTravaux[]; dossiers: DossierTravaux[] }> {
  const db = await getParlementDb();
  const [documentsBruts, dossiersBruts] = await Promise.all([
    db
      .collection("documents")
      .find({ "auteurs.auteur.acteur.acteurRef": acteurUid }, { projection: { _id: 0, divisions: 0 } })
      .toArray(),
    db
      .collection("dossiers")
      .find({ "initiateur.acteurs.acteur.acteurRef": acteurUid }, { projection: { _id: 0 } })
      .toArray(),
  ]);

  const documents = documentsBruts
    .map((brut) => documentDepuisAN(brut as unknown as Parameters<typeof documentDepuisAN>[0], 0, null))
    .filter((d) => d.auteurPrincipalUid === acteurUid && d.classeCode && CLASSES_AFFICHEES.has(d.classeCode))
    .sort(
      (a, b) =>
        String(b.dateCreation ?? "").localeCompare(String(a.dateCreation ?? "")) || b.uid.localeCompare(a.uid)
    );
  const pdfs = await Promise.all(documents.map((d) => pdfDisponible(d.uid)));

  const dossiers = dossiersBruts
    .map((brut) => dossierDepuisAN(brut as unknown as Parameters<typeof dossierDepuisAN>[0]))
    .filter((d) => d.acteurPrincipalRefUid === acteurUid)
    .map((d) => ({
      uid: d.uid,
      legislature: d.legislature,
      titre: d.titre,
      dateDernierActe: d.dateDernierActe as unknown as string | null,
    }))
    // Même jour : l'identifiant le plus récent d'abord, comme l'API.
    .sort(
      (a, b) =>
        String(b.dateDernierActe ?? "").localeCompare(String(a.dateDernierActe ?? "")) ||
        b.uid.localeCompare(a.uid)
    );

  return {
    documents: documents.map((d, i) => ({
      uid: d.uid,
      classeCode: d.classeCode,
      titrePrincipalCourt: d.titrePrincipalCourt,
      dateCreation: d.dateCreation as unknown as string | null,
      pdfUrl: pdfs[i],
      dossierRefUid: d.dossierRefUid,
    })),
    dossiers,
  };
}
