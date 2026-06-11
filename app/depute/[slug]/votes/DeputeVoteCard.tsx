"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Link from "next/link";
import Chip from "@mui/material/Chip"; // Import du Chip
import DescriptionIcon from "@mui/icons-material/Description";
import { Vote, Scrutin, Dossier } from "@prisma/client";
import StatusChip from "@/components/StatusChip";
import CircleDiv from "@/icons/CircleDiv";

const VOTE_COLOR = {
  pour: "green",
  contre: "red",
  abstention: "gray",
  nonVotant: "black",
};

const VOTE_LABEL = {
  pour: "A voté POUR",
  contre: "A voté CONTRE",
  abstention: "S'est ABSTENU",
  nonVotant: "N'a PAS pris part au vote",
};

function getScrutinStatus(label: string | null, pour: number, contre: number) {
  if (label) {
    const s = label.toLowerCase();
    // Tester "n'a pas adopté" AVANT "adopté" pour éviter le faux positif
    if (s.includes("n'a pas adopté") || s.includes("na pas adopté") || s.includes("rejeté"))
      return { status: "error" as const, label };
    if (s.includes("adopté"))
      return { status: "validated" as const, label };
  }
  if (pour > contre) return { status: "validated" as const, label: "Adopté" };
  return { status: "error" as const, label: "Rejeté" };
}

type ScrutinWithDossier = Scrutin & {
  dossierRef?: Dossier | null;
};

export function DeputeVoteCard({ 
  vote, 
  scrutin 
}: { 
  vote: Vote; 
  scrutin: ScrutinWithDossier 
}) {
  const totalVotes = scrutin.pour + scrutin.contre + scrutin.abstentions;
  const pctPour = totalVotes > 0 ? (scrutin.pour / totalVotes) * 100 : 0;
  const pctContre = totalVotes > 0 ? (scrutin.contre / totalVotes) * 100 : 0;
  
  const scrutinMeta = getScrutinStatus(scrutin.annonce, scrutin.pour, scrutin.contre);
  
  const userVoteColor = VOTE_COLOR[vote.positionVote as keyof typeof VOTE_COLOR] || "gray";
  const userVoteLabel = VOTE_LABEL[vote.positionVote as keyof typeof VOTE_LABEL] || vote.positionVote;

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "12px",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        gap: 2
      }}
    >
      {/* En-tête : numéro + badge sur une ligne, titre en pleine largeur dessous */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ textTransform: "uppercase" }}>
              Scrutin n°{scrutin.numero} • {scrutin.dateScrutin?.toLocaleDateString("fr-FR") ?? ''}
            </Typography>
            {scrutin.dossierRef && (
              <Chip
                label="Voir le dossier"
                component={Link}
                href={`/${scrutin.dossierRef.legislature}/dossier/${scrutin.dossierRef.uid}`}
                icon={<DescriptionIcon style={{ fontSize: 14 }} />}
                variant="outlined"
                size="small"
                clickable
                sx={{
                  height: 24,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  borderColor: "grey.300",
                  color: "text.secondary",
                  "& .MuiChip-icon": { color: "inherit" },
                  "&:hover": {
                    bgcolor: "grey.50",
                    borderColor: "primary.main",
                    color: "primary.main",
                  },
                }}
              />
            )}
          </Stack>
          <StatusChip
            label={scrutinMeta.label}
            status={scrutinMeta.status}
            size="small"
            sx={{ flexShrink: 0, fontWeight: "bold" }}
          />
        </Stack>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
          {scrutin.titre ? scrutin.titre.charAt(0).toUpperCase() + scrutin.titre.slice(1) : ""}
        </Typography>
      </Box>

      {/* Cœur de la carte */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems={{ xs: "flex-start", md: "center" }}>
        
        <Box 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 1.5, 
            bgcolor: "grey.50", 
            py: 1, 
            px: 2, 
            borderRadius: 2,
            border: "1px solid",
            borderColor: "grey.200",
            minWidth: 200
          }}
        >
          <CircleDiv color={userVoteColor} size={12} />
          <Typography variant="body2" fontWeight="bold" sx={{ color: "text.primary" }}>
            {userVoteLabel}
          </Typography>
          {vote.parDelegation && (
             <Typography variant="caption" color="text.secondary" fontStyle="italic">
               (par dél.)
             </Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, width: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
             <Typography variant="caption" color="text.secondary">Résultat de l&apos;assemblée :</Typography>
          </Box>
          <Box sx={{ display: "flex", height: 6, width: "100%", borderRadius: 3, overflow: "hidden", bgcolor: "grey.200" }}>
            <Box sx={{ width: `${pctPour}%`, bgcolor: "success.main" }} />
            <Box sx={{ width: `${pctContre}%`, bgcolor: "error.main" }} />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
             <Typography variant="caption" sx={{ color: "success.main" }}>{scrutin.pour} Pour</Typography>
             <Typography variant="caption" sx={{ color: "error.main" }}>{scrutin.contre} Contre</Typography>
          </Stack>
        </Box>

      </Stack>
    </Paper>
  );
}