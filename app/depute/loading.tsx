import * as React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";

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

export default function DeputeLoading() {
  return (
    <>
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
            <Box>
              <Skeleton variant="text" width={260} sx={{ fontSize: "1.7rem" }} />
              <Skeleton variant="text" width={200} sx={{ fontSize: "0.9rem" }} />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
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
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" width={110} height={36} />
              ))}
            </Stack>
            <Box
              sx={{
                p: 3,
                bgcolor: "white",
                border: "1px solid",
                borderColor: "grey.200",
                borderRadius: "12px",
              }}
            >
              <Skeleton variant="text" width="40%" sx={{ fontSize: "1.2rem", mb: 2 }} />
              <Stack spacing={1}>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" />
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
