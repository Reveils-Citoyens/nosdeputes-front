import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Themes from "./Themes";

export default function ThemesSection() {
  return (
    <Box
      sx={{
        maxWidth: 1088,
        margin: {
          xs: 1,
          md: 4,
          lg: "auto",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, mt: 6 }}>
        <Typography variant="subtitle1" component="h2" fontWeight="bold">
          Les grands domaines
        </Typography>
        <Button
          variant="text"
          component={Link}
          href="/themes/"
          endIcon={<ArrowForwardIcon />}
        >
          Tous les thèmes
        </Button>
      </Box>
      <React.Suspense>
        <Themes />
      </React.Suspense>
    </Box>
  );
}
