import * as React from "react";
import {
  getDistributions,
  getMetriquesActeur,
} from "@/data/mongo/getStatistiquesMetriques";
import { getFonctionPresidence } from "@/data/mongo/getFonctionPresidence";
import { getValeursMethode } from "@/data/mongo/getValeursMethode";
import type { PeriodeMandat } from "@/lib/periodesMandat";
import { ActeurStatMandatClient, ActeurStatSectionClient } from "./ActeurStatSectionClient";

export async function ActeurStatsSection({
  acteurUid,
  periodes = [],
  mandatAcheve = false,
  motifFin,
}: {
  acteurUid: string;
  periodes?: PeriodeMandat[];
  mandatAcheve?: boolean;
  motifFin?: "gouvernement";
}) {
  const [metriques, distributions, fonctionPresidence, valeurs] = await Promise.all([
    getMetriquesActeur(acteurUid),
    getDistributions(),
    getFonctionPresidence(acteurUid),
    getValeursMethode(),
  ]);

  // Mandat achevé : ses totaux sur la durée de son mandat, sans classement
  // (statistiques_activite.py, période « MANDAT »). Tant qu'ils ne sont pas
  // calculés, rien plutôt que des zéros qui le feraient passer pour inactif.
  if (mandatAcheve) {
    const duMandat = metriques.filter((metrique) => metrique.periode === "MANDAT");
    if (duMandat.length === 0) return null;
    const debut = periodes[0]?.debut ?? null;
    const fin = periodes.at(-1)?.fin ?? null;
    return (
      <ActeurStatMandatClient metriques={duMandat} mandat={{ debut, fin }} motifFin={motifFin} dateCalcul={valeurs.dateCalcul} />
    );
  }

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
