import { getParlementDb } from "@/lib/mongodb";
import {
  amendementLiseuseDepuisAN,
  lierScrutins,
  texteAmendementDepuisAN,
  type AmendementLiseuse,
} from "./conversionAmendementAN";

/**
 * Amendements de la liseuse lus dans notre base plutôt que dans l'API
 * Tricoteuses (cf. conversionAmendementAN.ts). Serveur uniquement.
 */

/** Liste d'un texte gardée en mémoire : ses pages successives ne relisent pas la base. */
const DUREE_MEMOIRE_MS = 5 * 60 * 1000;
const TEXTES_EN_MEMOIRE = 12;
const memoire = new Map<string, { liste: Promise<AmendementLiseuse[]>; expire: number }>();

const PROJECTION_LISTE = {
  _id: 0,
  uid: 1,
  identification: 1,
  cycleDeVie: 1,
  "signataires.auteur": 1,
  "signataires.cosignataires": 1,
  "pointeurFragmentTexte.division": 1,
  discussionIdentique: 1,
  seanceDiscussionRef: 1,
};

async function chargerListe(documentUid: string): Promise<AmendementLiseuse[]> {
  const db = await getParlementDb();
  const [bruts, document] = await Promise.all([
    db.collection("amendements").find({ texteLegislatifRef: documentUid }, { projection: PROJECTION_LISTE }).toArray(),
    db.collection("documents").findOne({ uid: documentUid }, { projection: { _id: 0, dossierRef: 1 } }),
  ]);
  if (bruts.length === 0) return [];

  // Scrutins du dossier, pour relier chaque amendement de séance au vote qui l'a tranché.
  const scrutins = document?.dossierRef
    ? await db
        .collection("scrutins")
        .find(
          { "objet.dossierLegislatif.dossierRef": document.dossierRef },
          { projection: { _id: 0, uid: 1, numero: 1, seanceRef: 1, "objet.libelle": 1 } }
        )
        .toArray()
    : [];
  const liens = lierScrutins(bruts, scrutins as unknown as Parameters<typeof lierScrutins>[1]);

  // Ordre de dépôt, comme l'API ; à numéro égal (commissions différentes),
  // l'identifiant départage pour un ordre stable.
  const ordre = (a: Record<string, unknown>) =>
    Number((a.identification as Record<string, unknown> | undefined)?.numeroOrdreDepot ?? 0);
  return bruts
    .sort((a, b) => ordre(a) - ordre(b) || String(a.uid).localeCompare(String(b.uid)))
    .map((brut) => ({
      ...amendementLiseuseDepuisAN(brut as unknown as Parameters<typeof amendementLiseuseDepuisAN>[0]),
      scrutinRefUid: liens.get(brut.uid as string) ?? null,
    }));
}

function listeEnMemoire(documentUid: string): Promise<AmendementLiseuse[]> {
  const entree = memoire.get(documentUid);
  if (entree && entree.expire > Date.now()) return entree.liste;
  const liste = chargerListe(documentUid);
  liste.catch(() => memoire.delete(documentUid)); // nouvel essai au prochain appel
  memoire.set(documentUid, { liste, expire: Date.now() + DUREE_MEMOIRE_MS });
  // Les textes les plus anciennement chargés sortent en premier.
  while (memoire.size > TEXTES_EN_MEMOIRE) memoire.delete(memoire.keys().next().value!);
  return liste;
}

/**
 * Une page de la liste d'un texte, au format de la route de la liseuse.
 * `null` : aucun amendement de ce texte dans notre base, l'appelant se replie
 * sur l'API.
 */
export async function getAmendementsTexteAN(
  documentUid: string,
  page: number,
  parPage: number
): Promise<{ items: AmendementLiseuse[]; total: number } | null> {
  const liste = await listeEnMemoire(documentUid);
  if (liste.length === 0) return null;
  return { items: liste.slice((page - 1) * parPage, page * parPage), total: liste.length };
}

/** Dispositif et exposé sommaire d'un amendement. `null` s'il est absent de la base. */
export async function getTexteAmendementAN(
  uid: string
): Promise<{ dispositif: string | null; exposeSommaire: string | null } | null> {
  const db = await getParlementDb();
  const brut = await db.collection("amendements").findOne({ uid }, { projection: { _id: 0, corps: 1 } });
  return brut ? texteAmendementDepuisAN(brut) : null;
}

/** Nombre d'amendements déposés à l'Assemblée sur un texte. */
export async function compterAmendementsTexteAN(documentUid: string): Promise<number> {
  const db = await getParlementDb();
  return db.collection("amendements").countDocuments({ texteLegislatifRef: documentUid });
}
