"use client";

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Chip,
  Collapse,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ChangeCircleOutlinedIcon from "@mui/icons-material/ChangeCircleOutlined";
import BalanceOutlinedIcon from "@mui/icons-material/BalanceOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import AiDisclaimer from "@/components/AiDisclaimer";
import type { Enjeu, ActeurConcerne } from "@/data/mongo/getDossierEnrichment";

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>{icon}</Box>
      <Typography variant="overline" sx={{ fontWeight: "bold", letterSpacing: "0.08em", color: "text.secondary", lineHeight: 1 }}>
        {label}
      </Typography>
    </Stack>
  );
}

type Props = {
  tldr: string;
  themesOuverts: string[];
  pourquoi: string | null;
  ce_qui_change: string[];
  enjeux: Enjeu[];
  acteurs_concernes: ActeurConcerne[];
};

export function CollapsibleSummary({
  tldr,
  themesOuverts,
  pourquoi,
  ce_qui_change,
  enjeux,
  acteurs_concernes,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const hasDetails =
    pourquoi || ce_qui_change.length > 0 || enjeux.length > 0 || acteurs_concernes.length > 0;

  return (
    <>
      {/* En résumé — toujours visible */}
      <Box sx={{ bgcolor: "grey.50", p: 3, borderBottom: open ? "1px solid" : "none", borderColor: "grey.200" }}>
        <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.primary", fontStyle: "italic" }}>
          {tldr}
        </Typography>

        {themesOuverts.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 2 }}>
            {themesOuverts.map((theme) => (
              <Chip
                key={theme}
                label={theme}
                size="small"
                component={Link}
                href={`/recherche?q=${encodeURIComponent(theme)}`}
                clickable
                variant="outlined"
                sx={{
                  fontSize: "0.72rem",
                  height: 24,
                  borderColor: "grey.300",
                  color: "text.secondary",
                  "&:hover": { borderColor: "primary.main", color: "primary.main" },
                }}
              />
            ))}
          </Stack>
        )}

        {hasDetails && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            onClick={() => setOpen((v) => !v)}
            sx={{
              mt: 2,
              cursor: "pointer",
              width: "fit-content",
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {open ? "Masquer l'analyse" : "Voir l'analyse complète"}
            </Typography>
            <ExpandMoreIcon
              sx={{
                fontSize: 16,
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </Stack>
        )}
      </Box>

      {/* Détail collapsable */}
      <Collapse in={open}>
        <Box sx={{ p: 3 }}>
          <Stack spacing={3.5}>
            {pourquoi && (
              <Box>
                <SectionTitle icon={<HelpOutlineIcon sx={{ fontSize: 18 }} />} label="Pourquoi ce texte ?" />
                <Typography variant="body2" sx={{ lineHeight: 1.8, color: "text.secondary" }}>
                  {pourquoi}
                </Typography>
              </Box>
            )}

            {pourquoi && ce_qui_change.length > 0 && <Divider />}

            {ce_qui_change.length > 0 && (
              <Box>
                <SectionTitle icon={<ChangeCircleOutlinedIcon sx={{ fontSize: 18 }} />} label="Ce que ça change" />
                <Stack spacing={1}>
                  {ce_qui_change.map((item, i) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="baseline">
                      <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "primary.main", flexShrink: 0, mb: "-1px" }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.7, color: "text.secondary" }}>
                        {item}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}

            {ce_qui_change.length > 0 && enjeux.length > 0 && <Divider />}

            {enjeux.length > 0 && (
              <Box>
                <SectionTitle icon={<BalanceOutlinedIcon sx={{ fontSize: 18 }} />} label="Enjeux" />
                <Stack spacing={1.5}>
                  {enjeux.map((enjeu, i) => (
                    <Box key={i} sx={{ p: 2, borderRadius: "10px", bgcolor: "grey.50", border: "1px solid", borderColor: "grey.200" }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: enjeu.arbitrages ? 0.75 : 0 }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
                          {enjeu.sujet}
                        </Typography>
                        {enjeu.importance && (
                          <Typography
                            variant="caption"
                            sx={{
                              px: 1, py: 0.25, borderRadius: "6px",
                              bgcolor: "grey.200", color: "text.secondary",
                              fontSize: "0.65rem", fontWeight: "bold",
                              textTransform: "uppercase", letterSpacing: "0.05em",
                              whiteSpace: "nowrap", flexShrink: 0,
                            }}
                          >
                            {enjeu.importance}
                          </Typography>
                        )}
                      </Stack>
                      {enjeu.arbitrages && (
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                          {enjeu.arbitrages}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {enjeux.length > 0 && acteurs_concernes.length > 0 && <Divider />}

            {acteurs_concernes.length > 0 && (
              <Box>
                <SectionTitle icon={<PeopleOutlinedIcon sx={{ fontSize: 18 }} />} label="Qui est concerné ?" />
                <Stack spacing={1}>
                  {acteurs_concernes.map((a, i) => (
                    <Box key={i}>
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.25 }}>
                        {a.acteur}
                      </Typography>
                      {a.impact && (
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                          {a.impact}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            <Box sx={{ pt: 0.5 }}>
              <AiDisclaimer variant="banner" />
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </>
  );
}
