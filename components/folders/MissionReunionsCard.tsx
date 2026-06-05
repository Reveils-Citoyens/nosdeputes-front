import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { CardLayout } from "@/components/folders/CardLayout";
import type { MissionReunion } from "@/data/mongo/getMissionReunions";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MissionReunionsCard({
  reunions,
  linkBase,
}: {
  reunions: MissionReunion[];
  /** Base d'URL des liens compte rendu (ex. tab dossier "/L/dossier/ID/comptes-rendus"). */
  linkBase: string;
}) {
  return (
    <CardLayout title={`Réunions et auditions (${reunions.length})`}>
      <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "grey.100" }} />} spacing={2}>
        {reunions.map((r) => {
          const dateLabel = formatDate(r.date);
          return (
            <Box key={r.uid}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: r.odj.length ? 1 : 0 }}>
                <EventOutlinedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="body2" fontWeight="bold">
                  {dateLabel ?? "Date à préciser"}
                </Typography>
              </Stack>

              {r.odj.length > 0 && (
                <Stack spacing={0.5} sx={{ pl: 3.25 }}>
                  {r.odj.map((ligne, i) => (
                    <Typography key={i} variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                      {ligne}
                    </Typography>
                  ))}
                </Stack>
              )}

              {r.lieu && (
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ pl: 3.25, mt: 0.75 }}>
                  <PlaceOutlinedIcon sx={{ fontSize: 14, color: "grey.500" }} />
                  <Typography variant="caption" color="text.secondary">
                    {r.lieu}
                  </Typography>
                </Stack>
              )}

              {r.compteRenduRefUid && (
                <Box sx={{ pl: 3.25, mt: 1 }}>
                  <Typography
                    component={Link}
                    href={`${linkBase}/${r.compteRenduRefUid}`}
                    data-umami-event="compte-rendu-ouvert"
                    data-umami-event-source="dossier"
                    variant="caption"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      color: "primary.main",
                      fontWeight: 600,
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    <DescriptionOutlinedIcon sx={{ fontSize: 15 }} />
                    Lire le compte rendu
                  </Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    </CardLayout>
  );
}
