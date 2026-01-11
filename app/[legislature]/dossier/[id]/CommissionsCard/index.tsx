import * as React from "react";

import Skeleton from "@mui/material/Skeleton";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import InfoIcon from "@/icons/InfoIcon";

import CommissionItem from "./CommissionItem";

import { Rapporteur } from "@prisma/client";
import ActeurCard from "@/components/folders/ActeurCard";
import InfoDialogIcon from "@/components/InfoDialog/InfoDialogIcon";

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
    <Accordion
      elevation={0}
      disableGutters
      defaultExpanded
      sx={{
        bgcolor: "grey.100",
        borderRadius: "16px",
        overflow: "hidden",
        "&:before": { display: "none" },
        "&.MuiAccordion-root": { borderRadius: "16px" },
        "&.Mui-expanded": { borderRadius: "16px", margin: 0 },
        "& .MuiAccordionSummary-root": { borderRadius: "16px" },
      }}
    >
      <AccordionSummary
        aria-controls="commission-content"
        id="commission-header"
        sx={{ minHeight: 48, "& .MuiAccordionSummary-content": { my: 1 } }}
      >
        <Typography variant="subtitle1" fontWeight={"bold"}>
          Rapporteurs
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 2 }}>
        <Stack direction="column" spacing={3}>
          {commissionFondIds && commissionFondIds.length > 0 && (
            <Box>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" fontWeight="light" color="grey.600">
                  Commission{commissionFondIds.length > 1 ? "s" : ""} saisie
                  {commissionFondIds.length > 1 ? "s" : ""} au fond
                </Typography>
                <InfoDialogIcon
                  sx={{ fontSize: "14px" }}
                  category="test"
                  item="test2"
                />
              </Stack>
              {commissionFondIds.map((commissionId) => (
                <div
                  key={commissionId}
                  style={{ paddingLeft: 0, paddingBottom: 4 }}
                >
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
            </Box>
          )}

          {commissionAvisIds && commissionAvisIds.length > 0 && (
            <div>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="body2" fontWeight="light" color="grey.600">
                  Commission{commissionAvisIds.length > 1 ? "s" : ""} saisie{commissionAvisIds.length > 1 ? "s" : ""} pour
                  avis
                </Typography>
                <InfoIcon sx={{ fontSize: "14px" }} />
              </Stack>
              <Stack direction="column" spacing={1} alignItems="start">
                {commissionAvisIds.map((commissionId) => (
                  <div key={commissionId}>
                    <React.Suspense
                      fallback={
                        <Skeleton
                          variant="text"
                          sx={{ fontWeight: "medium", fontSize: "1rem" }}
                        />
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
