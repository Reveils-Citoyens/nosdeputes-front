import React from "react";
import WeeklyActivitySection from "./WeeklyActivity/WeeklyActivitySection";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { ActeurStatsSection } from "./ActeurStatsSection";
import { DernieresPrisesDeParoleSection } from "./DernieresPrisesDeParoleSection";
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

  return (
    <div>
      <WeeklyActivitySection acteurUid={acteur.uid} />
      <ActeurStatsSection acteurUid={acteur.uid} />
      <React.Suspense fallback={<Skeleton variant="rectangular" height={180} aria-label="Chargement des dernières vidéos" />}>
        <DernieresPrisesDeParoleSection acteurUid={acteur.uid} />
      </React.Suspense>
    </div>
  );
}
