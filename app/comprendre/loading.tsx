import * as React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";

function EtapeCardSkeleton({ index }: { index: number }) {
  return (
    <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, position: "relative" }}>
      {/* Colonne gauche : pastille numérotée + ligne */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <Skeleton variant="circular" width={48} height={48} />
        <Box
          sx={{
            flex: 1,
            width: 2,
            bgcolor: "grey.200",
            mt: 1,
            mb: -1,
          }}
        />
      </Box>

      {/* Carte */}
      <Box
        sx={{
          flex: 1,
          bgcolor: "white",
          border: "1px solid",
          borderColor: "grey.200",
          borderRadius: "16px",
          p: { xs: 2, md: 3 },
          mb: 3,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Skeleton variant="rounded" width={120} height={22} />
          {index % 2 === 0 && <Skeleton variant="rounded" width={80} height={22} />}
        </Stack>
        <Skeleton variant="text" width="70%" sx={{ fontSize: "1.2rem", mb: 1 }} />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="85%" />
      </Box>
    </Box>
  );
}

export default function ComprendreLoading() {
  return (
    <>
      <TopLoadingBar />
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        {/* Hero */}
        <Stack
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          sx={{ mb: 6 }}
        >
          <Skeleton variant="text" width={120} sx={{ fontSize: "0.75rem" }} />
          <Skeleton variant="text" width="80%" sx={{ fontSize: "2.5rem" }} />
          <Skeleton variant="text" width="60%" sx={{ fontSize: "2.5rem" }} />
          <Stack spacing={0.5} sx={{ width: "100%", maxWidth: 620, mt: 1 }}>
            <Skeleton variant="text" />
            <Skeleton variant="text" />
            <Skeleton variant="text" width="80%" />
          </Stack>
        </Stack>

        {/* Frise verticale */}
        <Box>
          {Array.from({ length: 4 }).map((_, i) => (
            <EtapeCardSkeleton key={i} index={i} />
          ))}
        </Box>
      </Container>
    </>
  );
}
