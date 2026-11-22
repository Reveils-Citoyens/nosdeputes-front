import { getParlementDb } from "@/lib/mongodb";
import { documentDepuisAN, urlPdfCandidate, type DocumentAN } from "./conversionDocumentAN";

/**
 * Documents législatifs lus dans notre base plutôt que dans l'API Tricoteuses
 * (cf. conversionDocumentAN.ts). Serveur uniquement. `null` : document absent
 * de la base (identifiant propre au Sénat, document trop récent), l'appelant
 * se replie alors sur l'API.
 */

/** Durée pendant laquelle on se souvient qu'un PDF existe, ou pas encore. */
const MEMOIRE_PDF_PRESENT_MS = 24 * 60 * 60 * 1000;
const MEMOIRE_PDF_ABSENT_MS = 60 * 60 * 1000;
const DELAI_PDF_MS = 3000;

const pdfs = new Map<string, { url: string | null; expire: number }>();

/**
 * La copie PDF publiée par Tricoteuses, si elle existe. Une requête HEAD vers
 * leur stockage S3 (et non vers l'API) : elle répond en quelques dizaines de
 * millisecondes et donne exactement les mêmes résultats que le `pdfUrl` de
 * l'API sur l'échantillon comparé.
 */
export async function pdfDisponible(uid: string): Promise<string | null> {
  const memoire = pdfs.get(uid);
  if (memoire && memoire.expire > Date.now()) return memoire.url;

  const candidate = urlPdfCandidate(uid);
  let url: string | null = null;
  if (candidate) {
    try {
      const reponse = await fetch(candidate, {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(DELAI_PDF_MS),
      });
      url = reponse.ok ? candidate : null;
    } catch {
      // Stockage injoignable : on ne mémorise pas, nouvel essai au prochain rendu.
      return null;
    }
  }
  pdfs.set(uid, { url, expire: Date.now() + (url ? MEMOIRE_PDF_PRESENT_MS : MEMOIRE_PDF_ABSENT_MS) });
  return url;
}

export async function getDocumentAN(uid: string): Promise<DocumentAN | null> {
  try {
    const db = await getParlementDb();
    const brut = await db.collection("documents").findOne({ uid }, { projection: { _id: 0, divisions: 0 } });
    if (!brut) return null;
    const [amendements, pdfUrl] = await Promise.all([
      db.collection("amendements").countDocuments({ texteLegislatifRef: uid }),
      pdfDisponible(uid),
    ]);
    return documentDepuisAN(brut as unknown as Parameters<typeof documentDepuisAN>[0], amendements, pdfUrl);
  } catch (erreur) {
    console.warn("getDocumentAN: lecture impossible", uid, erreur);
    return null;
  }
}

/** Texte de loi d'un dossier, tel que l'utilise la liseuse. */
export type TexteDuDossier = { uid: string; dateCreation: Date | null; depotLibelle: string | null };

/**
 * Projets et propositions de loi (PRJLOI, PIONLOI) d'un dossier, par date de
 * création croissante : ce que la liseuse demandait à l'API
 * (`/documents?dossierRefUid=…&classeCode=…`). `null` si le dossier est
 * absent de notre base : l'appelant se replie sur l'API.
 */
export async function getTextesDuDossierAN(dossierUid: string): Promise<TexteDuDossier[] | null> {
  const db = await getParlementDb();
  const [dossier, bruts] = await Promise.all([
    db.collection("dossiers").findOne({ uid: dossierUid }, { projection: { _id: 0, uid: 1 } }),
    db
      .collection("documents")
      .find(
        { dossierRef: dossierUid, "classification.famille.classe.code": { $in: ["PRJLOI", "PIONLOI"] } },
        { projection: { _id: 0, uid: 1, "cycleDeVie.chrono.dateCreation": 1, "classification.famille.depot.libelle": 1 } }
      )
      .toArray(),
  ]);
  if (!dossier) return null;
  return bruts
    .map((brut) => {
      const document = documentDepuisAN(brut as unknown as Parameters<typeof documentDepuisAN>[0], 0, null);
      const date = document.dateCreation as unknown as string | null;
      return { uid: document.uid, dateCreation: date ? new Date(date) : null, depotLibelle: document.depotLibelle };
    })
    // Même jour (texte adopté BTA et TAP) : l'identifiant départage.
    .sort(
      (a, b) =>
        (a.dateCreation?.getTime() ?? 0) - (b.dateCreation?.getTime() ?? 0) || a.uid.localeCompare(b.uid)
    );
}
