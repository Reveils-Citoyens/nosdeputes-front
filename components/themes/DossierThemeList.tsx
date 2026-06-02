"use client";

import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DossierBadge from "@/components/folders/DossierBadge";
import { ThemeIcon } from "@/app/themes/themeIcons";
import { THEMES, isThemeSlug } from "@/data/themes";
import type { ThemeDossierResult } from "@/data/mongo/getDossiersByTheme";

type Props = {
  initialItems: ThemeDossierResult[];
  total: number;
  slug?: string;
  groupId?: string;
};

function formatDate(d: Date | string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DossierRow({ d, showThemeIcon }: { d: ThemeDossierResult; showThemeIcon: boolean }) {
  const firstTheme = showThemeIcon
    ? (d.themes.find((t) => isThemeSlug(t)) as keyof typeof THEMES | undefined)
    : undefined;
  const dateLabel = formatDate(d.date_dernier_acte);

  return (
    <Link
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
            {dateLabel && (
              <Typography variant="caption" color="text.secondary">
                {firstTheme ? "· " : ""}{dateLabel}
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
}

export default function DossierThemeList({ initialItems, total, slug, groupId }: Props) {
  const [items, setItems] = React.useState<ThemeDossierResult[]>(initialItems);
  const [loading, setLoading] = React.useState(false);
  const showThemeIcon = !!groupId;
  const hasMore = items.length < total;

  const loadMore = async () => {
    setLoading(true);
    const params = new URLSearchParams({ skip: String(items.length), limit: "10" });
    if (slug) params.set("slug", slug);
    if (groupId) params.set("groupId", groupId);
    try {
      const res = await fetch(`/api/themes/dossiers?${params}`);
      const { items: more } = await res.json();
      setItems((prev) => [...prev, ...more]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack spacing={1.5}>
        {items.map((d) => (
          <DossierRow key={d.uid} d={d} showThemeIcon={showThemeIcon} />
        ))}
      </Stack>

      {hasMore && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: "30px",
              textTransform: "none",
              px: 3,
              borderColor: "grey.400",
              color: "text.secondary",
              "&:hover": { borderColor: "primary.main", color: "primary.main" },
            }}
          >
            {loading ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : null}
            {loading
              ? "Chargement…"
              : `Charger plus (${total - items.length} restants)`}
          </Button>
        </Box>
      )}
    </>
  );
}
