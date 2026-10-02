import React from "react";
import Box from "@mui/material/Box";

/** Announce loading without a visible heading that shifts the content. */
export default function SkeletonStatus({ label, children }: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box role="status" aria-live="polite" aria-busy="true" aria-label={label} sx={{ width: "100%", minWidth: 0 }}>
      <Box component="span" sx={{ position: "absolute", width: 1, height: 1, p: 0, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap" }}>{label}</Box>
      <Box aria-hidden="true">{children}</Box>
    </Box>
  );
}
