import React from "react";

import { AdditionalInfoCard } from "@/app/[legislature]/dossier/[id]/AdditionalInfoCard";
import { CommissionsCard } from "./CommissionsCard";

import { LegislativeDocumentsCard } from "@/app/[legislature]/dossier/[id]/LegislativeDocumentsCard";
import { TextStructureCard } from "@/components/folders/TextStructureCard";
import { TimelineCard } from "@/components/folders/TimelineCard";
import { DocumentInlineCard } from "./DocumentInlineCard";

import { getCommissionUids } from "@/app/[legislature]/dossier/[id]/dataFunctions";
import { getDossier } from "@/data/getDossier";
import { dossierSettings, type ApercuVariant } from "./dossierSettings";

type PreviewTabProps = {
  dossier?: Awaited<ReturnType<typeof getDossier>>;
};

export const PreviewTab = ({ dossier }: PreviewTabProps) => {
  const { actesLegislatifs, rapporteurs, codeProcedure } = dossier!;

  const {
    carteRapporteurs = true,
    carteAmendements = true,
    carteCoSignataires = true,
    carteDocuments = true,
    apercuVariant = "chronologie" as ApercuVariant,
  } = (codeProcedure ? dossierSettings[codeProcedure] : {}) ?? {};

  const commissionFondIds = getCommissionUids(actesLegislatifs, "FOND");
  const commissionAvisIds = getCommissionUids(actesLegislatifs, "AVIS");

  const rapporteursPerActe: Record<string, typeof rapporteurs> = {};

  for (const rapporteur of rapporteurs) {
    if (rapporteur.acteLegislatifRefUid) {
      if (rapporteursPerActe[rapporteur.acteLegislatifRefUid] === undefined) {
        rapporteursPerActe[rapporteur.acteLegislatifRefUid] = [];
      }
      rapporteursPerActe[rapporteur.acteLegislatifRefUid].push(rapporteur);
    }
  }

  const rapporteursPerCommission: Record<string, typeof rapporteurs> = {};

  actesLegislatifs.forEach((act) => {
    if (rapporteursPerActe[act.uid] !== undefined) {
      if (
        act.organeRefUid &&
        (commissionAvisIds.includes(act.organeRefUid) ||
          commissionFondIds.includes(act.organeRefUid))
      ) {
        rapporteursPerCommission[act.organeRefUid] =
          rapporteursPerActe[act.uid];
      }
    }
  });

  const documentIds = Array.from(
    new Set(
      actesLegislatifs.flatMap((act) =>
        [act.texteAdopteRefUid, act.texteAssocieRefUid].filter(
          (id) => id !== null
        )
      )
    )
  );

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          flex: 2,
        }}
      >
        {carteRapporteurs && (
          <CommissionsCard
            commissionFondIds={commissionFondIds}
            commissionAvisIds={commissionAvisIds}
            rapporteursPerCommission={rapporteursPerCommission}
          />
        )}
        <AdditionalInfoCard
          documentIds={documentIds}
          legislature={dossier!.legislature?.toString() ?? ""}
          dossierUid={dossier!.uid}
          showAmendements={carteAmendements}
          showCoSignataires={carteCoSignataires}
        />
        {carteDocuments && (
          <LegislativeDocumentsCard documentIds={documentIds} />
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          flex: 5,
        }}
      >
        {apercuVariant === "document" ? (
          <DocumentInlineCard documentUid={dossier!.documentDeposeRefUid} />
        ) : (
          <TimelineCard
            actesLegislatifs={actesLegislatifs}
            dossierUid={dossier!.uid}
            legislature={dossier!.legislature?.toString() ?? ""}
          />
        )}
      </div>
    </div>
  );
};
