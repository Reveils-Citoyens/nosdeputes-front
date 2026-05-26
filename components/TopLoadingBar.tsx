import { LinearProgress } from "@mui/material";

/**
 * Fine progress bar pinned just below the navbar (height 80px).
 * Used in loading.tsx files to give immediate visual feedback during
 * route transitions.
 */
export default function TopLoadingBar() {
  return (
    <LinearProgress
      sx={{
        position: "fixed",
        top: 80,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 100,
        bgcolor: "transparent",
        "& .MuiLinearProgress-bar": {
          bgcolor: "#1A1A1B",
        },
      }}
    />
  );
}
