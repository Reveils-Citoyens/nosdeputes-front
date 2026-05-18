"use client";

import * as React from "react";
import { Box, Popover, Typography } from "@mui/material";
import { getTerm } from "@/data/glossaire";

type TermProps = {
  term: string;
  children: React.ReactNode;
  /**
   * Style adjustment when the term is displayed on a dark background.
   * Uses a lighter underline color for contrast.
   */
  variant?: "default" | "onDark";
};

export default function Term({ term, children, variant = "default" }: TermProps) {
  const entry = getTerm(term);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  if (!entry) {
    return <>{children}</>;
  }

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);

  const underlineColor =
    variant === "onDark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.25)";
  const hoverColor =
    variant === "onDark" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.65)";

  return (
    <>
      <Box
        component="span"
        role="button"
        tabIndex={0}
        aria-label={`Définition de ${entry.titre}`}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setAnchorEl(e.currentTarget);
          }
        }}
        sx={{
          cursor: "help",
          borderBottom: `1.5px dashed ${underlineColor}`,
          paddingBottom: "1px",
          transition: "border-color 0.15s ease",
          "&:hover, &:focus-visible": {
            borderBottomColor: hoverColor,
            borderBottomStyle: "solid",
            outline: "none",
          },
        }}
      >
        {children}
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              maxWidth: 360,
              p: 2,
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            },
          },
        }}
      >
        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.75 }}>
          {entry.titre}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
          {entry.definitionCourte}
        </Typography>
        {entry.definitionLongue && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, lineHeight: 1.5 }}
          >
            {entry.definitionLongue}
          </Typography>
        )}
      </Popover>
    </>
  );
}
