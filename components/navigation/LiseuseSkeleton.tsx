import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";
import SkeletonStatus from "./SkeletonStatus";
import { liseusePageSx, liseuseToolbarSx, liseuseFiltersSx, liseusePanelSx, liseuseContentSx } from "./LiseuseLayout";

export function LiseuseFiltersSkeleton() {
  return <Box sx={liseuseFiltersSx} data-liseuse-filters aria-hidden="true">
    {[0, 1, 2, 3, 4, 5, 6, 7].map(index => <Skeleton key={index} variant="rounded" width={100} height={26} sx={{ borderRadius: 5 }} />)}
  </Box>;
}

export function ArticleTextSkeleton() {
  return (
    <SkeletonStatus label="Chargement du texte de l’article">
      <Stack spacing={2} sx={{ p: 2.5 }}>
        {[0, 1, 2, 3].map(index => (
          <Stack key={index} direction="row" spacing={1.5}>
            <Skeleton variant="circular" width={24} height={24} sx={{ flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}><Skeleton width="95%" /><Skeleton width="85%" /><Skeleton width="70%" /></Box>
          </Stack>
        ))}
      </Stack>
    </SkeletonStatus>
  );
}

export function LiseuseContentSkeleton() {
  return (
    <SkeletonStatus label="Chargement du texte et des amendements">
      <Box sx={liseuseContentSx} data-liseuse-content>
        <Box sx={{ width: 290, flexShrink: 0, display: { xs: "none", md: "block" } }}>
          <Skeleton width="65%" height={32} sx={{ mb: 1 }} />
          {[0, 1, 2, 3, 4, 5, 6].map(index => <Skeleton key={index} variant="rounded" height={44} sx={{ mb: 1, borderRadius: 1 }} />)}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ height: 52, mb: 2 }}>
            <Skeleton variant="circular" width={30} height={30} />
            <Box sx={{ flex: 1 }}><Skeleton width="55%" height={32} sx={{ mx: "auto" }} /><Skeleton width={60} sx={{ mx: "auto" }} /></Box>
            <Skeleton variant="circular" width={30} height={30} />
          </Stack>
          <Skeleton variant="rounded" height={40} sx={{ mb: 2, display: { xs: "block", md: "none" } }} />
          <Stack direction={{ xs: "column", md: "row" }} sx={{ border: 1, borderColor: "divider", borderRadius: "10px", overflow: "hidden" }}>
            <Box sx={{ ...liseusePanelSx, flex: { md: "0 0 44%" }, bgcolor: "grey.50", borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: "divider", minWidth: 0 }}>
              <Skeleton width="60%" height={38} sx={{ mx: 2 }} />
              <ArticleTextSkeleton />
            </Box>
            <Box sx={{ ...liseusePanelSx, flex: 1, minWidth: 0 }}>
              <Skeleton width="55%" height={38} sx={{ mx: 2 }} />
              {[0, 1, 2, 3].map(index => (
                <Stack key={index} direction="row" spacing={2} alignItems="center" sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider" }}>
                  <Box sx={{ flex: 1 }}><Skeleton width="85%" height={24} /><Skeleton width="60%" height={20} /></Box>
                  <Skeleton variant="rounded" width={70} height={24} />
                </Stack>
              ))}
            </Box>
          </Stack>
        </Box>
      </Box>
    </SkeletonStatus>
  );
}

export default function LiseuseSkeleton() {
  return (
    <Box sx={liseusePageSx} data-liseuse-page>
      <Box sx={liseuseToolbarSx} data-liseuse-toolbar>
        <Box><Skeleton width={210} height={28} /><Skeleton width={150} height={22} /></Box>
        <Box sx={{ width: { xs: "100%", sm: 360 }, flexShrink: 0 }}>
          <Skeleton variant="rounded" width="100%" height={52} /><Skeleton width={140} height={18} sx={{ ml: "auto", mt: 0.5 }} />
        </Box>
      </Box>
      <LiseuseFiltersSkeleton />
      <LiseuseContentSkeleton />
    </Box>
  );
}
