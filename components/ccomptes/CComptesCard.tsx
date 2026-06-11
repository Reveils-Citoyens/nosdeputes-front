"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import type { CCompteResult } from "@/data/mongo/getCComptesParTheme";

const CDC_COLOR = "#8B1A1A";
const CDC_BG = "#fdf6f6";
const MAX_DOCS_COLLAPSED = 3;

export function CComptesCard({ rapport }: { rapport: CCompteResult }) {
  const [expanded, setExpanded] = React.useState(false);

  const dateLabel = rapport.date
    ? new Date(rapport.date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const collapsedDocs = rapport.documents.slice(0, MAX_DOCS_COLLAPSED);
  const extraDocs = rapport.documents.length - MAX_DOCS_COLLAPSED;

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "#e8d5d5",
        bgcolor: CDC_BG,
        borderLeft: `4px solid ${CDC_COLOR}`,
        overflow: "hidden",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: "0 2px 10px rgba(139,26,26,0.1)" },
      }}
    >
      {/* En-tête cliquable */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 1,
          cursor: "pointer",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography
            variant="caption"
            sx={{
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: CDC_COLOR,
              fontSize: "0.65rem",
            }}
          >
            Cour des comptes
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            {dateLabel && (
              <Typography variant="caption" color="text.secondary">
                {dateLabel}
              </Typography>
            )}
            <ExpandMoreIcon
              sx={{
                fontSize: 18,
                color: "text.secondary",
                transition: "transform 0.2s",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </Stack>
        </Stack>

        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ lineHeight: 1.4, color: "text.primary" }}
        >
          {rapport.titre}
        </Typography>

        {/* Teaser — masqué quand déplié */}
        {!expanded && rapport.teaser && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {rapport.teaser}
          </Typography>
        )}

        {/* Documents (version réduite) — masqués quand déplié */}
        {!expanded && collapsedDocs.length > 0 && (
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {collapsedDocs.map((doc, i) => (
              <Typography
                key={i}
                component="a"
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                data-umami-event="lien-sortant"
                data-umami-event-source="ccomptes"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                variant="caption"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  color: "text.secondary",
                  textDecoration: "none",
                  width: "fit-content",
                  "&:hover": { color: CDC_COLOR, textDecoration: "underline" },
                }}
              >
                <PictureAsPdfIcon sx={{ fontSize: 12, flexShrink: 0 }} />
                {doc.type}
                <OpenInNewIcon sx={{ fontSize: 11, flexShrink: 0, opacity: 0.6 }} />
              </Typography>
            ))}
            {extraDocs > 0 && (
              <Typography variant="caption" color="text.disabled" sx={{ pl: 0.25 }}>
                + {extraDocs} document{extraDocs > 1 ? "s" : ""} supplémentaire{extraDocs > 1 ? "s" : ""}
              </Typography>
            )}
          </Stack>
        )}
      </Box>

      {/* Contenu déplié */}
      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ px: 2.5, pb: 2.5 }}>
          {rapport.content.length > 0 && (
            <Stack spacing={1.5} sx={{ mb: rapport.documents.length > 0 ? 2.5 : 0 }}>
              {rapport.content.map((p, i) =>
                p.type === "paragraph" ? (
                  <Typography key={i} variant="body2" sx={{ lineHeight: 1.75, color: "text.primary" }}>
                    {p.content}
                  </Typography>
                ) : (
                  <Typography key={i} variant="body2" sx={{ lineHeight: 1.5, color: "text.primary", fontWeight: "bold", mt: i > 0 ? 0.5 : 0 }}>
                    {p.content}
                  </Typography>
                )
              )}
            </Stack>
          )}

          {rapport.documents.length > 0 && (
            <>
              {rapport.content.length > 0 && <Divider sx={{ mb: 2 }} />}
              <Typography
                variant="overline"
                sx={{ display: "block", mb: 1, fontSize: "0.6rem", letterSpacing: "0.08em", color: "text.secondary" }}
              >
                Documents associés
              </Typography>
              <Stack spacing={0.75}>
                {rapport.documents.map((doc, i) => (
                  <Typography
                    key={i}
                    component="a"
                    href={doc.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-umami-event="lien-sortant"
                    data-umami-event-source="ccomptes"
                    variant="caption"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "text.secondary",
                      textDecoration: "none",
                      width: "fit-content",
                      "&:hover": { color: CDC_COLOR, textDecoration: "underline" },
                    }}
                  >
                    <PictureAsPdfIcon sx={{ fontSize: 12, flexShrink: 0 }} />
                    {doc.type}
                    <OpenInNewIcon sx={{ fontSize: 11, flexShrink: 0, opacity: 0.6 }} />
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
