import * as React from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";

/** Encadré d'une catégorie de résultats de /recherche (serveur ou navigateur). */
export default function SectionShell({
  icon: Icon,
  title,
  count,
  action,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number | string;
  /** Élément placé à droite du titre (filtres). */
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
        {count !== undefined && (
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

export function EmptyRow({ message }: { message: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
      {message}
    </Typography>
  );
}
