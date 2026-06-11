"use client";

import * as React from "react";
import Link from "next/link";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import {
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  School as SchoolIcon,
} from "@mui/icons-material";

const STORAGE_KEY = "comprendre-banner-dismissed";

export default function ComprendreBanner() {
  // Start hidden to avoid SSR/hydration flash; reveal after we check localStorage.
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (!dismissed) setVisible(true);
  }, []);

  const handleDismiss = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    window.localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Box
      sx={{
        maxWidth: "1400px",
        width: "100%",
        mx: "auto",
        px: { xs: 2, md: 4 },
        mt: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: { xs: 1.5, md: 2 },
          borderRadius: "12px",
          bgcolor: "#F5F8F7",
          border: "1px solid",
          borderColor: "#D9E5E2",
        }}
      >
        <SchoolIcon
          sx={{
            color: "#2C7A7B",
            fontSize: 22,
            flexShrink: 0,
            display: { xs: "none", sm: "block" },
          }}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={{ xs: 0.5, sm: 1 }}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <Typography variant="body2" sx={{ color: "#1A1A1B" }}>
            Première fois sur une page de dossier ?
          </Typography>
          <Link
            href="/comprendre"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{
                  color: "#2C7A7B",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  "&:hover": { color: "#1F5F60" },
                }}
              >
                Comprendre comment une loi est adoptée
              </Typography>
              <ArrowForwardIcon sx={{ fontSize: 16, color: "#2C7A7B" }} />
            </Stack>
          </Link>
        </Stack>
        <IconButton
          onClick={handleDismiss}
          size="small"
          aria-label="Masquer ce message"
          sx={{
            color: "grey.500",
            flexShrink: 0,
            "&:hover": { color: "grey.800", bgcolor: "transparent" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
