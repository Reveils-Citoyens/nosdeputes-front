"use client";

import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HowToVoteIcon from "@mui/icons-material/HowToVote";

import { ScrutinComplet } from "@/data/getDossierVotes";
import StatusChip from "@/components/StatusChip";
import { VotesGroups } from "./VotesGroups";

function getScrutinStatus(code: string | null) {
  if (code) {
    const s = code.toLowerCase().trim();
    if (s === "adopté" || s === "adopte")
      return { status: "validated" as const, label: "Adopté" };
    if (s === "rejeté" || s === "rejete")
      return { status: "refused" as const, label: "Rejeté" };
  }
  return { status: "review" as const, label: "Résultat non communiqué" };
}

export function ScrutinCard({ scrutin }: { scrutin: ScrutinComplet }) {
  const totalVotes = scrutin.pour + scrutin.contre + scrutin.abstentions;
  const pctPour = totalVotes > 0 ? (scrutin.pour / totalVotes) * 100 : 0;
  const pctContre = totalVotes > 0 ? (scrutin.contre / totalVotes) * 100 : 0;
  const { label, status } = getScrutinStatus(scrutin.code);

  return (
    <Accordion
      elevation={0}
      disableGutters
      defaultExpanded={false}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "16px !important",
        overflow: "hidden",
        "&:before": { display: "none" },
        "&.Mui-expanded": { margin: 0 },
        mb: 2,
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          backgroundColor: "white",
          px: 3,
          py: 1.5,
          "& .MuiAccordionSummary-content": {
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            width: "100%",
            my: 1,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="bold"
              sx={{ textTransform: "uppercase", mb: 0.5, display: "block" }}
            >
              Scrutin n°{scrutin.numero} •{" "}
              {scrutin.dateScrutin?.toLocaleDateString("fr-FR")}
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              sx={{ lineHeight: 1.3 }}
            >
              {scrutin.titre}
            </Typography>
          </Box>
          <StatusChip
            label={label}
            status={status}
            sx={{ flexShrink: 0, fontWeight: "bold" }}
          />
        </Box>

        <Box sx={{ width: "100%", mt: 1 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              Résultat de l&apos;assemblée :
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              height: 8,
              width: "100%",
              borderRadius: 4,
              overflow: "hidden",
              bgcolor: "grey.200",
            }}
          >
            <Box sx={{ width: `${pctPour}%`, bgcolor: "success.main" }} />
            <Box sx={{ width: `${pctContre}%`, bgcolor: "error.main" }} />
          </Box>

          <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              fontWeight="bold"
              color="success.main"
            >
              {scrutin.pour} Pour
            </Typography>
            <Typography variant="caption" fontWeight="bold" color="error.main">
              {scrutin.contre} Contre
            </Typography>
            <Typography
              variant="caption"
              fontWeight="medium"
              color="text.secondary"
            >
              {scrutin.abstentions} Abstentions
            </Typography>
          </Stack>
        </Box>
      </AccordionSummary>

      <AccordionDetails
        sx={{
          bgcolor: "grey.50",
          borderTop: "1px solid",
          borderColor: "divider",
          p: 0,
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography
            variant="subtitle2"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <HowToVoteIcon fontSize="small" /> Détail par groupes politiques
          </Typography>
        </Box>
        <VotesGroups votes={scrutin.votes} />
      </AccordionDetails>
    </Accordion>
  );
}
