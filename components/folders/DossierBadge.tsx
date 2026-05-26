import * as React from "react";
import { Box } from "@mui/material";

export type DossierBadgeCode =
  | "promulgue"
  | "rejete"
  | "retire"
  | "caduc"
  | "actif"
  | "en_pause"
  | "en_cours"
  | "inactif";

type BadgeStyle = {
  label: string;
  bg: string;
  text: string;
  dot: string;
  emoji?: string;
};

const STYLES: Record<DossierBadgeCode, BadgeStyle | null> = {
  promulgue: {
    label: "Promulgué",
    bg: "#dcfce7",
    text: "#166534",
    dot: "#16a34a",
  },
  rejete: {
    label: "Rejeté",
    bg: "#fee2e2",
    text: "#991b1b",
    dot: "#dc2626",
  },
  retire: {
    label: "Retiré",
    bg: "#f3f4f6",
    text: "#374151",
    dot: "#9ca3af",
  },
  caduc: {
    label: "Caduc",
    bg: "#e7e5e4",
    text: "#44403c",
    dot: "#78716c",
  },
  actif: {
    label: "Actif",
    bg: "#FEE2E2",
    text: "#B91C1C",
    dot: "#dc2626",
    emoji: "🔥",
  },
  en_pause: {
    label: "En pause",
    bg: "#fef3c7",
    text: "#92400e",
    dot: "#d97706",
  },
  en_cours: {
    label: "En cours",
    bg: "#dbeafe",
    text: "#1e40af",
    dot: "#2563eb",
  },
  // Pas de badge visible pour les dossiers inactifs : on retourne null
  inactif: null,
};

/**
 * Badge mutuellement exclusif décrivant l'état d'un dossier législatif.
 * Le badge est pré-calculé côté MongoDB (`dossierBadge` field) par le
 * script `compute_dossier_heat_score_notebook.py`.
 */
export default function DossierBadge({
  badge,
  size = "small",
}: {
  badge: DossierBadgeCode | string | null | undefined;
  size?: "small" | "medium";
}) {
  const style = badge ? STYLES[badge as DossierBadgeCode] : null;
  if (!style) return null;

  const fontSize = size === "medium" ? "0.78rem" : "0.72rem";
  const px = size === "medium" ? 1.25 : 1;
  const py = size === "medium" ? 0.5 : 0.4;
  const dotSize = size === "medium" ? 8 : 6;

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.6,
        bgcolor: style.bg,
        color: style.text,
        fontSize,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        px,
        py,
        borderRadius: "7px",
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {style.emoji ? (
        <span style={{ fontSize: "0.9em" }}>{style.emoji}</span>
      ) : (
        <Box
          component="span"
          sx={{
            display: "inline-block",
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            bgcolor: style.dot,
            flexShrink: 0,
          }}
        />
      )}
      {style.label}
    </Box>
  );
}
