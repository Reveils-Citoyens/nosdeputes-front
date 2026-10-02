import * as React from "react";
import Link from "@/components/navigation/NavigationLink";
import { Box, Chip, Stack, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import type { DebatSearchResult } from "@/data/searchInterventions";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function truncate(s: string, n = 240): string {
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

const lienSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 0.5,
  color: "primary.main",
  fontWeight: 600,
  textDecoration: "none",
  "&:hover": { textDecoration: "underline" },
} as const;

export default function SearchDebatCard({ debat }: { debat: DebatSearchResult }) {
  const date = formatDate(debat.dateSeance);
  const typeLabel =
    debat.type === "seance" ? "Séance" : debat.type === "commission" ? "Commission" : null;

  return (
    <Box sx={{ p: 1.5, borderRadius: "10px" }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 0.5 }}>
        {debat.orateur &&
          (debat.deputeSlug ? (
            <Typography
              component={Link}
              href={`/depute/${debat.deputeSlug}`}
              variant="body2"
              fontWeight="bold"
              sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              {debat.orateur}
            </Typography>
          ) : (
            <Typography variant="body2" fontWeight="bold">
              {debat.orateur}
            </Typography>
          ))}
        {typeLabel && (
          <Chip
            label={typeLabel}
            size="small"
            variant="outlined"
            sx={{ fontSize: "0.62rem", height: 18, borderColor: "grey.300", color: "text.secondary", "& .MuiChip-label": { px: 0.8 } }}
          />
        )}
        {date && (
          <Typography variant="caption" color="text.secondary">
            {date}
          </Typography>
        )}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, fontStyle: "italic" }}>
        « {truncate(debat.texte)} »
      </Typography>

      {(debat.dossierHref || debat.href) && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.5, sm: 2 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ mt: 0.75, minWidth: 0 }}
        >
          {debat.dossierHref && debat.dossierTitre && (
            <Typography
              component={Link}
              href={debat.dossierHref}
              title={debat.dossierTitre}
              data-umami-event="dossier-ouvert"
              data-umami-event-source="recherche-debats"
              variant="caption"
              sx={{ ...lienSx, minWidth: 0, maxWidth: "100%" }}
            >
              <FolderOutlinedIcon sx={{ fontSize: 15, flexShrink: 0 }} />
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {debat.dossierTitre}
              </Box>
            </Typography>
          )}
          {debat.href && (
            <Typography
              component={Link}
              href={debat.href}
              data-umami-event="compte-rendu-ouvert"
              data-umami-event-source="recherche"
              variant="caption"
              sx={{ ...lienSx, flexShrink: 0 }}
            >
              <DescriptionOutlinedIcon sx={{ fontSize: 15 }} />
              Lire le compte rendu
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}
