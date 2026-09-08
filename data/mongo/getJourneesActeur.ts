import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";

/**
 * Toutes les journées où un député a une activité enregistrée, du plus récent
 * au plus ancien.
 *
 * C'est l'index du détail : une page par jour est la brique, mais personne ne
 * clique 280 fois. Cette liste est le point d'entrée qu'on cite quand un député
 * conteste un chiffre, et celui vers lequel pointent les graphes.
 */

export type JourneeActeur = {
  date: string;
  /** Jours de séance publique avec prise de parole retenue : 0 ou 1. */
  seance: number;
  /** Interventions retenues en séance publique et en commission. */
  interventions: number;
  /** Réunions où il a émargé présent. */
  commissionPresent: number;
  /** Réunions où il était convoqué, tous états confondus. */
  convocations: number;
  amendements: number;
  documents: number;
  questions: number;
};

const AGREGATS: Record<string, keyof JourneeActeur> = {
  presenceSeancePublique: "seance",
  amendementDepose: "amendements",
  documentPublie: "documents",
};

export const getJourneesActeur = cache(
  async (acteurUid: string, legislature = 17): Promise<JourneeActeur[]> => {
    if (!acteurUid) return [];

    try {
      const db = await getParlementDb();
      const lignes = await db
        .collection("statistiques_quotidiennes")
        .find(
          { legislature, acteurUid },
          {
            projection: {
              _id: 0,
              date: 1,
              type: 1,
              valeur: 1,
              convocations: 1,
            },
          }
        )
        .toArray();

      const parJour = new Map<string, JourneeActeur>();

      for (const ligne of lignes) {
        const jour = parJour.get(ligne.date) ?? {
          date: ligne.date,
          seance: 0,
          interventions: 0,
          commissionPresent: 0,
          convocations: 0,
          amendements: 0,
          documents: 0,
          questions: 0,
        };

        const champ = AGREGATS[ligne.type];
        if (champ) {
          (jour[champ] as number) += ligne.valeur;
        } else if (ligne.type === "presenceCommission") {
          jour.commissionPresent += ligne.valeur;
          jour.convocations += ligne.convocations ?? ligne.valeur;
        } else if (ligne.type.startsWith("intervention")) {
          jour.interventions += ligne.valeur;
        } else if (ligne.type.startsWith("question")) {
          jour.questions += ligne.valeur;
        }

        parJour.set(ligne.date, jour);
      }

      return [...parJour.values()].sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error("Error fetching journées acteur:", error);
      return [];
    }
  }
);
