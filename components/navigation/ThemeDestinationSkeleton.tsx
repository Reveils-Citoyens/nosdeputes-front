import React from "react";
import { Box, Container, Skeleton, Stack, Typography } from "@mui/material";
import { THEMES, type ThemeSlug } from "@/data/themes";
import { THEME_GROUPS, type ThemeGroupSlug } from "@/data/themeGroups";
import SkeletonStatus from "./SkeletonStatus";
import TopLoadingBar from "@/components/TopLoadingBar";

/** Static labels/descriptions are available without waiting for Mongo counts. */
export default function ThemeDestinationSkeleton({ kind, slug }: { kind: "domain" | "theme"; slug?: string }) {
  const group = kind === "domain" && slug && Object.hasOwn(THEME_GROUPS, slug) ? THEME_GROUPS[slug as ThemeGroupSlug] : null;
  const theme = kind === "theme" && slug && Object.hasOwn(THEMES, slug) ? THEMES[slug as ThemeSlug] : null;
  const meta = group ?? theme;
  const label = `Chargement ${kind === "domain" ? "du domaine" : "du thème"}${meta ? ` ${meta.label}` : ""}`;
  return <SkeletonStatus label={label}>
    <TopLoadingBar />
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Skeleton width={150} height={24} sx={{ mb: 4 }} />
      <Stack spacing={1.5} sx={{ mb: kind === "domain" ? 4 : 5 }}>
        <Typography variant="overline" fontWeight="bold" color="text.secondary" sx={{ letterSpacing: "0.15em" }}>{kind === "domain" ? "Grand domaine" : "Thème"}</Typography>
        <Stack direction="row" spacing={2} alignItems="center" sx={kind === "theme" ? { height: { xs: 120, md: 168 }, px: { xs: 3, md: 5 }, borderRadius: "16px", background: "linear-gradient(135deg, #2A2A2E 0%, #161618 100%)" } : undefined}>
          <Skeleton variant="rounded" sx={{ width: kind === "theme" ? { xs: 44, md: 56 } : 56, height: kind === "theme" ? { xs: 44, md: 56 } : 56, flexShrink: 0, borderRadius: kind === "theme" ? "12px" : 2, ...(kind === "theme" && { bgcolor: "rgba(255,255,255,0.12)" }) }} />
          {meta ? <Typography component="h1" sx={{ fontSize: kind === "theme" ? { xs: "1.4rem", md: "2rem" } : { xs: "1.75rem", md: "2.5rem" }, fontWeight: "bold", lineHeight: 1.2, ...(kind === "theme" && { color: "#fff" }) }}>{meta.label}</Typography> : <Skeleton height={48} sx={{ flex: 1 }} />}
        </Stack>
        {meta ? <Typography variant="body1" color="text.secondary" sx={{ maxWidth: kind === "theme" ? 580 : "none", lineHeight: 1.6 }}>{meta.description}</Typography> : <Skeleton height={26} width="80%" />}
        <Stack direction="row" spacing={2}><Skeleton width={180} height={24} />{kind === "theme" && <Skeleton variant="rounded" width={110} height={32} />}</Stack>
      </Stack>
      {kind === "domain" && <Box sx={{ mb: 5 }}>
        <Typography variant="overline" fontWeight="bold" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>Thèmes inclus</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
          {group ? group.themes.map(themeSlug => <Box key={themeSlug} sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5, border: 1, borderColor: "grey.300", borderRadius: "10px", minWidth: 0 }}>
            <Skeleton variant="rounded" width={36} height={36} sx={{ flexShrink: 0 }} /><Typography variant="body2" sx={{ minWidth: 0, overflowWrap: "anywhere", lineHeight: 1.3 }}>{THEMES[themeSlug].label}</Typography>
          </Box>) : [0, 1, 2].map(index => <Skeleton key={index} variant="rounded" height={62} />)}
        </Box>
      </Box>}
      <Stack spacing={1.5}>
        {[0, 1, 2, 3].map(index => <Box key={index} sx={{ p: 2.5, border: 1, borderColor: "grey.200", borderRadius: "12px" }}>
          <Skeleton variant="rounded" width={120} height={22} sx={{ mb: 1.5 }} />
          <Skeleton height={26} width="85%" /><Skeleton height={26} width="70%" /><Skeleton height={20} width="95%" />
        </Box>)}
      </Stack>
    </Container>
  </SkeletonStatus>;
}
