import { cache } from "react";
import type { ProximiteGroupe } from "@/lib/proximite";
import { getParlementDb } from "@/lib/mongodb";
import type { AttributionStatistique } from "./getStatistiquesHebdomadaires";

/**
 * Totaux d'activité d'un député et distribution de l'Assemblée, par mesure et
 * par période.
 *
 * Recalculés chez nous à partir des données brutes de l'Assemblée
 * (statistiques_activite.py, exécuté par les imports nocturnes). Deux
 * différences de fond avec les chiffres que servait l'API Tricoteuses :
 *
 *  - les députés sans aucune activité sur une mesure comptent pour 0 dans la
 *    distribution au lieu d'en être absents, ce qui abaissait les seuils ;
 *  - la population de référence est la même pour toutes les mesures — les 577
 *    députés en exercice — donc les « dans les X % » sont comparables d'une
 *    carte à l'autre, ce qui n'était pas le cas avant.
 */

/**
 * Périodes des députés en exercice, et « MANDAT » pour ceux dont le mandat est
 * achevé : leurs totaux sur la durée de ce mandat, sans distribution.
 */
export type PeriodeStatistique = "LEGISLATURE" | "LAST_YEAR" | "LAST_SIX_MONTHS" | "MANDAT";

export type MetriqueActeur = {
  mesure: string;
  periode: PeriodeStatistique;
  acteurUid: string;
  /**
   * Nombre, ou pourcentage pour les mesures dont l'unité est « pourcentage ».
   * `null` quand un taux n'est pas défini (aucun scrutin sur la période,
   * député non inscrit pour la dissidence).
   */
  valeur: number | null;
  unite: string;
  attribution: AttributionStatistique | "mixte";
  /** Dénominateur, quand la mesure en a un : réunions où il était convoqué. */
  convocations?: number;
  excusees?: number;
  absences?: number;
  /**
   * Prises de parole faites en présidant la séance, exclues de `valeur` parce
   * qu'elles relèvent de la conduite des débats. Conservées ici : sans elles,
   * un président de séance apparaîtrait à zéro.
   */
  interventionsPresidence?: number;
  /**
   * Questions au Gouvernement, hors du compteur des questions orales : leur
   * répartition est décidée par les groupes. Affichées à côté.
   */
  questionsGouvernement?: number;
  /**
   * En fonction moins de la moitié de la période (suppléant, arrivée récente) :
   * total publié, sans rang ni place dans la distribution.
   */
  nonClasse?: boolean;
  joursEnFonction?: number;
  joursPeriode?: number;
  /** Début du dernier mandat, AAAA-MM-JJ. */
  enFonctionDepuis?: string | null;
  /** Participation aux scrutins solennels : scrutins où il pouvait voter. */
  scrutins?: number;
  /** … ceux où il a voté (pour, contre, abstention). */
  votes?: number;
  /** … dont par délégation. */
  votesDelegation?: number;
  /** Votes dissidents : votes émis au sein d'un groupe politique. */
  votesExprimes?: number;
  /**
   * … dont ceux où son groupe avait une ligne (deux tiers de ses votants dans
   * le même sens), base du taux. Absent des chiffres calculés avant cette règle.
   */
  votesLigneGroupe?: number;
  /** … qui s'écartent de cette ligne. */
  votesDissidents?: number;
  /** Groupe de son dernier vote compté (abréviation, « LIOT »). */
  groupeAbrev?: string | null;
  /** Part des scrutins de la période où ce groupe avait une ligne, en %. */
  ligneGroupe?: number | null;
  /** Médiane de dissidence des membres de son groupe, et leur nombre. */
  medianeGroupe?: number;
  effectifGroupe?: number;
  /** Trop peu de votes pour un taux significatif : signalé, hors médianes. */
  echantillonInsuffisant?: boolean;
  /**
   * Proximité de vote (mesure « proximite-groupes ») : pour chaque groupe,
   * [votes comme sa ligne, scrutins où il avait une ligne et où le député a
   * voté], tous scrutins publics et scrutins solennels.
   */
  groupes?: ProximiteGroupe[];
};


export type DistributionMesure = {
  mesure: string;
  periode: PeriodeStatistique;
  unite: string;
  attribution: AttributionStatistique | "mixte";
  /** Nombre de députés composant la distribution. */
  effectifReference: number;
  minimum: number;
  maximum: number;
  moyenne: number;
  /** Médiane, pour les taux (scrutins solennels). */
  mediane?: number;
  q20: number;
  q40: number;
  q60: number;
  q80: number;
  q100: number;
};

const LEGISLATURE_PAR_DEFAUT = 17;

const PROJECTION_COMMUNE = {
  _id: 0,
  mesure: 1,
  periode: 1,
  unite: 1,
  attribution: 1,
} as const;

export const getMetriquesActeur = cache(
  async (
    acteurUid: string,
    legislature: number = LEGISLATURE_PAR_DEFAUT
  ): Promise<MetriqueActeur[]> => {
    if (!acteurUid) return [];
    try {
      const db = await getParlementDb();
      const docs = await db
        .collection("statistiques_metriques")
        .find(
          { legislature, acteurUid },
          {
            projection: {
              ...PROJECTION_COMMUNE,
              acteurUid: 1,
              valeur: 1,
              convocations: 1,
              excusees: 1,
              absences: 1,
              interventionsPresidence: 1,
              questionsGouvernement: 1,
              nonClasse: 1,
              joursEnFonction: 1,
              joursPeriode: 1,
              enFonctionDepuis: 1,
              scrutins: 1,
              votes: 1,
              votesDelegation: 1,
              votesExprimes: 1,
              votesLigneGroupe: 1,
              votesDissidents: 1,
              groupeAbrev: 1,
              ligneGroupe: 1,
              medianeGroupe: 1,
              effectifGroupe: 1,
              echantillonInsuffisant: 1,
              groupes: 1,
            },
          }
        )
        .toArray();
      return docs as unknown as MetriqueActeur[];
    } catch (error) {
      console.error("Error fetching statistiques metriques:", error);
      return [];
    }
  }
);

export const getDistributions = cache(
  async (
    legislature: number = LEGISLATURE_PAR_DEFAUT
  ): Promise<DistributionMesure[]> => {
    try {
      const db = await getParlementDb();
      const docs = await db
        .collection("statistiques_distributions")
        .find(
          { legislature },
          {
            projection: {
              ...PROJECTION_COMMUNE,
              effectifReference: 1,
              minimum: 1,
              maximum: 1,
              moyenne: 1,
              mediane: 1,
              q20: 1,
              q40: 1,
              q60: 1,
              q80: 1,
              q100: 1,
            },
          }
        )
        .toArray();
      return docs as unknown as DistributionMesure[];
    } catch (error) {
      console.error("Error fetching statistiques distributions:", error);
      return [];
    }
  }
);
