import * as React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";
import SkeletonStatus from "./SkeletonStatus";
import { DeputeActivitySkeleton } from "./DeputeTabSkeleton";

function SidebarCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "grey.100",
        borderRadius: "16px",
      }}
    >
      <Skeleton variant="text" width={140} sx={{ fontSize: "1rem", mb: 1.5 }} />
      <Stack spacing={1}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} variant="text" width={`${60 + ((i * 13) % 35)}%`} />
        ))}
      </Stack>
    </Box>
  );
}

export default function DeputePageSkeleton() {
  return (
    <SkeletonStatus label="Chargement de la fiche du député">
      <TopLoadingBar />
      <Box
        sx={{
          maxWidth: "1400px",
          width: "100%",
          mx: "auto",
          my: 5,
          px: { xs: 2, md: 4 },
        }}
      >
        {/* Header : avatar + nom + actions */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={{ xs: 3, md: 0 }}
          sx={{ mb: 4 }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Skeleton
              variant="circular"
              width={90}
              height={90}
              sx={{ display: { xs: "none", md: "block" } }}
            />
            <Skeleton variant="circular" width={70} height={70} sx={{ display: { xs: "block", md: "none" } }} />
            <Box sx={{ minWidth: 0 }}>
              <Skeleton variant="text" width={260} sx={{ maxWidth: "100%", fontSize: "1.7rem" }} />
              <Skeleton variant="text" width={200} sx={{ maxWidth: "100%", fontSize: "0.9rem" }} />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Skeleton variant="circular" width={44} height={44} />
            <Skeleton variant="circular" width={44} height={44} />
            <Skeleton variant="rounded" width={130} height={42} />
            <Skeleton variant="rounded" width={200} height={42} />
          </Stack>
        </Stack>

        <Container
          disableGutters
          maxWidth={false}
          sx={{
            pt: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
          }}
        >
          {/* Colonne gauche : infos */}
          <Stack spacing={3} flex={2} sx={{ minWidth: 0, width: "100%" }}>
            <SidebarCardSkeleton rows={5} />
            <SidebarCardSkeleton rows={3} />
            <SidebarCardSkeleton rows={4} />
          </Stack>

          {/* Colonne droite : tabs + contenu */}
          <Stack spacing={3} flex={5} sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" width={110} height={36} />
              ))}
            </Stack>
            <DeputeActivitySkeleton />
          </Stack>
        </Container>
      </Box>
    </SkeletonStatus>
  );
}
