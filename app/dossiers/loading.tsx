import * as React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";

function DossierCardSkeleton() {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: "12px",
        bgcolor: "white",
      }}
    >
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <Skeleton variant="rounded" width={80} height={22} />
        <Skeleton variant="rounded" width={60} height={22} />
      </Stack>
      <Skeleton variant="text" sx={{ fontSize: "1.1rem" }} />
      <Skeleton variant="text" width="80%" sx={{ fontSize: "1.1rem" }} />
      <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
        <Skeleton variant="text" width={100} sx={{ fontSize: "0.75rem" }} />
        <Skeleton variant="text" width={120} sx={{ fontSize: "0.75rem" }} />
      </Stack>
    </Box>
  );
}

export default function DossiersLoading() {
  return (
    <>
      <TopLoadingBar />
      <Container
        sx={{
          pt: 3,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 5,
        }}
      >
        {/* Sidebar filtres */}
        <Stack spacing={2} sx={{ flex: { xs: "unset", md: "0 0 280px" } }}>
          <Skeleton variant="text" width={120} sx={{ fontSize: "1rem" }} />
          <Skeleton variant="rounded" height={42} />
          <Skeleton variant="rounded" height={42} />
          <Skeleton variant="rounded" height={42} />
        </Stack>

        {/* Liste des dossiers */}
        <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <DossierCardSkeleton key={i} />
          ))}
        </Stack>
      </Container>
    </>
  );
}
