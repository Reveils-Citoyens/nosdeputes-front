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

export default function SearchAmendementCard({
  amendement: a,
}: {
  amendement: AmendementSearchResult;
}) {
  const [expanded, setExpanded] = React.useState(false);
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
      expanded={expanded}
      onChange={(_, v) => setExpanded(v)}
      elevation={0}
      disableGutters
      sx={{
        "&:before": { display: "none" },
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
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
            pr: 1.5,
          },
        }}
      >
        {/* Ligne 1 : titre dossier — seul le texte est un lien, pas toute la ligne */}
        <Typography variant="body2" fontWeight="bold" noWrap sx={{
          minWidth: 0,
          "& a": { color: "inherit", textDecoration: "none", "&:hover": { textDecoration: "underline" } },
        }}>
          {dossierHref && a.dossierTitre ? (
            <Link href={dossierHref} onClick={(e) => e.stopPropagation()}>
              {a.dossierTitre}
            </Link>
          ) : (
            a.dossierTitre ?? "—"
          )}
        </Typography>

        {/* Ligne 2 : auteur (gauche) + statut chip (droite, toujours visible) */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ minWidth: 0 }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{ minWidth: 0, flex: "0 0 auto" }}
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
          <Box sx={{ flexShrink: 0 }}>
            <StatusChip
              size="small"
              label={a.sortAmendement ?? "À discuter"}
              status={getStatus(a.sortAmendement)}
              tooltip={getAmendementTooltip(a.sortAmendement)}
            />
          </Box>
        </Stack>

        {/* Ligne 3 : teaser de l'exposé sommaire — masqué quand la carte est ouverte
            (le texte complet apparaît dans les détails, évite la répétition) */}
        {!expanded && teaser && (
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
            {dateSort && <MetaItem label="Examen" value={dateSort} />}
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
