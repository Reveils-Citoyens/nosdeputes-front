import React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

/** Encadré d'une section de l'onglet Travaux (même aspect que /recherche). */
export default function SectionShell({
  icon: Icon,
  title,
  count,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  /** Élément placé à droite du titre (aide, filtres). */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        bgcolor: "white",
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: "16px",
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Icon sx={{ color: "grey.700" }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: "#1A1A1B" }}>
          {title}
        </Typography>
        {count !== undefined && count > 0 && (
          <Chip
            label={count}
            size="small"
            sx={{
              bgcolor: "grey.100",
              color: "grey.700",
              fontWeight: "bold",
              fontSize: "0.7rem",
              height: 22,
            }}
          />
        )}
        {action ? <Box sx={{ ml: "auto" }}>{action}</Box> : null}
      </Stack>
      {children}
    </Box>
  );
}

