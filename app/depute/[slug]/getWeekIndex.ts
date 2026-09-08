/**
 * Semaines de législature.
 *
 * Une semaine va du lundi au dimanche, comme le calendrier civil et comme les
 * semaines de séance de l'Assemblée. La semaine 0 est celle de l'ouverture de
 * la législature.
 *
 * ⚠️ Doit rester aligné sur `debut_semaine_zero()` dans statistiques_activite.py,
 * qui produit les `semaineIndex` stockés en base. Les deux dérivent des mêmes
 * dates officielles de début de législature pour qu'un décalage soit impossible.
 */
const legislature_date_debut: Record<number, string | undefined> = {
  14: "2012-06-20",
  15: "2017-06-21",
  16: "2022-06-22",
  17: "2024-07-18",
  18: undefined,
  0: undefined,
};

const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Lundi de la semaine 0, en UTC. */
function getWeekOrigin(legislature: number): number {
  const dateDebut = legislature_date_debut[legislature];
  if (dateDebut === undefined) {
    throw new Error(`La legislature ${legislature} n'as pas de date de départ.`);
  }
  const origine = new Date(`${dateDebut}T00:00:00Z`);
  // getUTCDay() : 0 = dimanche. On recule jusqu'au lundi précédent.
  const joursDepuisLundi = (origine.getUTCDay() + 6) % 7;
  origine.setUTCDate(origine.getUTCDate() - joursDepuisLundi);
  return origine.getTime();
}

/**
 * Conservé pour compatibilité : timestamp de la semaine 0 de chaque législature.
 */
export const legistature_begining: Record<number, number | undefined> =
  Object.fromEntries(
    Object.keys(legislature_date_debut).map((legislature) => [
      legislature,
      legislature_date_debut[Number(legislature)] === undefined
        ? undefined
        : getWeekOrigin(Number(legislature)),
    ])
  );

export function getWeekIndex(legislature: number, date: Date) {
  return Math.floor(
    (date.getTime() - getWeekOrigin(legislature)) / MILLISECONDS_PER_WEEK
  );
}

/** Lundi de la semaine `weekIndex`. */
export function getWeekStartDate(legislature: number, weekIndex: number) {
  return new Date(getWeekOrigin(legislature) + weekIndex * MILLISECONDS_PER_WEEK);
}
