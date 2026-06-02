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
import { THEMES } from "@/data/themes";
import {
  THEME_GROUPS,
  isThemeGroupSlug,
  type ThemeGroupSlug,
} from "@/data/themeGroups";
import { getDossiersByThemeGroup } from "@/data/mongo/getDossiersByThemeGroup";
import DossierBadge from "@/components/folders/DossierBadge";
import AiDisclaimer from "@/components/AiDisclaimer";
import { ThemeGroupIcon, ThemeIcon } from "../../themeIcons";
import type { Metadata } from "next";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (Object.keys(THEME_GROUPS) as ThemeGroupSlug[]).map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!isThemeGroupSlug(id)) return {};
  const group = THEME_GROUPS[id];
  return {
    title: `${group.label} — Thèmes — Nos Députés`,
    description: group.description,
  };
}

export default async function ThemeGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isThemeGroupSlug(id)) notFound();

  const group = THEME_GROUPS[id];
  const { items, total } = await getDossiersByThemeGroup(id, { limit: 30 });

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Retour */}
      <Box sx={{ mb: 4 }}>
        <Link href="/themes" style={{ textDecoration: "none" }}>
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
            <Typography variant="body2">Tous les thèmes</Typography>
          </Stack>
        </Link>
      </Box>

      {/* Hero */}
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: "bold", letterSpacing: "0.15em", color: "grey.600" }}
        >
          Grand domaine
        </Typography>
        <Stack direction="row" alignItems="center" spacing={2}>
          <ThemeGroupIcon slug={id} size={28} boxSize={56} />
          <Typography
            component="h1"
            sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" }, fontWeight: "bold", lineHeight: 1.2 }}
          >
            {group.label}
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 580, lineHeight: 1.6 }}>
          {group.description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {total} dossier{total > 1 ? "s" : ""} répertorié{total > 1 ? "s" : ""}
        </Typography>
        <AiDisclaimer variant="banner" />
      </Stack>

      {/* Thèmes regroupés */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: "bold", letterSpacing: "0.08em", color: "text.secondary", display: "block", mb: 1.5 }}
        >
          Thèmes inclus
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {group.themes.map((t) => (
            <Chip
              key={t}
              component={Link}
              href={`/themes/${t}`}
              clickable
              label={THEMES[t].label}
              size="small"
              variant="outlined"
              sx={{
                borderColor: "grey.300",
                color: "text.secondary",
                "&:hover": { borderColor: "primary.main", color: "primary.main" },
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Liste dossiers */}
      <Stack spacing={1.5}>
        {items.map((d) => {
          const firstTheme = d.themes.find((t) => t in THEMES) as
            | keyof typeof THEMES
            | undefined;
          return (
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
                {firstTheme && <ThemeIcon slug={firstTheme} size={20} boxSize={40} />}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }} flexWrap="wrap">
                    <Chip
                      label={d.type_initiative}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.68rem", height: 22, borderColor: "grey.300", color: "text.secondary" }}
                    />
                    {firstTheme && (
                      <Typography variant="caption" color="text.secondary">
                        {THEMES[firstTheme].label}
                      </Typography>
                    )}
                    {d.date_dernier_acte && (
                      <Typography variant="caption" color="text.secondary">
                        ·{" "}
                        {new Date(d.date_dernier_acte).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </Typography>
                    )}
                    <DossierBadge badge={d.dossierBadge} />
                  </Stack>

                  <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.4, mb: 0.75 }}>
                    {d.titre}
                  </Typography>

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
          );
        })}
      </Stack>

      {total > 30 && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center", mt: 4 }}
        >
          {total - 30} dossier{total - 30 > 1 ? "s" : ""} supplémentaire
          {total - 30 > 1 ? "s" : ""} non affichés.
        </Typography>
      )}
    </Container>
  );
}
