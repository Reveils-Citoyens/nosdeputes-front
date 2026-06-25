import * as React from "react";
import type { Metadata } from "next";

import Container from "@mui/material/Container";

import DeputesContent from "./DeputesContent";
import DeputesSkeleton from "./DeputesSkeleton";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Tous les députés de l'Assemblée nationale — NosDéputés.fr",
  description:
    "Annuaire des 577 députés de l'Assemblée nationale : groupe politique, circonscription et activité parlementaire. Recherchez un député par nom, département ou code postal.",
  alternates: { canonical: `${SITE_URL}/deputes` },
  openGraph: {
    title: "Tous les députés de l'Assemblée nationale",
    description:
      "Les 577 députés : groupe politique, circonscription et activité parlementaire.",
    url: `${SITE_URL}/deputes`,
  },
};

export default function DeputesList() {
  return (
    <Container
      sx={{
        pt: 3,
        display: "flex",
        flexDirection: {
          xs: "column",
          md: "row",
        },
        gap: 5,
      }}
    >
      <React.Suspense fallback={<DeputesSkeleton />}>
        <DeputesContent />
      </React.Suspense>
    </Container>
  );
}
