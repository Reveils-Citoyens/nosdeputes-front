"use client";
import React from "react";

import { useSelectedLayoutSegment } from "next/navigation";
import { permanentRedirect } from "next/navigation";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

/** Élément minimal affiché dans le sélecteur (un débat ou un compte rendu). */
type DebatLike = {
  uid: string;
  dateSeanceJour?: string | null;
  dateSeance?: string | Date | null;
  reunionDate?: string | null;
  lectureLabel?: string | null;
};

type DebateFilterBarProps = {
  debats: DebatLike[];
  /** Segment de base pour les liens (défaut: "debat") */
  basePath?: string;
  /** Chemin absolu du groupe de réunions, utilisé pendant les transitions. */
  baseHref?: string;
  /** Navigation contrôlée permettant au layout d'afficher son skeleton. */
  onNavigate?: (href: string) => void;
};

function formatReunionDate(debat: DebatLike): string {
  const rawDate = debat.reunionDate ?? debat.dateSeance;
  if (!rawDate) return debat.dateSeanceJour ?? "Réunion";

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return debat.dateSeanceJour ?? "Réunion";

  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDebateOptionLabel(debat: DebatLike): string {
  return formatReunionDate(debat);
}

export const DebateFilterBar = (props: DebateFilterBarProps) => {
  const { debats, basePath = "debat", baseHref, onNavigate } = props;
  const sceanceUid = useSelectedLayoutSegment();

  const getHref = (uid: string) =>
    baseHref ? `${baseHref}/${uid}` : uid;
  const handleNavigation = (
    event: React.MouseEvent<HTMLElement>,
    href: string
  ) => {
    if (
      !onNavigate ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    onNavigate(href);
  };

  const debatIndex = debats.findIndex((debat) => debat.uid === sceanceUid);
  if (!sceanceUid || debatIndex < 0) {
    if (debats.length > 0) {
      // Si le debat n'existe pas ou est vide, on redirige vers le premier débat disponible
      if (sceanceUid) {
        permanentRedirect(`${debats[0].uid}`);
      } else {
        permanentRedirect(`${basePath}/${debats[0].uid}`);
      }
    }
  }

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        py: 2,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Container
        sx={{
          display: "flex",
          flexDirection: {
            xs: "row",
            md: "row",
          },
          gap: 5,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ width: "100%" }}
        >
          <Select
            value={sceanceUid}
            displayEmpty
            inputProps={{ "aria-label": "Choisir une réunion" }}
            sx={{ flex: 1 }}
          >
            {debats.flatMap((debat, index) => {
              const previousLecture = debats[index - 1]?.lectureLabel;
              const startsLectureGroup =
                debat.lectureLabel && debat.lectureLabel !== previousLecture;

              return [
                startsLectureGroup ? (
                    <ListSubheader
                      key={`lecture-${debat.lectureLabel}-${index}`}
                      sx={{
                        color: "text.primary",
                        fontWeight: 700,
                        lineHeight: 3,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {debat.lectureLabel}
                    </ListSubheader>
                ) : null,
                // @ts-ignore
                <MenuItem
                  key={debat.uid}
                  value={debat.uid}
                  component={Link}
                  href={getHref(debat.uid)}
                  onClick={(event) =>
                    handleNavigation(event, getHref(debat.uid))
                  }
                >
                  <Typography
                    variant="caption"
                    sx={{
                      textTransform: {
                        xs: "uppercase",
                        md: "none",
                      },
                    }}
                  >
                    {formatDebateOptionLabel(debat)}
                  </Typography>
                </MenuItem>,
              ];
            })}
          </Select>
          <Stack
            justifyContent="flex-end"
            direction="row"
            gap={2}
            flex={3}
            sx={{
              display: {
                xs: "none",
                md: "flex",
              },
            }}
          >
            <IconButton
              size="small"
              component={Link}
              href={
                debatIndex <= 0 ? "" : getHref(debats[debatIndex - 1].uid)
              }
              onClick={(event) => {
                if (debatIndex > 0) {
                  handleNavigation(
                    event,
                    getHref(debats[debatIndex - 1].uid)
                  );
                }
              }}
              disabled={debatIndex <= 0}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              component={Link}
              href={
                debatIndex >= debats.length - 1
                  ? ""
                  : getHref(debats[debatIndex + 1].uid)
              }
              onClick={(event) => {
                if (debatIndex < debats.length - 1) {
                  handleNavigation(
                    event,
                    getHref(debats[debatIndex + 1].uid)
                  );
                }
              }}
              disabled={debatIndex >= debats.length - 1}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
