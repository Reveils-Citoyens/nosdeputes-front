import * as React from "react";
import { getWeekIndex, getWeekStartDate } from "../getWeekIndex";
import type { StatistiqueHebdomadaire } from "@/data/mongo/getStatistiquesHebdomadaires";

export const LEGISLATURE = 17;

/**
 * Fenêtres proposées au lecteur. Les mêmes intitulés que les cartes de
 * statistiques juste en dessous, pour que les deux blocs se lisent ensemble.
 */
export const FENETRES = {
  LEGISLATURE: { label: "Toute la législature", semaines: null },
  LAST_YEAR: { label: "12 derniers mois", semaines: 52 },
  LAST_SIX_MONTHS: { label: "6 derniers mois", semaines: 26 },
} as const;

export type FenetreActivite = keyof typeof FENETRES;

/**
 * Une semaine, décomposée en « ce qu'il y avait à faire » et « ce qui a été
 * fait ». Chaque barre du graphe monte jusqu'au possible et se répartit par
 * issue : c'est ce qui donne son sens au chiffre affiché.
 */
export type SemaineActivite = {
  date: Date;
  /** Jours où l'Assemblée a tenu séance publique — le possible, pour tous. */
  seances: number;
  /** Jours où le député a pris la parole en séance. */
  seancePriseParole: number;
  /** Jours de séance sans prise de parole : sa présence y est inconnue. */
  seanceSansParole: number;
  /** Réunions où le député était attendu — le possible, pour lui seul. */
  convocations: number;
  commissionPresent: number;
  commissionExcuse: number;
  commissionAbsent: number;
};

export function useAgregateWeeklyStats(
  props: { statistiques: StatistiqueHebdomadaire[] },
  fenetre: FenetreActivite = "LEGISLATURE"
) {
  const { statistiques } = props;

  const parSemaine = React.useMemo(() => {
    const index: Record<number, Partial<SemaineActivite>> = {};

    for (const ligne of statistiques) {
      const semaine = (index[ligne.semaineIndex] ??= {});

      if (ligne.type === "presenceSeancePublique") {
        if (ligne.acteurUid === "assemblee") {
          semaine.seances = ligne.valeur;
        } else {
          semaine.seancePriseParole = ligne.valeur;
        }
      } else if (ligne.type === "presenceCommission" && ligne.acteurUid !== "assemblee") {
        semaine.commissionPresent = ligne.valeur;
        semaine.commissionExcuse = ligne.excusees ?? 0;
        semaine.commissionAbsent = ligne.absences ?? 0;
        semaine.convocations = ligne.convocations ?? ligne.valeur;
      }
    }

    return index;
  }, [statistiques]);

  const currentWeekIndex = getWeekIndex(LEGISLATURE, new Date());
  // Sur toute la législature, la fenêtre part de sa première semaine.
  const nbSemaines =
    FENETRES[fenetre].semaines ?? Math.max(1, currentWeekIndex + 1);

  const dataset = React.useMemo<SemaineActivite[]>(
    () =>
      [...Array(nbSemaines)]
        .map((_, i) => currentWeekIndex - nbSemaines + 1 + i)
        .filter((semaineIndex) => semaineIndex >= 0)
        .map((semaineIndex) => {
          const s = parSemaine[semaineIndex] ?? {};
          const seances = s.seances ?? 0;
          const priseParole = s.seancePriseParole ?? 0;
          return {
            date: getWeekStartDate(LEGISLATURE, semaineIndex),
            seances,
            seancePriseParole: priseParole,
            // Le complément n'est pas une absence : c'est ce que les comptes
            // rendus ne permettent pas de trancher.
            seanceSansParole: Math.max(0, seances - priseParole),
            convocations: s.convocations ?? 0,
            commissionPresent: s.commissionPresent ?? 0,
            commissionExcuse: s.commissionExcuse ?? 0,
            commissionAbsent: s.commissionAbsent ?? 0,
          };
        }),
    [currentWeekIndex, nbSemaines, parSemaine]
  );

  return { dataset };
}
