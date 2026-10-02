import React from "react";
import { Box, Container, Skeleton, Stack, Typography } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";
import SkeletonStatus from "./SkeletonStatus";
import DeputesPageSkeleton from "./DeputesPageSkeleton";
import DossiersPageSkeleton from "./DossiersPageSkeleton";
import ComprendrePageSkeleton from "./ComprendrePageSkeleton";
import type { MainNavigationPath } from "./pageNavigationTarget";
import AboutHeader from "@/components/about/AboutHeader";

function TextLines({ widths = ["100%", "96%", "84%"] }: { widths?: string[] }) {
  return <Stack spacing={1}>
    {widths.map((width, index) => <Skeleton key={index} variant="rounded" animation="wave" height={10} width={width} sx={{ bgcolor: "rgba(23,27,30,0.06)", borderRadius: 1 }} />)}
  </Stack>;
}

export function ThemesPageSkeleton() {
  return <SkeletonStatus label="Chargement des thèmes">
    <TopLoadingBar />
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={2} sx={{ mb: 6 }}>
        <Typography variant="overline" fontWeight="bold" color="text.secondary">Thèmes</Typography>
        <Typography component="h1" sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" }, fontWeight: "bold", lineHeight: 1.2 }}>Explorer par grand domaine</Typography>
        <Skeleton height={26} width="85%" /><Skeleton height={26} width="65%" />
      </Stack>
      <Stack spacing={5}>
        {[0, 1, 2].map(group => <Box key={group}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 1.5, mb: 2 }}>
            <Skeleton variant="rounded" width={48} height={48} />
            <Box sx={{ flex: 1, minWidth: 0 }}><Skeleton width="60%" height={30} /><Skeleton width="30%" height={20} /></Box>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, ml: { xs: 0, sm: 4 } }}>
            {[0, 1, 2, 3].map(card => <Skeleton key={card} variant="rounded" height={62} sx={{ borderRadius: "10px" }} />)}
          </Box>
        </Box>)}
      </Stack>
    </Container>
  </SkeletonStatus>;
}

export function AboutPageSkeleton() {
  return <SkeletonStatus label="Chargement de À propos">
    <TopLoadingBar />
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <AboutHeader />
      <Box sx={{ p: 4, mb: 6, bgcolor: "grey.50", borderRadius: 2 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Notre Histoire</Typography>
        <TextLines widths={["100%", "97%", "88%", "94%", "65%"]} />
      </Box>
      <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ mb: 4 }}>Ce qui nous unit</Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={4} sx={{ mb: 8 }}>
        {["Neutralité", "Transparence", "Open Source"].map(title => <Box key={title} sx={{ flex: 1, minWidth: 0, p: 3, bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200", borderRadius: 1 }}>
          <Skeleton variant="circular" animation="wave" width={56} height={56} sx={{ mx: "auto", mb: 2, bgcolor: "rgba(23,27,30,0.06)" }} />
          <Typography variant="h6" fontWeight="bold" textAlign="center" sx={{ mb: 3 }}>{title}</Typography>
          <TextLines widths={["100%", "95%", "88%", "68%"]} />
        </Box>)}
      </Stack>
      <Box sx={{ borderTop: "1px solid", borderColor: "grey.200", pt: 6, mb: 8 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>Notre ambition</Typography>
        <Box sx={{ maxWidth: 600 }}><TextLines widths={["100%", "94%", "76%"]} /></Box>
      </Box>
    </Container>
  </SkeletonStatus>;
}

/** Shared by route fallbacks and optimistic client navigation. */
export default function MainPageSkeleton({ page }: { page: MainNavigationPath }) {
  switch (page) {
    case "/deputes": return <DeputesPageSkeleton />;
    case "/dossiers": return <DossiersPageSkeleton />;
    case "/themes": return <ThemesPageSkeleton />;
    case "/comprendre": return <ComprendrePageSkeleton />;
    case "/about": return <AboutPageSkeleton />;
  }
}
