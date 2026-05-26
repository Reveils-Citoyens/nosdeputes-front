"use client";

import React from "react";

import Link from "next/link";

import { useTheme, useMediaQuery } from "@mui/material";
import Box from "@mui/material/Box";
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
};

export const HeroSection = ({
  libelleProcedure,
  titre,
  theme: dossierTheme,
  status,
  dossierUid,
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
                  fontSize: "body1.fontSize",
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
            <Stack
              direction="row"
              useFlexGap
              spacing={1}
              alignItems="center"
              flexWrap="wrap"
              sx={{
                justifyContent: "flex-start",
                mt: 3,
                [theme.breakpoints.up("md")]: {
                  justifyContent: "center",
                },
              }}
            >
              {status && <StatusChip size="small" {...statusInfo[status]} />}
              {/* <StatusChip size="small" status="refused" label="Abrogé" />
              <StatusChip size="small" status="refused" label="Rejeté" />
              <StatusChip size="small" status="dropped" label="Non-soutenu" />
              <StatusChip size="small" status="review" label="1e lecture AN" />
              <StatusChip size="small" status="validated" label="Promulgué" /> */}
              {/* {themes_labels?.map((label: string) => (
                <LabelChip
                  key={label}
                  size="small"
                  label={label}
                  icon={<EnergyIcon />}
                />
              ))} */}
              {dossierTheme && (
                <LabelChip
                  size="small"
                  label={dossierTheme}
                  icon={<EnergyIcon />}
                />
              )}
              {dossierUid && titre && (
                <AlerteButton
                  subjectType="dossier"
                  subjectUid={dossierUid}
                  subjectLabel={titre}
                  variant="button"
                />
              )}
              {/* <LabelChip size="small" label="Label" />
              <LabelChip size="small" label="Label" onDelete={() => {}} />
              <LabelChip size="small" label="Label" onDelete={() => {}} /> */}
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </>
  );
};
