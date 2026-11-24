import React from "react";
import WeeklyActivitySection from "./WeeklyActivity/WeeklyActivitySection";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { getPeriodesMandat } from "@/data/getPeriodesMandat";
import { getSituationActeur } from "@/data/getSituationActeur";
import { horsAssemblee, mandatInterrompu } from "@/lib/situationActeur";
import { ActeurStatsSection } from "./ActeurStatsSection";
import { DernieresPrisesDeParoleSection } from "./DernieresPrisesDeParoleSection";
import HorsAssemblee from "./HorsAssemblee";
import Skeleton from "@mui/material/Skeleton";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const acteur = await getActeurBySlug(slug);

  if (acteur === null) {
    return null;
  }

  const [periodes, situation] = await Promise.all([
    getPeriodesMandat(acteur.uid),
    getSituationActeur(acteur.uid),
  ]);
  // Plus de mandat en cours (mandat achevé, ou interrompu par l'entrée au
  // Gouvernement) : les totaux de son mandat, sans classement.
  const mandatAcheve = mandatInterrompu(situation);
  const motifFin = situation.gouvernement ? "gouvernement" : undefined;

  return (
    <div>
      {horsAssemblee(situation) ? (
        <HorsAssemblee
          nom={`${acteur.prenom} ${acteur.nom}`}
          feminin={acteur.civ === "Mme"}
          gouvernement={situation.gouvernement}
          slug={slug}
        />
      ) : (
        <>
          <WeeklyActivitySection
            acteurUid={acteur.uid}
            periodes={periodes}
            mandatAcheve={mandatAcheve}
            motifFin={motifFin}
          />
          <ActeurStatsSection
            acteurUid={acteur.uid}
            periodes={periodes}
            mandatAcheve={mandatAcheve}
            motifFin={motifFin}
          />
        </>
      )}
      <React.Suspense fallback={<Skeleton variant="rectangular" height={180} aria-label="Chargement des dernières vidéos" />}>
        <DernieresPrisesDeParoleSection acteurUid={acteur.uid} />
      </React.Suspense>
    </div>
  );
}
