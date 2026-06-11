import * as React from "react";
import { Box, Stack, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

type AiDisclaimerProps = {
  variant?: "inline" | "banner";
};

/**
 * À afficher partout où du contenu généré par Mistral (IA souveraine) est présenté.
 * Rappelle l'origine du contenu et les précautions d'usage.
 */
export default function AiDisclaimer({ variant = "inline" }: AiDisclaimerProps) {
  if (variant === "banner") {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          p: 2,
          borderRadius: "10px",
          bgcolor: "grey.50",
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 16, color: "grey.500", mt: 0.25, flexShrink: 0 }} />
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          <strong>Résumé généré par intelligence artificielle</strong> (Mistral, IA souveraine française) —
          Ces synthèses sont produites automatiquement à partir des textes officiels et peuvent contenir
          des inexactitudes ou des omissions. Elles ne constituent pas une référence juridique.
          Consultez les{" "}
          <strong>textes officiels</strong> sur le site de l&apos;Assemblée nationale pour toute
          décision ou usage formel.
        </Typography>
      </Box>
    );
  }

  // variant="inline" : version compacte, une seule ligne
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <AutoAwesomeIcon sx={{ fontSize: 13, color: "grey.400" }} />
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
        Synthèse générée par IA (Mistral) · Contenu indicatif, à vérifier sur les sources officielles
      </Typography>
    </Stack>
  );
}
