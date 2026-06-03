"use client";

import React from "react";

import Link from "next/link";

import { useTheme, useMediaQuery } from "@mui/material";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import EnergyIcon from "@/icons/EnergyIcon";
import LabelChip from "@/components/LabelChip";
import StatusChip from "@/components/StatusChip";
import AlerteButton from "@/components/AlerteButton";
import Term from "@/components/Term";
import { getTermForProcedure } from "@/data/glossaire";
import { statusInfo } from "@/app/[legislature]/dossier/[id]/dataFunctions";
import { THEMES, type ThemeSlug } from "@/data/themes";
import { THEME_ICONS } from "@/app/themes/themeIcons";

const breadcrumbs = [
  <Link key="1" href="/">
    {/* <HomeIcon sx={{ fontSize: 12, mr: 1, mb: "3px" }} /> */}
    <Typography variant="caption" fontWeight="light">
      Accueil
    </Typography>
  </Link>,
  <Link key="2" href="/dossiers">
    <Typography variant="caption" fontWeight="regular">
      Dossiers
    </Typography>
  </Link>,
];

type HeroSectionProps = {
  libelleProcedure: string;
  titre: string | null;
  theme: string | null;
  status?: string;
  dossierUid?: string;
  themesSenat?: ThemeSlug[];
};

export const HeroSection = ({
  libelleProcedure,
  titre,
  theme: dossierTheme,
  status,
  dossierUid,
  themesSenat = [],
}: HeroSectionProps) => {
  const theme = useTheme();
  const procedureTermSlug = getTermForProcedure(libelleProcedure);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <>
      <Box
        sx={{
          minHeight: "272px", // picture height + header box padding
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          backgroundColor: "grey.900",
          [theme.breakpoints.up("md")]: {
            alignItems: "flex-end",
            justifyContent: "center",
            backgroundColor: "transparent",
          },
        }}
      >
        {/* Future background picture */}
        <Box
          sx={{
            position: "absolute",
            top: 80, // navbar height
            left: 0,
            zIndex: -1,
            backgroundImage: `url('/Panorama_hemicyle_assemblée_nationale.jpg')`,
            backgroundPositionX: "center",
            backgroundPositionY: "top",
            width: "100%",
            height: 240,
            display: "hidden",
          }}
        />
        <Paper
          elevation={0}
          sx={{
            py: 4,
            px: 3,
            width: "680px",
            borderRadius: 4,
            backgroundColor: "transparent",
            [theme.breakpoints.up("md")]: {
              backgroundColor: "#fff",
            },
          }}
        >
          <Stack
            direction="column"
            sx={{
              alignItems: "flex-start",
              [theme.breakpoints.up("md")]: {
                alignItems: "center",
              },
            }}
          >
            <Stack
              direction="column"
              spacing={2}
              sx={{
                textAlign: "center",
                alignItems: "flex-start",
                [theme.breakpoints.up("md")]: {
                  alignItems: "center",
                },
              }}
            >
              <Typography
                fontWeight="medium"
                variant="body2"
                sx={{
                  color: "#fff",
                  [theme.breakpoints.up("md")]: {
                    color: "grey.900",
                  },
                }}
              >
                {procedureTermSlug ? (
                  <Term
                    term={procedureTermSlug}
                    variant={isMobile ? "onDark" : "default"}
                  >
                    {libelleProcedure}
                  </Term>
                ) : (
                  libelleProcedure
                )}
              </Typography>
              <Typography
                component="h1"
                sx={{
                  color: "#fff",
                  fontSize: "h5.fontSize",
                  fontWeight: "fontWeightBold",
                  lineHeight: 1.3,
                  [theme.breakpoints.up("md")]: {
                    color: "grey.900",
                    fontSize: "h2.fontSize",
                    lineHeight: 1.25,
                  },
                }}
              >
                {titre}
              </Typography>
            </Stack>
            <Box sx={{ mt: 3 }}>
              {/* Ligne 1 : statut + alerte */}
              <Stack
                direction="row"
                useFlexGap
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                sx={{
                  justifyContent: "flex-start",
                  [theme.breakpoints.up("md")]: { justifyContent: "center" },
                }}
              >
                {status && <StatusChip size="small" {...statusInfo[status]} />}
                {themesSenat.length === 0 && dossierTheme && (
                  <LabelChip size="small" label={dossierTheme} icon={<EnergyIcon />} />
                )}
                {dossierUid && titre && (
                  <AlerteButton
                    subjectType="dossier"
                    subjectUid={dossierUid}
                    subjectLabel={titre}
                    variant="button"
                  />
                )}
              </Stack>

              {/* Ligne 2 : thèmes structurés */}
              {themesSenat.length > 0 && (
                <Stack
                  direction="row"
                  useFlexGap
                  spacing={1}
                  alignItems="center"
                  flexWrap="wrap"
                  sx={{
                    mt: 1.5,
                    justifyContent: "flex-start",
                    [theme.breakpoints.up("md")]: { justifyContent: "center" },
                  }}
                >
                  {themesSenat.map((slug) => {
                    const Icon = THEME_ICONS[slug];
                    return (
                      <Chip
                        key={slug}
                        component={Link}
                        href={`/themes/${slug}`}
                        clickable
                        size="medium"
                        label={THEMES[slug].label}
                        icon={<Icon style={{ fontSize: 16 }} />}
                        variant="outlined"
                        sx={{
                          fontSize: "0.8rem",
                          borderColor: "grey.300",
                          color: "text.secondary",
                          bgcolor: "background.paper",
                          "& .MuiChip-icon": { color: "primary.main", ml: 1 },
                          "&:hover": { borderColor: "primary.main", color: "primary.main" },
                        }}
                      />
                    );
                  })}
                </Stack>
              )}
              {/* <LabelChip size="small" label="Label" />
              <LabelChip size="small" label="Label" onDelete={() => {}} />
              <LabelChip size="small" label="Label" onDelete={() => {}} /> */}
            </Box>
          </Stack>
        </Paper>
      </Box>
    </>
  );
};
