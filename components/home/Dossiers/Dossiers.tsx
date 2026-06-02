import * as React from "react";
import Box from "@mui/material/Box";
import DossierCard from "./DossierCard";

import { getHotDossiers } from "@/data/getHotDossiers";

// ─── Ancienne version : top dossiers via API Tricoteuses + N+1 amendements ───
//
// import { Dossier, ActeLegislatif } from "@prisma/client";
// import { getCurrentStatus, statusInfo } from "@/app/[legislature]/dossier/[id]/dataFunctions";
// import { TYPES_DE_DOSSIERS } from "@/components/const";
// import { searchAmendement } from "@/data/searchAmendement";
//
// type DossierEnriched = Dossier & {
//   actesLegislatifs: ActeLegislatif[];
//   nbAmendements: number;
// };
//
// async function getLastDossiersUnCached(): Promise<DossierEnriched[]> {
//   try {
//     const rep = await fetch(
//       `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/?dataset=17&chambre=AN&sort=dateDernierActe.desc&perPage=12&include=actesLegislatifs`
//     );
//     const { data: dossiers } = await rep.json();
//     const dossiersAvecCompteurs = await Promise.all(
//       (dossiers as Dossier[]).map(async (dossier) => {
//         const amendementsResult = await searchAmendement({
//           dossierUid: dossier.uid,
//           perPage: 1,
//         });
//         return {
//           ...dossier,
//           nbAmendements: amendementsResult?.pagination.total ?? 0,
//           actesLegislatifs: (dossier as any).actesLegislatifs ?? [],
//         };
//       })
//     );
//     return dossiersAvecCompteurs;
//   } catch (error) {
//     console.error("Erreur chargement dossiers home:", error);
//     return [];
//   }
// }
// const getLastDossiers = React.cache(getLastDossiersUnCached);

// ─── Nouvelle version : top dossiers via heatScore pré-calculé en Mongo ──────

export default async function Dossiers() {
  const dossiers = await getHotDossiers(12);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gridGap: 24,
      }}
    >
      {dossiers.map((dossier) => (
        <DossierCard
          key={dossier.uid}
          href={`/${dossier.legislature}/dossier/${dossier.uid}`}
          titre={dossier.titre}
          typeLabel={dossier.typeLabel}
          badge={dossier.badge}
          tldr={dossier.tldr}
          themes={dossier.themes}
        />
      ))}
    </Box>
  );
}
