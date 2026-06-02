import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { getCCompteById } from "@/data/mongo/getCCompteById";
import { THEMES, isThemeSlug } from "@/data/themes";
import Chip from "@mui/material/Chip";
import type { Metadata } from "next";

const CDC_COLOR = "#8B1A1A";
const CDC_BG = "#fdf6f6";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const rapport = await getCCompteById(id);
  if (!rapport) return {};
  return {
    title: `${rapport.titre} — Cour des comptes — Nos Députés`,
    description: rapport.teaser?.slice(0, 160),
  };
}

export default async function CComptePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rapport = await getCCompteById(id);
  if (!rapport) notFound();

  const dateLabel = rapport.date
    ? new Date(rapport.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const themesSlugs = rapport.themes.filter(isThemeSlug);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Retour */}
      <Box sx={{ mb: 4 }}>
        <Link href="/themes" style={{ textDecoration: "none" }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ color: "text.secondary", fontSize: "0.85rem", "&:hover": { color: "primary.main" } }}
          >
            <ArrowBackIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2">Thèmes</Typography>
          </Stack>
        </Link>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          bgcolor: CDC_BG,
          border: "1px solid #e8d5d5",
          borderLeft: `4px solid ${CDC_COLOR}`,
          borderRadius: "12px",
          p: { xs: 2.5, md: 3.5 },
          mb: 4,
        }}
      >
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: CDC_COLOR,
                fontSize: "0.65rem",
              }}
            >
              Cour des comptes
            </Typography>
            {dateLabel && (
              <Typography variant="caption" color="text.secondary">
                Publié le {dateLabel}
              </Typography>
            )}
          </Stack>

          <Typography
            component="h1"
            sx={{ fontSize: { xs: "1.4rem", md: "1.9rem" }, fontWeight: "bold", lineHeight: 1.25 }}
          >
            {rapport.titre}
          </Typography>

          {themesSlugs.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {themesSlugs.map((t) => (
                <Chip
                  key={t}
                  label={THEMES[t].label}
                  size="small"
                  component={Link}
                  href={`/themes/${t}`}
                  clickable
                  variant="outlined"
                  sx={{
                    fontSize: "0.68rem",
                    height: 22,
                    borderColor: "#e8d5d5",
                    color: CDC_COLOR,
                    "&:hover": { borderColor: CDC_COLOR },
                  }}
                />
              ))}
            </Stack>
          )}

          {/* Lien externe */}
          <Typography
            component="a"
            href={rapport.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              color: CDC_COLOR,
              fontWeight: 600,
              textDecoration: "none",
              width: "fit-content",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Voir sur ccomptes.fr <OpenInNewIcon sx={{ fontSize: 14 }} />
          </Typography>
        </Stack>
      </Box>

      {/* Contenu */}
      {rapport.content.length > 0 && (
        <Stack spacing={2} sx={{ mb: 5 }}>
          {rapport.content.map((p, i) => (
            <Typography
              key={i}
              variant="body1"
              sx={{ lineHeight: 1.75, color: "text.primary" }}
            >
              {p.content}
            </Typography>
          ))}
        </Stack>
      )}

      {/* Documents */}
      {rapport.documents.length > 0 && (
        <>
          <Divider sx={{ mb: 3 }} />
          <Box>
            <Typography
              variant="overline"
              sx={{
                fontWeight: "bold",
                letterSpacing: "0.08em",
                color: "text.secondary",
                display: "block",
                mb: 2,
              }}
            >
              Documents associés
            </Typography>
            <Stack spacing={1}>
              {rapport.documents.map((doc, i) => (
                <Typography
                  key={i}
                  component="a"
                  href={doc.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    color: "text.primary",
                    textDecoration: "none",
                    p: 1.5,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: "grey.200",
                    transition: "border-color 0.15s",
                    "&:hover": { borderColor: CDC_COLOR, color: CDC_COLOR },
                  }}
                >
                  <PictureAsPdfIcon sx={{ fontSize: 16, color: CDC_COLOR, flexShrink: 0 }} />
                  <Box component="span" sx={{ flex: 1 }}>{doc.type}</Box>
                  <OpenInNewIcon sx={{ fontSize: 13, opacity: 0.5, flexShrink: 0 }} />
                </Typography>
              ))}
            </Stack>
          </Box>
        </>
      )}
    </Container>
  );
}
