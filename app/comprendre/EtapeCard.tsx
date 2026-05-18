"use client";

import * as React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  AccessTime as AccessTimeIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import TermifiedText from "@/components/TermifiedText";
import {
  CHAMBRE_COLORS,
  CHAMBRE_LABELS,
  EtapeLegislative,
} from "@/data/processusLegislatif";

export default function EtapeCard({ etape }: { etape: EtapeLegislative }) {
  const [open, setOpen] = React.useState(false);
  const chambreColor = CHAMBRE_COLORS[etape.chambre];
  const chambreLabel = CHAMBRE_LABELS[etape.chambre];

  return (
    <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, position: "relative" }}>
      {/* Colonne gauche : numéro + ligne verticale */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            bgcolor: chambreColor,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: "1.1rem",
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          {etape.numero}
        </Box>
        <Box
          sx={{
            flex: 1,
            width: 2,
            bgcolor: "grey.200",
            mt: 1,
            mb: -1,
          }}
        />
      </Box>

      {/* Colonne droite : contenu */}
      <Box
        component="button"
        onClick={() => setOpen((v) => !v)}
        sx={{
          flex: 1,
          textAlign: "left",
          bgcolor: "white",
          border: "1px solid",
          borderColor: open ? chambreColor : "grey.200",
          borderRadius: "16px",
          p: { xs: 2, md: 3 },
          mb: 3,
          cursor: "pointer",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: open ? "0 4px 16px rgba(0,0,0,0.06)" : "none",
          "&:hover": { borderColor: chambreColor },
          fontFamily: "inherit",
          font: "inherit",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
          <Chip
            label={chambreLabel}
            size="small"
            sx={{
              bgcolor: `${chambreColor}15`,
              color: chambreColor,
              fontWeight: "bold",
              fontSize: "0.7rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              height: 22,
            }}
          />
          {etape.dureeIndicative && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <AccessTimeIcon sx={{ fontSize: 14, color: "grey.500" }} />
              <Typography variant="caption" color="text.secondary">
                {etape.dureeIndicative}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: "#1A1A1B" }}>
          {etape.titre}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          <TermifiedText text={etape.resume} />
        </Typography>

        {/* Section dépliable */}
        <Box
          sx={{
            maxHeight: open ? 600 : 0,
            opacity: open ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.3s ease, opacity 0.3s ease",
            mt: open ? 2 : 0,
          }}
        >
          <Typography variant="body2" sx={{ lineHeight: 1.7, mb: 2, color: "#374151" }}>
            <TermifiedText text={etape.description} />
          </Typography>

          {etape.acteurs.length > 0 && (
            <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
              <GroupIcon sx={{ fontSize: 16, color: "grey.500" }} />
              <Typography variant="caption" color="text.secondary" fontWeight="medium">
                Acteurs impliqués :
              </Typography>
              {etape.acteurs.map((a) => (
                <Chip
                  key={a}
                  label={a}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.75rem" }}
                />
              ))}
            </Stack>
          )}
        </Box>

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: open ? 0 : 1 }}>
          <ExpandMoreIcon
            sx={{
              fontSize: 20,
              color: "grey.500",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </Stack>
      </Box>
    </Box>
  );
}
