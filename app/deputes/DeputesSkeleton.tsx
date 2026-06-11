"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

export default function DeputesSkeleton() {
  return (
    <>
      {/* Sidebar filtre */}
      <Stack spacing={2} flex={2}>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={120} />
      </Stack>

      {/* Liste */}
      <Stack spacing={1.5} flex={5}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={52} />
        ))}
      </Stack>
    </>
  );
}
