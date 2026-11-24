import { cache } from "react";
import type { PeriodeMandat } from "@/lib/periodesMandat";

/**
 * Périodes de mandat de député d'un acteur pendant la législature en cours,
 * lues dans notre base. Liste vide si elles sont inconnues : l'affichage se
 * comporte alors comme avant (aucune semaine marquée hors mandat).
 * Serveur uniquement.
 */
export const getPeriodesMandat = cache(async (acteurUid: string): Promise<PeriodeMandat[]> => {
  try {
    const { getPeriodesMandatAN } = await import("./mongo/referentielAN");
    return (await getPeriodesMandatAN(acteurUid)) ?? [];
  } catch {
    return [];
  }
});
