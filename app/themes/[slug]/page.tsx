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
import DossierBadge from "@/components/folders/DossierBadge";
import AiDisclaimer from "@/components/AiDisclaimer";
import { ThemeIcon } from "../themeIcons";
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
  const { items, total } = await getDossiersByTheme(slug, { limit: 30 });

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
        <Typography variant="body2" color="text.secondary">
          {total} dossier{total > 1 ? "s" : ""} répertorié{total > 1 ? "s" : ""}
        </Typography>
        <AiDisclaimer variant="banner" />
      </Stack>

      {/* Liste */}
      <Stack spacing={1.5}>
        {items.map((d) => (
          <Link
            key={d.uid}
            href={`/${d.legislature}/dossier/${d.uid}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Box
              sx={{
                p: 2.5,
                borderRadius: "12px",
                border: "1px solid",
                borderColor: "grey.200",
                bgcolor: "background.paper",
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                transition: "border-color 0.15s, box-shadow 0.15s",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                },
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Type + date */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }} flexWrap="wrap">
                  <Chip
                    label={d.type_initiative}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.68rem", height: 22, borderColor: "grey.300", color: "text.secondary" }}
                  />
                  {d.date_dernier_acte && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(d.date_dernier_acte).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Typography>
                  )}
                  <DossierBadge badge={d.dossierBadge} />
                </Stack>

                {/* Titre */}
                <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.4, mb: 0.75 }}>
                  {d.titre}
                </Typography>

                {/* TL;DR */}
                {d.tldr && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      lineHeight: 1.5,
                    }}
                  >
                    {d.tldr}
                  </Typography>
                )}
              </Box>

              <ChevronRightIcon sx={{ color: "grey.400", fontSize: 20, flexShrink: 0, mt: 0.25 }} />
            </Box>
          </Link>
        ))}
      </Stack>

      {total > 30 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", mt: 4 }}
        >
          {total - 30} dossier{total - 30 > 1 ? "s" : ""} supplémentaire{total - 30 > 1 ? "s" : ""} non affichés.
        </Typography>
      )}
    </Container>
  );
}
