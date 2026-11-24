/**
 * Périodes de mandat de député d'un acteur pendant une législature, et ce qui
 * en découle pour l'affichage. Partagé entre le serveur (lecture en base) et
 * le navigateur (graphe hebdomadaire).
 */

/** Dates ISO (AAAA-MM-JJ) ; `fin` à `null` pour un mandat en cours. */
export type PeriodeMandat = { debut: string; fin: string | null };

/**
 * Fusionne les périodes qui se chevauchent ou se suivent : l'Assemblée publie
 * parfois deux mandats superposés pour un même député (retour du
 * Gouvernement, par exemple).
 */
export function fusionnerPeriodes(periodes: PeriodeMandat[]): PeriodeMandat[] {
  const triees = [...periodes].sort((a, b) => a.debut.localeCompare(b.debut));
  const fusion: PeriodeMandat[] = [];
  for (const periode of triees) {
    const precedente = fusion.at(-1);
    if (precedente && (precedente.fin === null || periode.debut <= lendemain(precedente.fin))) {
      precedente.fin =
        precedente.fin === null || periode.fin === null
          ? null
          : periode.fin > precedente.fin
            ? periode.fin
            : precedente.fin;
    } else {
      fusion.push({ ...periode });
    }
  }
  return fusion;
}

function lendemain(jour: string): string {
  const date = new Date(`${jour}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/** La semaine du lundi `debutSemaine` recoupe-t-elle un mandat ? */
export function semaineEnMandat(periodes: PeriodeMandat[], debutSemaine: Date): boolean {
  const debut = debutSemaine.toISOString().slice(0, 10);
  const finSemaine = new Date(debutSemaine);
  finSemaine.setUTCDate(finSemaine.getUTCDate() + 6);
  const fin = finSemaine.toISOString().slice(0, 10);
  return periodes.some((p) => p.debut <= fin && (p.fin === null || p.fin >= debut));
}

/** « 30 septembre 2026 ». */
export function dateLongue(jour: string): string {
  return new Date(`${jour}T12:00:00Z`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}
