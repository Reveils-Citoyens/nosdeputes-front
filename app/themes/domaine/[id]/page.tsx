import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Box,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { THEMES, isThemeSlug } from "@/data/themes";
import {
  THEME_GROUPS,
  isThemeGroupSlug,
  type ThemeGroupSlug,
} from "@/data/themeGroups";
import { getDossiersByThemeGroup } from "@/data/mongo/getDossiersByThemeGroup";
import { CComptesSection } from "@/components/ccomptes/CComptesSection";
import DossierThemeList from "@/components/themes/DossierThemeList";
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
  const { items, total } = await getDossiersByThemeGroup(id, { limit: 10 });

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
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {group.description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {total} dossier{total > 1 ? "s" : ""} répertorié{total > 1 ? "s" : ""}
        </Typography>
      </Stack>

      {/* Thèmes regroupés */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="overline"
          sx={{ fontWeight: "bold", letterSpacing: "0.08em", color: "text.secondary", display: "block", mb: 1.5 }}
        >
          Thèmes inclus
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
            gap: 1.5,
          }}
        >
          {group.themes.map((t) => {
            const slug = isThemeSlug(t) ? t : null;
            return (
              <Link key={t} href={`/themes/${t}`} style={{ textDecoration: "none" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: "10px",
                    border: "1px solid",
                    borderColor: "grey.300",
                    bgcolor: "background.paper",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    "&:hover": {
                      borderColor: "primary.main",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    },
                  }}
                >
                  {slug && (
                    <ThemeIcon slug={slug} size={18} boxSize={36} sx={{ borderRadius: "8px", flexShrink: 0 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: "text.primary", lineHeight: 1.3 }}
                  >
                    {THEMES[t].label}
                  </Typography>
                  <ChevronRightIcon sx={{ fontSize: 16, color: "grey.400", ml: "auto", flexShrink: 0 }} />
                </Box>
              </Link>
            );
          })}
        </Box>
      </Box>

      {/* Liste dossiers */}
      <DossierThemeList initialItems={items} total={total} groupId={id} />

      <CComptesSection themes={group.themes} />
    </Container>
  );
}
