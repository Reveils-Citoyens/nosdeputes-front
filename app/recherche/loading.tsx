import * as React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Box
      sx={{
        bgcolor: "white",
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: "16px",
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={140} sx={{ fontSize: "1.2rem" }} />
      </Stack>
      <Stack spacing={1.5}>
        {Array.from({ length: rows }).map((_, i) => (
          <Stack key={i} direction="row" spacing={1.5} alignItems="center">
            <Skeleton variant="circular" width={36} height={36} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="text" width="45%" sx={{ fontSize: "0.75rem" }} />
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function RechercheLoading() {
  return (
    <>
      <TopLoadingBar />
      <Container
        sx={{
          pt: 3,
          pb: 6,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 5,
        }}
      >
        {/* Sidebar */}
        <Stack spacing={2} useFlexGap flex={2} maxWidth={300}>
          <Skeleton variant="rounded" height={210} sx={{ borderRadius: "16px" }} />
        </Stack>

        {/* Résultats */}
        <Stack spacing={3} flex={5} sx={{ minWidth: 0 }}>
          <Stack spacing={0.5}>
            <Skeleton variant="text" width={170} sx={{ fontSize: "0.75rem" }} />
            <Skeleton variant="text" width="60%" sx={{ fontSize: "2rem" }} />
          </Stack>
          <SectionSkeleton rows={3} />
          <SectionSkeleton rows={3} />
          <SectionSkeleton rows={2} />
          <SectionSkeleton rows={2} />
        </Stack>
      </Container>
    </>
  );
}
