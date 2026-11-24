import { cache } from "react";
import { getActeurMandats } from "./getActeurMandats";
import { situationActeur, type SituationActeur } from "@/lib/situationActeur";

/**
 * Situation d'un acteur (cf. lib/situationActeur.ts), d'après ses mandats en
 * cours et ses périodes de député dans la législature. Serveur uniquement.
 */
export const getSituationActeur = cache(async (acteurUid: string): Promise<SituationActeur> => {
  const { getPeriodesMandatAN } = await import("./mongo/referentielAN");
  const [mandats, periodes] = await Promise.all([
    getActeurMandats(acteurUid),
    getPeriodesMandatAN(acteurUid),
  ]);
  return situationActeur(mandats, periodes);
});
