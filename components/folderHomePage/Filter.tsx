"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { TYPES_DE_DOSSIERS } from "../const";
import { THEMES, isThemeSlug } from "@/data/themes";
import { THEME_ICONS } from "@/app/themes/themeIcons";
import { useQueryState } from "nuqs";

const BADGE_OPTIONS: { code: string; label: string }[] = [
  { code: "actif", label: "🔥 Actif" },
  { code: "en_cours", label: "En cours" },
  { code: "en_pause", label: "En pause" },
  { code: "promulgue", label: "Promulgué" },
  { code: "adopte", label: "Adopté" },
  { code: "rejete", label: "Rejeté" },
  { code: "retire", label: "Retiré" },
  { code: "caduc", label: "Caduc" },
];

export const Filter = () => {
  const [codeProcedure, setCodeProcedure] = useQueryState("codeProcedure");
  const [badge, setBadge] = useQueryState("badge");
  const [theme, setTheme] = useQueryState("theme");
  const [sort, setSort] = useQueryState("sort");

  return (
    <>
      <TextField
        select
        size="small"
        label="Trier par"
        value={sort ?? "popular"}
        onChange={(e) => setSort(e.target.value === "popular" ? null : e.target.value)}
        variant="outlined"
      >
        <MenuItem value="popular">Les plus discutés</MenuItem>
        <MenuItem value="recent">Activité récente</MenuItem>
      </TextField>

      <TextField
        select
        size="small"
        label="Statut"
        value={badge ?? ""}
        onChange={(e) => setBadge(e.target.value || null)}
        variant="outlined"
      >
        <MenuItem value="">Tous les statuts</MenuItem>
        {BADGE_OPTIONS.map((b) => (
          <MenuItem key={b.code} value={b.code}>
            {b.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Thème"
        value={theme ?? ""}
        onChange={(e) => setTheme(e.target.value || null)}
        variant="outlined"
        SelectProps={{
          renderValue: (value) => {
            const s = value as string;
            if (!s || !isThemeSlug(s)) return <>Tous les thèmes</>;
            const Icon = THEME_ICONS[s];
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {Icon && <Icon sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }} />}
                {THEMES[s].label}
              </Box>
            );
          },
        }}
      >
        <MenuItem value="">Tous les thèmes</MenuItem>
        {(Object.entries(THEMES) as [string, { label: string }][]).map(([slug, meta]) => {
          const Icon = isThemeSlug(slug) ? THEME_ICONS[slug] : null;
          return (
            <MenuItem key={slug} value={slug} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {Icon && <Icon sx={{ fontSize: 16, color: "primary.main", flexShrink: 0 }} />}
              {meta.label}
            </MenuItem>
          );
        })}
      </TextField>

      <TextField
        select
        size="small"
        label="Type de dossier"
        value={codeProcedure ?? ""}
        onChange={(e) => setCodeProcedure(e.target.value || null)}
        variant="outlined"
      >
        <MenuItem value="">Tous les types</MenuItem>
        {TYPES_DE_DOSSIERS.map((type) => (
          <MenuItem key={type.code} value={type.code}>
            {type.label}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
};
