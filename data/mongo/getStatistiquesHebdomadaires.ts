import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";

/**
 * Statistiques d'activité hebdomadaires, recalculées chez nous à partir des
 * données brutes de l'Assemblée (cf. statistiques_activite.py, exécuté par les
 * imports nocturnes) plutôt que reprises de l'API Tricoteuses.
 *
 * Les valeurs sont dérivées de `statistiques_quotidiennes`, qui conserve les
 * pièces justificatives de chaque ligne : le chiffre affiché ici et le détail
 * qu'on peut montrer à un député qui le conteste viennent du même calcul.
 */

/** Unité de comptage — elle diffère d'un indicateur à l'autre, et ça se dit. */
export type UniteStatistique = "jour" | "reunion" | "intervention";

/**
 * Comment la ligne a été rattachée au député. « identifiant » : l'Assemblée le
 * désigne explicitement. « rapprochement_de_nom » : il a fallu l'inférer d'un
 * nom en clair, seule option pour les comptes rendus de commission.
 */
export type AttributionStatistique = "identifiant" | "rapprochement_de_nom";

export type TypeStatistique =
  | "presenceSeancePublique"
  | "presenceCommission"
  | "interventionSeancePublique"
  | "interventionCommission";

export type StatistiqueHebdomadaire = {
  type: TypeStatistique;
  unite: UniteStatistique;
  attribution: AttributionStatistique;
  /**
   * uid du député, ou un acteur conventionnel : "assemblee" pour le nombre de
   * jours où l'Assemblée a siégé, "median" / "max" pour les repères.
   */
  acteurUid: string;
  semaineIndex: number;
  /** Lundi de la semaine, au format ISO. */
  semaineDebut: string;
  valeur: number;
  /** Réunions où le député était attendu — le dénominateur de `valeur`. */
  convocations?: number;
  excusees?: number;
  absences?: number;
  /** Nombre de députés servant de base à la médiane et au maximum. */
  effectifReference?: number;
};

const LEGISLATURE_PAR_DEFAUT = 17;

/**
 * Séries d'un député pour un indicateur, accompagnées du dénominateur de la
 * semaine : les jours où l'Assemblée a siégé (acteur « assemblee »), et pour
 * les commissions les convocations transportées sur la ligne du député.
 *
 * La médiane et le maximum ne sont volontairement pas chargés : le graphe ne
 * classe pas les députés les uns par rapport aux autres, il rapporte l'activité
 * de chacun à ce qu'il y avait à faire.
 */
export const getStatistiquesHebdomadaires = cache(
  async (
    acteurUid: string,
    types: TypeStatistique[],
    legislature: number = LEGISLATURE_PAR_DEFAUT
  ): Promise<StatistiqueHebdomadaire[]> => {
    if (!acteurUid || types.length === 0) return [];
    try {
      const db = await getParlementDb();
      const docs = await db
        .collection("statistiques_hebdomadaires")
        .find(
          {
            legislature,
            type: { $in: types },
            acteurUid: { $in: [acteurUid, "assemblee"] },
          },
          {
            projection: {
              _id: 0,
              type: 1,
              unite: 1,
              attribution: 1,
              acteurUid: 1,
              semaineIndex: 1,
              semaineDebut: 1,
              valeur: 1,
              convocations: 1,
              excusees: 1,
              absences: 1,
              effectifReference: 1,
            },
            sort: { semaineIndex: 1 },
          }
        )
        .toArray();

      return docs as unknown as StatistiqueHebdomadaire[];
    } catch (error) {
      console.error("Error fetching statistiques hebdomadaires:", error);
      return [];
    }
  }
);
