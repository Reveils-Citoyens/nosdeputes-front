import React from "react";
import { Box, Container, Skeleton, Stack, Typography } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";
import SkeletonStatus from "./SkeletonStatus";

export default function SearchPageSkeleton({ query }: { query?: string }) {
  return <SkeletonStatus label={query ? `Chargement des résultats pour ${query}` : "Chargement des résultats de recherche"}>
    <TopLoadingBar />
    <Container sx={{ pt: 3, pb: 6, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 5 }}>
      <Stack spacing={3} useFlexGap flex={2} maxWidth={300} sx={{ minWidth: 0, width: "100%" }}>
        <Skeleton variant="rounded" height={210} sx={{ borderRadius: "16px" }} />
      </Stack>
      <Stack spacing={3} flex={5} sx={{ minWidth: 0 }}>
        <Stack spacing={0.5}>
          <Typography variant="overline" sx={{ fontWeight: "bold", letterSpacing: "0.15em", color: "grey.600" }}>Résultats de recherche</Typography>
          {query !== undefined
            ? <Typography component="h1" sx={{ fontSize: { xs: "1.5rem", md: "2rem" }, fontWeight: "bold", color: "#1A1A1B" }}>{query ? `« ${query} »` : "Saisir une requête"}</Typography>
            : <Skeleton width="60%" height={48} />}
        </Stack>
        <Typography variant="body2" color="text.secondary">Recherche en cours…</Typography>
        {["Dossiers", "Députés", "Amendements", "Questions", "Débats"].map(title => (
          <Box key={title} sx={{ bgcolor: "white", border: 1, borderColor: "grey.200", borderRadius: "16px", p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>{title}</Typography>
            <Skeleton height={48} /><Skeleton height={48} /><Skeleton height={48} />
          </Box>
        ))}
      </Stack>
    </Container>
  </SkeletonStatus>;
}
