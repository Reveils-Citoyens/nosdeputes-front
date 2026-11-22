import type { Paragraphe } from "@prisma/client";
import { getParlementDb } from "@/lib/mongodb";
import { interventionsDepuisAN } from "./conversionInterventionsAN";
import { construireIndex, ResolveurOrateurs } from "./resolutionOrateurs";
import { dateSeance } from "./debatsAN";

/**
 * Paragraphes d'un compte rendu (séance ou commission) lus dans notre base
 * plutôt que dans l'API Tricoteuses (cf. conversionInterventionsAN.ts).
 * Serveur uniquement. `null` : compte rendu absent de la base (transcription
 * provisoire d'une réunion récente), l'appelant se replie sur l'API.
 */

const LEGISLATURE = 17;
const DUREE_INDEX_MS = 60 * 60 * 1000;

let index: { valeur: Promise<Map<string, string>>; chargeLe: number } | null = null;

/** Index des noms d'orateurs (députés et membres du Gouvernement), rechargé toutes les heures. */
function indexOrateurs(): Promise<Map<string, string>> {
  if (!index || Date.now() - index.chargeLe > DUREE_INDEX_MS) {
    const valeur = (async () => {
      const db = await getParlementDb();
      const acteurs = await db
        .collection("acteurs")
        .find(
          {},
          {
            projection: {
              _id: 0,
              uid: 1,
              "etatCivil.ident": 1,
              "mandats.mandat.typeOrgane": 1,
              "mandats.mandat.legislature": 1,
            },
          }
        )
        .toArray();
      return construireIndex(acteurs as Parameters<typeof construireIndex>[0], LEGISLATURE, { gouvernement: true });
    })();
    valeur.catch(() => {
      index = null; // nouvel essai au prochain appel
    });
    index = { valeur, chargeLe: Date.now() };
  }
  return index.valeur;
}

export async function getInterventionsAN(debatUid: string): Promise<Paragraphe[] | null> {
  try {
    const db = await getParlementDb();
    const cr = await db.collection("comptes_rendus").findOne({ uid: debatUid }, { projection: { _id: 0 } });
    if (!cr) return null;
    // Commission seulement : en séance, l'Assemblée identifie chaque orateur.
    const resolveur = debatUid.startsWith("CRC") ? new ResolveurOrateurs(await indexOrateurs()) : null;
    return interventionsDepuisAN(
      cr as unknown as Parameters<typeof interventionsDepuisAN>[0],
      dateSeance((cr.metadonnees as Record<string, unknown> | undefined)?.dateSeance),
      resolveur
    );
  } catch (erreur) {
    console.warn("getInterventionsAN: lecture impossible", debatUid, erreur);
    return null;
  }
}
