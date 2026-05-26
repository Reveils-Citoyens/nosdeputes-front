"use client";

import * as React from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatusChip, { Status } from "@/components/StatusChip";
import ActeurCard from "@/components/folders/ActeurCard";
import { htmlToPreview } from "@/lib/htmlPreview";
import type { AmendementSearchResult } from "@/data/mongo/searchAmendementMongo";

function GouvernementCard() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", minWidth: 0, gap: 1 }}>
      <Avatar sx={{ height: 32, width: 32, flexShrink: 0 }} alt="Gouvernement" src="/marianne.png">
        Gouv
      </Avatar>
      <Typography variant="body2" fontWeight="medium" noWrap>
        Gouvernement
      </Typography>
    </Box>
  );
}

function getStatus(label: string | null): Status {
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

export default function SearchAmendementCard({
  amendement: a,
}: {
  amendement: AmendementSearchResult;
}) {
  const teaser = htmlToPreview(a.exposeSommaire, 220);
  const nbSignataires = 1 + a.nombreCoSignataires;
  const dossierHref =
    a.dossierRefUid && a.dossierLegislature
      ? `/${a.dossierLegislature}/dossier/${a.dossierRefUid}`
      : null;
  const dateDepot = a.dateDepot
    ? new Date(a.dateDepot).toLocaleDateString("fr-FR")
    : null;
  const dateSort = a.dateSort
    ? new Date(a.dateSort).toLocaleDateString("fr-FR")
    : null;

  return (
    <Accordion
      elevation={0}
      disableGutters
      sx={{
        "&:before": { display: "none" },
        borderBottom: "1px solid",
        borderColor: "divider",
        "&.Mui-expanded": { bgcolor: "rgba(0, 0, 0, 0.01)" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          py: 1.5,
          "& .MuiAccordionSummary-content": {
            flexDirection: "column",
            alignItems: "stretch",
            gap: 0.75,
            my: 0,
            minWidth: 0,
            overflow: "hidden",
          },
        }}
      >
        {/* Ligne 1 : titre dossier (lien) seul, tronqué si long */}
        {dossierHref && a.dossierTitre ? (
          <Box
            component={Link}
            href={dossierHref}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{
              display: "block",
              minWidth: 0,
              textDecoration: "none",
              color: "primary.main",
              "&:hover .dossier-title": { textDecoration: "underline" },
            }}
          >
            <Typography
              className="dossier-title"
              variant="body2"
              fontWeight="bold"
              noWrap
              sx={{ color: "inherit" }}
            >
              {a.dossierTitre}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" fontWeight="bold" noWrap>
            {a.dossierTitre ?? "—"}
          </Typography>
        )}

        {/* Ligne 2 : auteur (gauche) + sort chip (droite, aligné) */}
        {(a.acteurRefUid || a.typeAuteur === "Gouvernement" || a.sortAmendement) && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ minWidth: 0 }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ minWidth: 0, flex: "1 1 auto" }}
            >
              {a.acteurRefUid ? (
                <ActeurCard
                  id={a.acteurRefUid}
                  link="name"
                  smallGroupColor
                  groupColorSize="small"
                />
              ) : a.typeAuteur === "Gouvernement" ? (
                <GouvernementCard />
              ) : null}
            </Box>
            {a.sortAmendement && (
              <Box sx={{ flexShrink: 0 }}>
                <StatusChip
                  size="small"
                  label={a.sortAmendement}
                  status={getStatus(a.sortAmendement)}
                />
              </Box>
            )}
          </Stack>
        )}

        {/* Ligne 3 : teaser de l'exposé sommaire */}
        {teaser && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
            }}
          >
            {teaser}
          </Typography>
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ px: 3, pt: 0, pb: 3 }}>
        <Stack spacing={3}>
          {a.dispositif && (
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontWeight: "bold", mb: 0.5, display: "block" }}
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
                  dangerouslySetInnerHTML={{ __html: a.dispositif }}
                />
              </Paper>
            </Box>
          )}

          {a.exposeSommaire && (
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontWeight: "bold", mb: 0.5, display: "block" }}
              >
                Exposé sommaire
              </Typography>
              <Typography
                component="div"
                variant="body2"
                sx={{ lineHeight: 1.8, color: "text.primary" }}
                dangerouslySetInnerHTML={{ __html: a.exposeSommaire }}
              />
            </Box>
          )}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={{ xs: 2, sm: 0 }}
            sx={{ bgcolor: "grey.100", p: 1.5, borderRadius: 1 }}
          >
            <MetaItem
              label="Signataires"
              value={
                a.typeAuteur === "Gouvernement"
                  ? "Gouvernement"
                  : `${nbSignataires} député${nbSignataires > 1 ? "s" : ""}`
              }
            />
            <MetaItem label="Dépôt" value={dateDepot ?? "-"} />
            <MetaItem label="Examen" value={dateSort ?? "-"} />
          </Stack>
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
