import * as React from "react";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export function PendingActeur() {
  return (
    <Box
      sx={[
        {
          px: 0.5,
          py: 0.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        },
      ]}
    >
      <Box sx={{ display: "flex", minWidth: 0, gap: 0, my: 0 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 1,
            minWidth: 0,
          }}
        >
          <Skeleton variant="text" sx={{ fontSize: "1rem", minWidth: 80 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Skeleton variant="circular" width={12} height={12} />
            <Skeleton variant="text" sx={{ fontSize: "0.7rem", minWidth: 30 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
