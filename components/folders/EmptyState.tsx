import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

/**
 * Placeholder d'état vide : icône + titre + message, encadré pointillé.
 * Utilisé quand un dossier n'a pas (encore) de contenu (réunions, comptes rendus…).
 */
export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: { xs: 5, md: 8 },
        px: 3,
        border: "1px dashed",
        borderColor: "grey.300",
        borderRadius: "16px",
        bgcolor: "grey.50",
      }}
    >
      <Box sx={{ color: "grey.400", mb: 1.5, "& svg": { fontSize: 48 } }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: "auto", lineHeight: 1.6 }}>
        {message}
      </Typography>
    </Box>
  );
}
