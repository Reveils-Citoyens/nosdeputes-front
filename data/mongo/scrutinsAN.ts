import { getParlementDb } from "@/lib/mongodb";
import type { ScrutinResume } from "@/data/liseuse/scrutinsAmendements";
import { valeur } from "./conversionAN";

/**
 * Résumés des scrutins publics de la liseuse, lus dans notre base (collection
 * `scrutins`) plutôt que dans l'API Tricoteuses. Serveur uniquement.
 *
 * Identiques à l'API sur les 689 scrutins du PLF 2027, à la date près : l'API
 * la décalait d'un jour vers le passé, l'open data porte le jour exact.
 */

type Brut = Record<string, unknown>;

const objet = (brut: unknown): Brut =>
  brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Brut) : {};

function entier(brut: unknown): number {
  const n = Number.parseInt(valeur(brut) ?? "", 10);
  return Number.isFinite(n) ? n : 0;
}

export function resumeScrutinDepuisAN(brut: Brut & { uid: string }): ScrutinResume {
  const decompte = objet(objet(brut.syntheseVote).decompte);
  const jour = valeur(brut.dateScrutin);
  return {
    uid: brut.uid,
    numero: valeur(brut.numero),
    titre: valeur(brut.titre),
    dateScrutin: jour && /^\d{4}-\d{2}-\d{2}/.test(jour) ? `${jour.slice(0, 10)}T00:00:00.000Z` : null,
    code: valeur(objet(brut.sort).code),
    pour: entier(decompte.pour),
    contre: entier(decompte.contre),
    abstentions: entier(decompte.abstentions),
    libelleTypeVote: valeur(objet(brut.typeVote).libelleTypeVote),
  };
}

const PROJECTION = {
  _id: 0,
  uid: 1,
  numero: 1,
  titre: 1,
  dateScrutin: 1,
  "sort.code": 1,
  "syntheseVote.decompte": 1,
  "typeVote.libelleTypeVote": 1,
};

/**
 * Scrutins du dossier auquel appartient un texte : ceux du texte, et ceux des
 * autres textes du dossier, sans gêne puisque la liseuse les cherche par uid.
 * `null` si le texte est absent de notre base.
 */
export async function getScrutinsTexteAN(documentUid: string): Promise<ScrutinResume[] | null> {
  const db = await getParlementDb();
  const document = await db.collection("documents").findOne({ uid: documentUid }, { projection: { _id: 0, dossierRef: 1 } });
  if (!document?.dossierRef) return null;
  const bruts = await db
    .collection("scrutins")
    .find({ "objet.dossierLegislatif.dossierRef": document.dossierRef }, { projection: PROJECTION })
    .toArray();
  return bruts.map((b) => resumeScrutinDepuisAN(b as unknown as Brut & { uid: string }));
}

export async function getScrutinsParUidsAN(uids: string[]): Promise<ScrutinResume[]> {
  const db = await getParlementDb();
  const bruts = await db.collection("scrutins").find({ uid: { $in: uids } }, { projection: PROJECTION }).toArray();
  return bruts.map((b) => resumeScrutinDepuisAN(b as unknown as Brut & { uid: string }));
}
