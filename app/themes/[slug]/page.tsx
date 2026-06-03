import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Box,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { THEMES, ThemeSlug, isThemeSlug } from "@/data/themes";
import { THEME_GROUPS, THEME_TO_GROUP } from "@/data/themeGroups";
import { getDossiersByTheme } from "@/data/mongo/getDossiersByTheme";
import { CComptesSection } from "@/components/ccomptes/CComptesSection";
import DossierThemeList from "@/components/themes/DossierThemeList";
import { ThemeIcon } from "../themeIcons";
import AlerteButton from "@/components/AlerteButton";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (Object.keys(THEMES) as ThemeSlug[]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isThemeSlug(slug)) return {};
  const theme = THEMES[slug];
  return {
    title: `${theme.label} — Thèmes — Nos Députés`,
    description: theme.description,
  };
}

export default async function ThemeSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isThemeSlug(slug)) notFound();

  const theme = THEMES[slug];
  const groupSlug = THEME_TO_GROUP[slug];
  const groupLabel = THEME_GROUPS[groupSlug].label;
  const { items, total } = await getDossiersByTheme(slug, { limit: 10 });

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Retour */}
      <Box sx={{ mb: 4 }}>
        <Link href={`/themes/domaine/${groupSlug}`} style={{ textDecoration: "none" }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{
              color: "text.secondary",
              fontSize: "0.85rem",
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">{groupLabel}</Typography>
          </Stack>
        </Link>
      </Box>

      {/* Hero */}
      <Stack spacing={1.5} sx={{ mb: 5 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: "bold", letterSpacing: "0.15em", color: "grey.600" }}
        >
          Thème
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <ThemeIcon slug={slug} size={28} boxSize={56} />
          <Typography
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" }, fontWeight: "bold", lineHeight: 1.2 }}
          >
            {theme.label}
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 580, lineHeight: 1.6 }}>
          {theme.description}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {total} dossier{total > 1 ? "s" : ""} répertorié{total > 1 ? "s" : ""}
          </Typography>
          <AlerteButton
            subjectType="theme"
            subjectUid={slug}
            subjectLabel={theme.label}
            variant="button"
          />
        </Stack>
      </Stack>

      <DossierThemeList initialItems={items} total={total} slug={slug} />

      <CComptesSection themes={slug} />
    </Container>
  );
}
