import React from "react";
import { Box, Container, Skeleton, Stack } from "@mui/material";
import LiseuseSkeleton from "./LiseuseSkeleton";
import DebatePageSkeleton from "@/app/[legislature]/dossier/[id]/debat/DebatePageSkeleton";
import SkeletonStatus from "./SkeletonStatus";

export function DossierPreviewSkeleton({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <SkeletonStatus label="Chargement de l’aperçu du dossier">
      <div className="container">
        {!fullWidth && (
          <Stack spacing={3} sx={{ flex: 2, minWidth: 0 }}>
            {[0, 1, 2].map(index => (
              <Box key={index} sx={{ bgcolor: "grey.100", p: 3, borderRadius: "16px" }}>
                <Skeleton width="75%" height={32} sx={{ mb: 2 }} />
                <Skeleton width="90%" /><Skeleton width="65%" /><Skeleton width="80%" />
              </Box>
            ))}
          </Stack>
        )}
        <Stack spacing={3} sx={{ flex: 5, minWidth: 0 }}>
          <Box sx={{ bgcolor: "grey.100", p: 3, borderRadius: "16px" }}>
            <Skeleton width="55%" height={32} /><Skeleton width="95%" /><Skeleton width="85%" /><Skeleton width="90%" />
          </Box>
          <Box sx={{ p: 3, border: 1, borderColor: "grey.200", borderRadius: "16px" }}>
            <Skeleton width="45%" height={36} sx={{ mb: 2 }} />
            {[0, 1, 2, 3, 4].map(index => (
              <Stack key={index} direction="row" spacing={2} sx={{ py: 2 }}>
                <Skeleton variant="circular" width={24} height={24} sx={{ flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}><Skeleton width={120} height={20} /><Skeleton width="90%" height={32} /><Skeleton width="65%" /></Box>
              </Stack>
            ))}
          </Box>
        </Stack>
      </div>
    </SkeletonStatus>
  );
}

export function DossierVotesSkeleton() {
  return (
    <SkeletonStatus label="Chargement des votes du dossier">
      <Container sx={{ mt: 3, pb: 8 }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2} sx={{ my: 3 }}>
          <Skeleton variant="rounded" height={40} width={300} sx={{ maxWidth: "100%" }} />
          <Stack direction="row" spacing={1}><Skeleton variant="rounded" width={80} height={32} /><Skeleton variant="rounded" width={80} height={32} /></Stack>
        </Stack>
        <Stack spacing={3} sx={{ mt: 3 }}>
          {[0, 1, 2].map(index => (
            <Box key={index} sx={{ border: 1, borderColor: "divider", borderRadius: "16px", px: 3, py: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Skeleton width="35%" height={20} /><Skeleton variant="rounded" width={90} height={24} />
              </Stack>
              <Skeleton width="85%" height={28} /><Skeleton width="65%" height={28} />
              <Skeleton width={150} height={20} sx={{ mt: 2 }} />
              <Skeleton variant="rounded" height={8} sx={{ my: 1 }} />
              <Stack direction="row" spacing={3}><Skeleton width={80} /><Skeleton width={80} /><Skeleton width={100} /></Stack>
            </Box>
          ))}
        </Stack>
      </Container>
    </SkeletonStatus>
  );
}

export function DossierDebateSkeleton({ segment }: { segment: "commission" | "debat" | "comptes-rendus" }) {
  const label = { commission: "des réunions en commission", debat: "des débats en séance", "comptes-rendus": "des comptes rendus" }[segment];
  return (
    <SkeletonStatus label={`Chargement ${label}`}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", py: 2 }}>
        <Container>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Skeleton variant="rounded" height={40} sx={{ flex: 1 }} />
            <Stack direction="row" spacing={2} sx={{ display: { xs: "none", md: "flex" } }}>
              <Skeleton variant="circular" width={32} height={32} /><Skeleton variant="circular" width={32} height={32} />
            </Stack>
          </Stack>
        </Container>
      </Box>
      <div className="container">
        {segment === "debat" && (
          <Box sx={{ flex: 2, minWidth: 0 }}>
            <Skeleton width="65%" height={32} />
            {[0, 1, 2, 3, 4, 5].map(index => <Skeleton key={index} width={index % 2 ? "90%" : "75%"} height={40} />)}
          </Box>
        )}
        <Box sx={{ flex: 5, minWidth: 0, width: "100%", maxWidth: segment === "debat" ? "none" : 750, mx: "auto" }}>
          <DebatePageSkeleton fullWidth={segment === "debat"} />
        </Box>
      </div>
    </SkeletonStatus>
  );
}

export default function DossierTabSkeleton({ segment, previewFullWidth = false }: { segment: string; previewFullWidth?: boolean }) {
  switch (segment) {
    case "amendement": return <LiseuseSkeleton />;
    case "votes": return <DossierVotesSkeleton />;
    case "commission": case "debat": case "comptes-rendus": return <DossierDebateSkeleton segment={segment} />;
    default: return <DossierPreviewSkeleton fullWidth={previewFullWidth} />;
  }
}
