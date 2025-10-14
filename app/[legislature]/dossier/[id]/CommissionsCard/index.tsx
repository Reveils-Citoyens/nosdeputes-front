import * as React from "react";

import Skeleton from "@mui/material/Skeleton";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import InfoIcon from "@/icons/InfoIcon";

import CommissionItem from "./CommissionItem";

import { Rapporteur } from "@prisma/client";
import ActeurCard from "@/components/folders/ActeurCard";

interface CommissionsCardProps {
  /**
   * Id des commissions saisie sur le fond
   */
  commissionFondIds: string[];
  /**
   * Id des commissions saisie pour avis
   */
  commissionAvisIds: string[];
  /**
   * List des rapporteurs lié au dossier.
   */
  rapporteursPerCommission: Record<string, Rapporteur[]>;
}

export const CommissionsCard = async ({
  commissionFondIds,
  commissionAvisIds,
  rapporteursPerCommission,
}: CommissionsCardProps) => {
  if (
    (!commissionFondIds || commissionFondIds.length === 0) &&
    (!commissionAvisIds || commissionAvisIds.length === 0)
  ) {
    return null;
  }

  return (
    <Accordion elevation={0} disableGutters defaultExpanded color="secondary">
      <AccordionSummary
        aria-controls="commission-content"
        id="commission-header"
      >
        <Typography>Rapporteurs et Rapporteuses</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack direction="column" spacing={2}>
          {commissionFondIds && commissionFondIds.length > 0 && (
            <div>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" fontWeight="light">
                  Commission{commissionFondIds.length > 1 ? "s" : ""} saisie au
                  fond
                </Typography>
                <InfoIcon sx={{ fontSize: "14px" }} />
              </Stack>
              {commissionFondIds.map((commissionId) => (
                <div key={commissionId}>
                  <React.Suspense
                    key={commissionId}
                    fallback={
                      <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                    }
                  >
                    <CommissionItem id={commissionId} pt={1} />
                  </React.Suspense>
                  {rapporteursPerCommission[commissionId]?.map((acteur) => (
                    <ActeurCard
                      key={acteur.acteurRefUid}
                      id={acteur.acteurRefUid}
                      link="name"
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {commissionAvisIds && commissionAvisIds.length > 0 && (
            <div>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" fontWeight="light">
                  Commission{commissionAvisIds.length > 1 ? "s" : ""} saisie
                  pour avis
                </Typography>
                <InfoIcon sx={{ fontSize: "14px" }} />
              </Stack>
              <Stack direction="column" spacing={1} alignItems="start">
                {commissionAvisIds.map((commissionId) => (
                  <div key={commissionId}>
                    <React.Suspense
                      fallback={
                        <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
                      }
                    >
                      <CommissionItem id={commissionId} pt={1} />
                    </React.Suspense>
                    {rapporteursPerCommission[commissionId]?.map((acteur) => (
                      <ActeurCard
                        key={acteur.acteurRefUid}
                        id={acteur.acteurRefUid}
                        link="name"
                      />
                    ))}
                  </div>
                ))}
              </Stack>
            </div>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};
