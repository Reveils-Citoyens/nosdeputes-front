import React from "react";
import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import { FilterContainer } from "@/components/FilterContainer";

import { Filter } from "@/components/folderHomePage/Filter";

import DossierList from "@/components/folderHomePage/DossierList";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Dossiers législatifs de l'Assemblée nationale — NosDéputés.fr",
  description:
    "Suivez les dossiers législatifs de l'Assemblée nationale : projets et propositions de loi, résolutions, commissions d'enquête. Filtrez par thème et suivez l'avancée de chaque texte.",
  alternates: { canonical: `${SITE_URL}/dossiers` },
  openGraph: {
    title: "Dossiers législatifs de l'Assemblée nationale",
    description:
      "Projets et propositions de loi, résolutions et commissions d'enquête : suivez l'avancée de chaque texte.",
    url: `${SITE_URL}/dossiers`,
  },
};

export default async function Dossiers() {
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
      <Stack spacing={3} useFlexGap flex={2} maxWidth={300}>
        <React.Suspense>
          <FilterContainer>
            <Filter />
          </FilterContainer>
        </React.Suspense>
      </Stack>
      <Stack spacing={3} flex={5} sx={{ minWidth: 0 }}>
        <React.Suspense>
          <DossierList />
        </React.Suspense>
      </Stack>
    </Container>
  );
}
