"use client";
import * as React from "react";
import {
  Typography,
  Stack,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatusChip from "@/components/StatusChip";
import { Amendement, Dossier } from "@prisma/client";
import ActeurCard from "./ActeurCard";
import Link from "next/link";

function getStatus(label: string | null) {
  switch (label) {
    case "Adopté":
      return "validated";
    case "Rejeté":
    case "Irrecevable":
    case "Tombé":
    case "Irrecevable 40":
      return "refused";
    case "Non soutenu":
    case "Retiré":
      return "dropped";
    default:
      return "review";
  }
}

function getAmendementTooltip(label: string | null): string {
  switch (label) {
    case "Adopté":
      return "L'amendement a été mis aux voix et adopté par l'assemblée.";
    case "Rejeté":
      return "L'amendement a été mis aux voix et rejeté par l'assemblée.";
    case "Irrecevable":
      return "L'amendement a été déclaré irrecevable avant examen, pour non-conformité aux règles de procédure.";
    case "Irrecevable 40":
      return "Irrecevable au titre de l'article 40 de la Constitution : l'amendement augmenterait les dépenses publiques ou réduirait les recettes.";
    case "Tombé":
      return "L'amendement est devenu sans objet suite à l'adoption ou au rejet d'un amendement incompatible.";
    case "Non soutenu":
      return "L'auteur n'était pas présent en séance pour défendre son amendement ; il n'a pas été mis aux voix.";
    case "Retiré":
      return "L'auteur a retiré son amendement avant qu'il soit mis aux voix.";
    default:
      return "L'amendement a été déposé et attend d'être examiné en séance.";
  }
}

type AmendementCardProps = {
  amendement: Amendement & { dossierRef?: Dossier | null };
  acteurUid: null | string;
  titre?: string;
};

function GouvernementAvatar(props: { sx?: React.CSSProperties }) {
  return (
    <Box sx={{ display: "flex", minWidth: 0, p: 0.5, ...props.sx }}>
      <Avatar
        sx={{ height: 40, width: 40 }}
        alt="Gouvernement"
        src="/marianne.png"
      >
        Gouv
      </Avatar>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: 1.3,
          minWidth: 0,
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          Gouvernement
        </Typography>
      </Box>
    </Box>
  );
}
export default function AmendementCard(props: AmendementCardProps) {
  const { amendement, acteurUid, titre } = props;
  const nbSignataires = 1 + amendement.nombreCoSignataires;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const pannelId = `${amendement.uid}-pannel`;
  const headerId = `${amendement.uid}-header`;
  return (
    <Accordion
      elevation={0}
      disableGutters
      sx={{
        "&:before": { display: "none" },
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
        "&.Mui-expanded": {
          bgcolor: "rgba(0, 0, 0, 0.01)",
        },
      }}
    >
      <AccordionSummary
        aria-controls={pannelId}
        id={headerId}
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          minHeight: 60,
          cursor: "pointer",
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 1,
            cursor: "pointer",
            minWidth: 0,
            overflow: "hidden",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexGrow: 1,
            minWidth: 0,
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              minWidth: 0,
              flex: 1,
              overflow: "hidden",
            }}
          >
            {titre && (
              <Typography
                variant="subtitle2"
                noWrap
                sx={{ fontWeight: 700, minWidth: 0 }}
              >
                {titre}
              </Typography>
            )}
            {/* stopPropagation : le clic sur le nom/avatar navigue sans toggler l'accordion */}
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{
                flexGrow: 0,
                minWidth: 0,
                maxWidth: isMobile ? 150 : "auto",
              }}
            >
              {amendement.typeAuteur === "Gouvernement" ? (
                <GouvernementAvatar />
              ) : acteurUid ? (
                <ActeurCard id={acteurUid} smallGroupColor link="name" />
              ) : !titre ? (
                // Contexte dossier (pas de titre prop) : pas d'acteur identifié = amendement gouvernemental
                <GouvernementAvatar />
              ) : null}
            </Box>
          </Box>

          <Box sx={{ flexShrink: 0, mr: 1 }}>
            <StatusChip
              size="small"
              label={amendement.sortAmendement}
              status={getStatus(amendement.sortAmendement)}
              tooltip={getAmendementTooltip(amendement.sortAmendement)}
            />
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 3, pt: 0, pb: 3 }}>
        <Stack spacing={3}>
          {amendement.dossierRef && (
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Dossier :
              </Typography>
              <Link
                href={`/${amendement.dossierRef.legislature}/dossier/${amendement.dossierRef.uid}`}
                style={{ textDecoration: "none" }}
              >
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {amendement.dossierRef.titre}
                </Typography>
              </Link>
            </Box>
          )}

          {amendement.dispositif && (
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Dispositif
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  borderLeft: "4px solid",
                  borderColor: "primary.light",
                  borderRadius: "0 4px 4px 0",
                }}
              >
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: amendement.dispositif }}
                />
              </Paper>
            </Box>
          )}

          {amendement.exposeSommaire && (
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Exposé Sommaire
              </Typography>
              <Typography
                component="div"
                variant="body2"
                sx={{ lineHeight: 1.8, color: "text.primary" }}
                dangerouslySetInnerHTML={{ __html: amendement.exposeSommaire }}
              />
            </Box>
          )}

          <Box sx={{ pt: 1 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={{ xs: 2, sm: 0 }}
              sx={{ bgcolor: "grey.100", p: 1.5, borderRadius: 1 }}
            >
              <MetaItem label="Numéro" value={`N°${amendement.numeroLong}`} />
              <MetaItem
                label="Signataires"
                value={
                  amendement.typeAuteur === "Gouvernement"
                    ? "Gouvernement"
                    : `${nbSignataires} député${nbSignataires > 1 ? "s" : ""}`
                }
              />
              <MetaItem
                label="Dépôt"
                value={
                  amendement.dateDepot
                    ? new Date(amendement.dateDepot).toLocaleDateString("fr-FR")
                    : "-"
                }
              />
              {amendement.dateSort && (
                <MetaItem
                  label="Examen"
                  value={new Date(amendement.dateSort).toLocaleDateString("fr-FR")}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography
        variant="caption"
        display="block"
        sx={{
          color: "text.secondary",
          textTransform: "uppercase",
          fontSize: "0.6rem",
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
        {value}
      </Typography>
    </Box>
  );
}
