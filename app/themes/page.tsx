import * as React from "react";
import Link from "next/link";
import { Box, Container, Stack, Typography } from "@mui/material";
import { THEMES, type ThemeSlug } from "@/data/themes";
import {
  THEME_GROUPS,
  type ThemeGroupSlug,
} from "@/data/themeGroups";
import { getThemeCounts } from "@/data/mongo/getThemeCounts";
import { getThemeGroupCounts } from "@/data/mongo/getThemeGroupCounts";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { ThemeGroupIcon, ThemeIcon } from "./themeIcons";

export const metadata = {
  title: "Thèmes — Nos Députés",
  description:
    "Explorez les dossiers législatifs par grand domaine — économie, santé, écologie, justice, éducation et plus.",
};

export const revalidate = 3600;

export default async function ThemesPage() {
  const [themeCounts, groupCounts] = await Promise.all([
    getThemeCounts(),
    getThemeGroupCounts(),
  ]);

  const groups = (Object.entries(THEME_GROUPS) as [
    ThemeGroupSlug,
    (typeof THEME_GROUPS)[ThemeGroupSlug],
  ][])
    .map(([slug, meta]) => ({
      slug,
      ...meta,
      count: groupCounts[slug] ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Hero */}
      <Stack spacing={2} sx={{ mb: 6 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: "bold", letterSpacing: "0.15em", color: "grey.600" }}
        >
          Thèmes
        </Typography>
        <Typography
          component="h1"
          sx={{ fontSize: { xs: "1.75rem", md: "2.5rem" }, fontWeight: "bold", lineHeight: 1.2 }}
        >
          Explorer par grand domaine
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 580, lineHeight: 1.6 }}>
          Les 33 thèmes parlementaires sont regroupés en {groups.length} grands domaines
          calqués sur les portefeuilles ministériels.
        </Typography>
      </Stack>

      {/* Sections par domaine */}
      <Stack spacing={5}>
        {groups.map((group) => (
          <Box key={group.slug}>
            {/* En-tête de domaine — cliquable vers la page agrégée */}
            <Link
              href={`/themes/domaine/${group.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={2}
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                  "&:hover": { bgcolor: "grey.50" },
                  "&:hover .domain-arrow": { transform: "translateX(2px)", color: "primary.main" },
                }}
              >
                <ThemeGroupIcon slug={group.slug} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ fontWeight: "bold", lineHeight: 1.2, mb: 0.25 }}
                  >
                    {group.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {group.count} dossier{group.count > 1 ? "s" : ""} ·{" "}
                    {group.themes.length} thème{group.themes.length > 1 ? "s" : ""}
                  </Typography>
                </Box>
                <ArrowForwardIcon
                  className="domain-arrow"
                  sx={{
                    color: "grey.400",
                    fontSize: 20,
                    transition: "transform 0.15s, color 0.15s",
                  }}
                />
              </Stack>
            </Link>

            {/* Grille des thèmes du domaine */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
                ml: { xs: 0, sm: 4 },
              }}
            >
              {group.themes.map((slug) => {
                const meta = THEMES[slug as ThemeSlug];
                const count = themeCounts[slug as ThemeSlug] ?? 0;
                return (
                  <Link
                    key={slug}
                    href={`/themes/${slug}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: "grey.200",
                        bgcolor: "background.paper",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                        "&:hover": {
                          borderColor: "primary.main",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                        },
                      }}
                    >
                      <ThemeIcon slug={slug as ThemeSlug} size={18} boxSize={36} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                          {meta.label}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="primary.main"
                        sx={{ flexShrink: 0 }}
                      >
                        {count}
                      </Typography>
                      <ChevronRightIcon
                        sx={{ color: "grey.400", fontSize: 18, flexShrink: 0 }}
                      />
                    </Box>
                  </Link>
                );
              })}
            </Box>
          </Box>
        ))}
      </Stack>
    </Container>
  );
}
