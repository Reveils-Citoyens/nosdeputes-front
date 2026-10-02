import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";
import HeroFrame from "@/components/home/HeroFrame";
import TopLoadingBar from "@/components/TopLoadingBar";
import SkeletonStatus from "./SkeletonStatus";

/** Reuse the real hero geometry without mounting a temporary search input
 * that would lose what the visitor types when the real route arrives. */
export default function HomePageSkeleton() {
  return <SkeletonStatus label="Chargement de l’accueil">
    <TopLoadingBar />
    <HeroFrame searchContent={<Box sx={{ maxWidth: 709, width: "100%" }}>
      <Skeleton variant="rounded" animation="wave" height={68} sx={{ borderRadius: "34px", bgcolor: "rgba(23,27,30,0.06)" }} />
      <Skeleton width="45%" height={20} sx={{ mt: 1 }} />
    </Box>} />
    <Box aria-hidden="true" sx={{ maxWidth: 1088, mx: { xs: 1, md: 4, lg: "auto" }, mt: 6, mb: 6 }}>
      <Skeleton width={180} height={28} sx={{ mb: 2 }} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        {[0, 1, 2].map(card => <Skeleton key={card} variant="rounded" height={120} sx={{ flex: 1, width: "100%", borderRadius: 2 }} />)}
      </Stack>
    </Box>
  </SkeletonStatus>;
}
