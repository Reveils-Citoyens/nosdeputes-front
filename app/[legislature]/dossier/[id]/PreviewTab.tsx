import React from "react";
import Link from "next/link";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { AdditionalInfoCard } from "@/app/[legislature]/dossier/[id]/AdditionalInfoCard";
import { CommissionsCard } from "./CommissionsCard";

import { LegislativeDocumentsCard } from "@/app/[legislature]/dossier/[id]/LegislativeDocumentsCard";
import { TextStructureCard } from "@/components/folders/TextStructureCard";
import { TimelineCard } from "@/components/folders/TimelineCard";
import { DocumentInlineCard } from "./DocumentInlineCard";

import { getCommissionUids } from "@/app/[legislature]/dossier/[id]/dataFunctions";
import { getDossier } from "@/data/getDossier";
import { dossierSettings, type ApercuVariant } from "./dossierSettings";
import { EnrichmentCard } from "./EnrichmentCard";
import { getDossierEnrichment } from "@/data/mongo/getDossierEnrichment";

type PreviewTabProps = {
  dossier?: Awaited<ReturnType<typeof getDossier>>;
};

export const PreviewTab = async ({ dossier }: PreviewTabProps) => {
  const { actesLegislatifs, rapporteurs, codeProcedure } = dossier!;

  const {
    carteRapporteurs = true,
    carteAmendements = true,
    carteCoSignataires = true,
    carteDocuments = true,
    apercuVariant = "chronologie" as ApercuVariant,
  } = (codeProcedure ? dossierSettings[codeProcedure] : {}) ?? {};

  // getDossierEnrichment est cached via React.cache — pas d'appel DB supplémentaire
  const enrichment = await getDossierEnrichment(dossier!.uid);
  const themesOuverts = enrichment?.themes_ouverts ?? [];

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
          minWidth: 0,
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
        {themesOuverts.length > 0 && (
          <Accordion
            elevation={0}
            disableGutters
            defaultExpanded
            sx={{
              bgcolor: "grey.100",
              borderRadius: "16px",
              "&.MuiAccordion-root": { borderRadius: "16px" },
              "&.Mui-expanded": { borderRadius: "16px", margin: 0 },
              "& .MuiAccordionSummary-root": { borderRadius: "16px" },
            }}
          >
            <AccordionSummary
              sx={{ minHeight: 48, "& .MuiAccordionSummary-content": { my: 1 } }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Mots-clés
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, pb: 2 }}>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {themesOuverts.map((kw) => (
                  <Chip
                    key={kw}
                    label={kw}
                    size="small"
                    component={Link}
                    href={`/recherche?q=${encodeURIComponent(kw)}`}
                    clickable
                    variant="outlined"
                    sx={{
                      fontSize: "0.8rem",
                      height: 28,
                      borderColor: "grey.400",
                      color: "text.secondary",
                      "&:hover": { borderColor: "primary.main", color: "primary.main" },
                    }}
                  />
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          flex: 5,
          minWidth: 0,
        }}
      >
        <EnrichmentCard dossierUid={dossier!.uid} />
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
