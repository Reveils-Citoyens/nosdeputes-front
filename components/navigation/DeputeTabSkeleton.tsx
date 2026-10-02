import React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import SkeletonStatus from "./SkeletonStatus";

function TitleRow() {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 1 }}>
      <Skeleton width="45%" height={32} />
      <Skeleton variant="rounded" width={180} height={36} sx={{ flexShrink: 0, maxWidth: "40%", borderRadius: 5 }} />
    </Stack>
  );
}

function Filters({ variant }: { variant: "votes" | "amendements" | "qag" }) {
  return (
    <Stack direction={{ xs: "column", [variant === "votes" ? "md" : "sm"]: "row" }} spacing={2} sx={{ mb: variant === "votes" ? 4 : variant === "qag" ? 2 : 3 }}>
      <Skeleton variant="rounded" height={40} sx={{ flex: 1, minWidth: 0, borderRadius: 5 }} />
      {variant !== "qag" && (
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rounded" height={40} width={variant === "votes" ? 160 : 220} sx={{ maxWidth: "100%", borderRadius: variant === "votes" ? 1 : 5 }} />
          {variant === "votes" && <Skeleton variant="rounded" width={110} height={40} />}
        </Stack>
      )}
    </Stack>
  );
}

function PaginationPlaceholder() {
  return <Stack direction="row" justifyContent="center" spacing={1} sx={{ my: 2 }}>
    {[0, 1, 2, 3, 4].map(index => <Skeleton key={index} variant="circular" width={32} height={32} />)}
  </Stack>;
}

export function DeputeActivitySkeleton() {
  return (
    <SkeletonStatus label="Chargement de l’activité du député">
      <Box sx={{ mt: 1 }}>
        <TitleRow />
        {[0, 1].map(index => (
          <Box key={index} sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
              <Skeleton width={140} /><Skeleton width={110} /><Skeleton width={120} />
            </Stack>
            <Skeleton variant="rounded" height={168} />
          </Box>
        ))}
        <Box sx={{ mt: 5 }}>
          <TitleRow />
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, mt: 2 }}>
            {[0, 1, 2, 3, 4, 5].map(index => (
              <Box key={index} sx={{ bgcolor: "grey.100", borderRadius: 2, p: 2 }}>
                <Skeleton width="40%" height={64} /><Skeleton width="85%" />
                <Skeleton variant="rounded" height={64} sx={{ my: 1 }} /><Skeleton width="75%" />
              </Box>
            ))}
          </Box>
        </Box>
        <Skeleton width="65%" height={36} sx={{ mt: 4, mb: 2 }} />
        {[0, 1, 2].map(index => <Skeleton key={index} variant="rounded" height={100} sx={{ mb: 2 }} />)}
      </Box>
    </SkeletonStatus>
  );
}

export function DeputeTravauxSkeleton({ contentOnly = false }: { contentOnly?: boolean }) {
  const sections = (
    <Stack spacing={3}>
      {[0, 1, 2, 3].map(index => (
        <Box key={index} sx={{ border: 1, borderColor: "grey.200", borderRadius: "16px", p: { xs: 2, md: 3 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Skeleton variant="rounded" width={24} height={24} />
            <Skeleton width="45%" height={32} /><Skeleton variant="rounded" width={26} height={22} />
          </Stack>
          {[0, 1, 2].map(row => (
            <Stack key={row} direction="row" justifyContent="space-between" spacing={2} sx={{ p: 1.25 }}>
              <Skeleton width="75%" height={24} /><Skeleton width={70} height={24} />
            </Stack>
          ))}
        </Box>
      ))}
    </Stack>
  );
  return (
    <SkeletonStatus label="Chargement des travaux législatifs du député">
      {contentOnly ? sections : (
        <Container sx={{ pt: 3, pb: 6 }}>
          <Stack spacing={0.5} sx={{ mb: 3 }}>
            <Skeleton width={190} height={24} /><Skeleton width="65%" height={44} />
          </Stack>
          {sections}
        </Container>
      )}
    </SkeletonStatus>
  );
}

export function DeputeListSkeleton({ variant, showFilters = true }: {
  variant: "votes" | "amendements" | "qag";
  showFilters?: boolean;
}) {
  const label = { votes: "votes", amendements: "amendements", qag: "questions" }[variant];
  return (
    <SkeletonStatus label={`Chargement des ${label} du député`}>
      {showFilters && <Filters variant={variant} />}
      {variant === "qag" && <PaginationPlaceholder />}
      <Stack spacing={variant === "qag" ? 0 : 2}>
        {[0, 1, 2, 3].map(index => variant === "votes" ? (
          <Box key={index} sx={{ border: 1, borderColor: "grey.200", borderRadius: 2, p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Skeleton width="45%" height={24} /><Skeleton variant="rounded" width={90} height={24} />
            </Stack>
            <Skeleton width="90%" height={28} /><Skeleton width="65%" height={28} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={3} sx={{ mt: 2 }}>
              <Skeleton variant="rounded" width={160} height={40} sx={{ maxWidth: "100%" }} />
              <Box sx={{ flex: 1 }}><Skeleton width="50%" /><Skeleton variant="rounded" height={8} /><Skeleton width="80%" /></Box>
            </Stack>
          </Box>
        ) : (
          <Stack key={index} direction="row" alignItems="center" spacing={2} sx={{ minHeight: 64, px: 2, borderBottom: 1, borderColor: "divider" }}>
            <Box sx={{ flex: 1, minWidth: 0 }}><Skeleton width="90%" height={24} /><Skeleton width="65%" height={24} /></Box>
            <Skeleton variant="rounded" width={75} height={24} /><Skeleton variant="circular" width={18} height={18} />
          </Stack>
        ))}
      </Stack>
      {variant !== "qag" && <PaginationPlaceholder />}
    </SkeletonStatus>
  );
}

export function DeputeDetailSkeleton() {
  return (
    <SkeletonStatus label="Chargement du détail quotidien du député">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton width="65%" height={40} /><Skeleton width="95%" sx={{ mt: 1, mb: 3 }} />
        <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Skeleton width="45%" /><Skeleton variant="rounded" width={200} height={36} />
        </Stack>
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 640 }}>
            {Array.from({ length: 9 }, (_, index) => (
              <Box key={index} sx={{ display: "grid", gridTemplateColumns: "2fr repeat(6, 1fr)", gap: 2, py: 1, borderBottom: 1, borderColor: "divider" }}>
                {Array.from({ length: 7 }, (_, column) => <Skeleton key={column} height={24} width={column === 0 ? "80%" : "65%"} />)}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </SkeletonStatus>
  );
}

export default function DeputeTabSkeleton({ segment }: { segment: string }) {
  switch (segment) {
    case "travaux": return <DeputeTravauxSkeleton />;
    case "votes": case "amendements": case "qag": return <DeputeListSkeleton variant={segment} />;
    case "activite": return <DeputeDetailSkeleton />;
    default: return <DeputeActivitySkeleton />;
  }
}
