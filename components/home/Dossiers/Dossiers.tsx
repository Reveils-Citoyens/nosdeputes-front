import * as React from "react";
import Box from "@mui/material/Box";
import DossierCard from "./DossierCard";

import { Dossier, ActeLegislatif } from "@prisma/client";
import { getCurrentStatus, statusInfo } from "@/app/[legislature]/dossier/[id]/dataFunctions";
import { TYPES_DE_DOSSIERS } from "@/components/const";
import { searchAmendement } from "@/data/searchAmendement";

type DossierEnriched = Dossier & {
  actesLegislatifs: ActeLegislatif[];
  nbAmendements: number;
};

async function getLastDossiersUnCached(): Promise<DossierEnriched[]> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/?dataset=17&chambre=AN&sort=dateDernierActe.desc&perPage=12&include=actesLegislatifs`
    );

    const { data: dossiers } = await rep.json();

    // 2. Pour chaque dossier, on lance une recherche d'amendements en parallèle
    // on demande "perPage: 1" car on veut juste le "total" dans la pagination
    const dossiersAvecCompteurs = await Promise.all(
      (dossiers as Dossier[]).map(async (dossier) => {
        const amendementsResult = await searchAmendement({
          dossierUid: dossier.uid,
          perPage: 1, 
        });

        return {
          ...dossier,
          nbAmendements: amendementsResult?.pagination.total ?? 0,
          // On force le typage ici car on sait qu'on a demandé l'include plus haut
          actesLegislatifs: (dossier as any).actesLegislatifs ?? [] 
        };
      })
    );

    return dossiersAvecCompteurs;
  } catch (error) {
    console.error("Erreur chargement dossiers home:", error);
    return [];
  }
}

const getLastDossiers = React.cache(getLastDossiersUnCached);

export default async function Dossiers() {
  const dossiers = await getLastDossiers();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
        gridGap: 24,
      }}
    >
    {dossiers.map((dossier) => {
        const typeInfo = TYPES_DE_DOSSIERS.find(t => t.code === dossier.codeProcedure);
        const typeLabel = typeInfo ? typeInfo.label : "Dossier";
        const statusCode = getCurrentStatus(dossier.actesLegislatifs || []);
        const statusLabel = statusCode ? statusInfo[statusCode]?.label : null;
        const statusType = statusCode ? statusInfo[statusCode]?.status : undefined;

        return (
          <DossierCard
            key={dossier.uid}
            href={`/${dossier.legislature}/dossier/${dossier.uid}`}
            titre={dossier.titre}
            dateDernierActe={dossier.dateDernierActe ? new Date(dossier.dateDernierActe) : null}
            type={typeLabel}
            statusLabel={statusLabel}
            statusType={statusType}
            amendements={dossier.nbAmendements}
            // thematique={dossier.theme} pour le moment en attendant Thomas 
          />
        );
      })}
    </Box>
  );
}
