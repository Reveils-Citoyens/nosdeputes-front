import * as React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import TopLoadingBar from "@/components/TopLoadingBar";

export default function DossierLoading() {
  return (
    <>
      <TopLoadingBar />

      {/* Hero */}
      <Box
        sx={{
          minHeight: "272px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          bgcolor: "grey.100",
        }}
      >
        <Box
          sx={{
            py: 4,
            px: 3,
            width: "680px",
            maxWidth: "100%",
            borderRadius: 4,
            bgcolor: "white",
            mx: { xs: 2, md: 0 },
          }}
        >
          <Stack spacing={2} alignItems="center">
            <Skeleton variant="text" width={130} sx={{ fontSize: "0.9rem" }} />
            <Skeleton variant="text" width="80%" sx={{ fontSize: "1.5rem" }} />
            <Skeleton variant="text" width="60%" sx={{ fontSize: "1.5rem" }} />
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Skeleton variant="rounded" width={90} height={24} />
              <Skeleton variant="rounded" width={70} height={24} />
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Tabs + content */}
      <Container
        maxWidth="lg"
        sx={{ pt: 3, display: "flex", flexDirection: "column", gap: 3 }}
      >
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {Array.from({ length: 5 }).map((_, i) => (
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
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="text" width={`${75 + ((i * 7) % 20)}%`} />
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            p: 3,
            bgcolor: "white",
            border: "1px solid",
            borderColor: "grey.200",
            borderRadius: "12px",
          }}
        >
          <Skeleton variant="text" width="35%" sx={{ fontSize: "1.2rem", mb: 2 }} />
          <Stack spacing={2}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Stack key={i} direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={36} height={36} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="40%" sx={{ fontSize: "0.75rem" }} />
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Container>
    </>
  );
}
