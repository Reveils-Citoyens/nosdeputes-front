import * as React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";

function GroupAccordionSkeleton({ deputeCount = 6 }: { deputeCount?: number }) {
  return (
    <Box
      sx={{
        bgcolor: "white",
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: "8px",
        mb: 1,
        p: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="text" width={280} sx={{ fontSize: "1rem" }} />
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 1.5,
        }}
      >
        {Array.from({ length: deputeCount }).map((_, i) => (
          <Stack
            key={i}
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{
              p: 1.5,
              border: "1px solid",
              borderColor: "grey.100",
              borderRadius: "10px",
            }}
          >
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" sx={{ fontSize: "0.9rem" }} />
              <Skeleton variant="text" width="50%" sx={{ fontSize: "0.75rem" }} />
            </Box>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

export default function DeputesLoading() {
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
        {/* Sidebar filtres (squelette) */}
        <Stack spacing={2} sx={{ flex: { xs: "unset", md: "0 0 280px" } }}>
          <Skeleton variant="text" width={120} sx={{ fontSize: "1rem" }} />
          <Skeleton variant="rounded" height={42} />
          <Skeleton variant="rounded" height={42} />
          <Skeleton variant="rounded" height={42} />
          <Skeleton variant="rounded" height={42} />
        </Stack>

        {/* Liste des députés groupés */}
        <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{ mb: 1, flexWrap: "wrap" }}
          >
            <Skeleton variant="rounded" width={220} height={36} />
            <Skeleton variant="rounded" width={140} height={36} />
          </Stack>
          <GroupAccordionSkeleton deputeCount={8} />
          <GroupAccordionSkeleton deputeCount={6} />
          <GroupAccordionSkeleton deputeCount={4} />
        </Stack>
      </Container>
    </>
  );
}
