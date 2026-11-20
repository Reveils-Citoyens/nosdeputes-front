import * as React from "react";
import {
  getDistributions,
  getMetriquesActeur,
} from "@/data/mongo/getStatistiquesMetriques";
import { getFonctionPresidence } from "@/data/mongo/getFonctionPresidence";
import { getValeursMethode } from "@/data/mongo/getValeursMethode";
import { ActeurStatSectionClient } from "./ActeurStatSectionClient";

export async function ActeurStatsSection({ acteurUid }: { acteurUid: string }) {
  const [metriques, distributions, fonctionPresidence, valeurs] = await Promise.all([
    getMetriquesActeur(acteurUid),
    getDistributions(),
    getFonctionPresidence(acteurUid),
    getValeursMethode(),
  ]);

  // Sans distribution, les cartes afficheraient un classement calculé sur rien.
  // Mieux vaut masquer la section que publier un « dans les 20 % les plus
  // actifs » qui ne repose sur aucune population.
  if (distributions.length === 0) {
    return null;
  }

  return (
    <ActeurStatSectionClient
      metriques={metriques}
      distributions={distributions}
      fonctionPresidence={fonctionPresidence}
      dateCalcul={valeurs.dateCalcul}
    />
  );
}
