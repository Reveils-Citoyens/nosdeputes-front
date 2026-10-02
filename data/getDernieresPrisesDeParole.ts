import * as React from "react";
import { getParlementDb } from "@/lib/mongodb";
import {
  calculerPrisesDeParole,
  creerSourcesHttp,
  type PriseDeParole,
} from "./prisesDeParoleVideo";

export type { PriseDeParole };

/**
 * Collection remplie chaque nuit par `scripts/precalculer_prises_de_parole.mjs`.
 * Une entrée par député : `{ _id: acteurUid, prises, calculeLe, incomplet }`.
 */
export const COLLECTION_PRISES_DE_PAROLE = "prises_de_parole_video";

/**
 * Au-delà, le précalcul est jugé abandonné (import nocturne en panne) : on
 * recalcule plutôt que d'afficher des vidéos qui ont pu sortir de l'archive.
 */
const FRAICHEUR_MAX_MS = 7 * 24 * 3600 * 1000;

type EntreePrecalculee = {
  _id: string;
  prises: PriseDeParole[];
  calculeLe: Date;
};

async function lirePrecalcul(acteurUid: string): Promise<PriseDeParole[] | null> {
  try {
    const db = await getParlementDb();
    const entree = await db
      .collection<EntreePrecalculee>(COLLECTION_PRISES_DE_PAROLE)
      .findOne({ _id: acteurUid }, { projection: { prises: 1, calculeLe: 1 } });
    if (!entree || Date.now() - entree.calculeLe.getTime() > FRAICHEUR_MAX_MS) return null;
    return entree.prises;
  } catch (error) {
    console.error("Error reading prises de parole précalculées:", error);
    return null;
  }
}

/**
 * Repli à la demande, pour un député absent du précalcul (nouvel élu, première
 * nuit après déploiement) : une quinzaine d'appels vers Tricoteuses et le
 * portail de l'Assemblée, d'où une limite Suspense dédiée sur la fiche.
 */
const sourcesHttp = creerSourcesHttp({
  api: process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL ?? "",
  options: (revalidate) => ({ next: { revalidate } }),
});

async function getDernieresPrisesDeParoleUnCached(
  acteurUid: string
): Promise<PriseDeParole[]> {
  if (!acteurUid) return [];

  const precalculees = await lirePrecalcul(acteurUid);
  if (precalculees) return precalculees;

  try {
    const resultat = await calculerPrisesDeParole(acteurUid, sourcesHttp);
    return resultat?.prises ?? [];
  } catch (error) {
    console.error("Error fetching dernières prises de parole:", error);
    return [];
  }
}

export const getDernieresPrisesDeParole = React.cache(
  getDernieresPrisesDeParoleUnCached
);
