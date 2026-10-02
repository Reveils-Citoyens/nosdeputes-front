import React from "react";
import { Stack, Typography } from "@mui/material";

/** Keep the real heading and loading state at exactly the same scale. */
export default function AboutHeader() {
  return <Stack alignItems="center" mb={8} textAlign="center">
    <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
      À propos de NosDéputés.fr
    </Typography>
    <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 800, fontWeight: "light" }}>
      NosDéputés.fr est un site transpartisan géré par une équipe bénévole
      de citoyens, avec pour objectif de promouvoir l’accès à l’activité
      parlementaire française.
    </Typography>
  </Stack>;
}
