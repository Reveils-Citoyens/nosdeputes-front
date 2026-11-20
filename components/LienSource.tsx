"use client";

import * as React from "react";
import { Box, Tooltip } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

type Props = {
  /** URL officielle (cf. lib/sourcesAN). Sans URL, rien n'est affiché. */
  href: string | null | undefined;
  /** Texte du lien. Par défaut « Source : Assemblée nationale ». */
  children?: React.ReactNode;
  /** Ce qui est sourcé, pour les statistiques d'usage (dossier, amendement…). */
  type: string;
  /** Icône seule, avec infobulle : pour les en-têtes de carte, étroits. */
  icone?: boolean;
  sx?: React.ComponentProps<typeof Box>["sx"];
};

/**
 * Lien vers la source officielle d'un contenu, sur le site de l'Assemblée.
 * Le même partout, pour qu'un lecteur — ou un député qui conteste un chiffre —
 * sache toujours où vérifier.
 */
export default function LienSource({ href, children, type, icone = false, sx }: Props) {
  if (!href) return null;
  const lien = (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Souvent placé dans l'en-tête d'un accordéon : le clic ouvre la source
      // sans replier ni déplier la carte.
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      onFocus={(e: React.FocusEvent) => e.stopPropagation()}
      data-umami-event="source-an"
      data-umami-event-type={type}
      aria-label={icone ? "Voir la source sur le site de l'Assemblée nationale (nouvel onglet)" : undefined}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        fontSize: "0.75rem",
        fontWeight: 500,
        color: "text.secondary",
        textDecoration: "none",
        whiteSpace: "nowrap",
        "&:hover": { color: "primary.main", textDecoration: "underline" },
        ...sx,
      }}
    >
      {!icone && (children ?? "Source : Assemblée nationale")}
      <OpenInNewIcon sx={{ fontSize: icone ? 16 : 13 }} />
    </Box>
  );
  return icone ? <Tooltip title="Voir la source sur le site de l'Assemblée nationale">{lien}</Tooltip> : lien;
}
