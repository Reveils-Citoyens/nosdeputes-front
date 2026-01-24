"use client";
import React from "react";

import { useSelectedLayoutSegment } from "next/navigation";
import { permanentRedirect } from "next/navigation";
import { formatDateDebat } from "@/utils/formatDateDebat";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Agenda } from "@prisma/client";
import Link from "next/link";
import { ReturnedDebat } from "@/data/getDebats";

type DebateFilterBarProps = {
  debats: ReturnedDebat[];
};

export const DebateFilterBar = (props: DebateFilterBarProps) => {
  const { debats } = props;
  const sceanceUid = useSelectedLayoutSegment();

  const debatIndex = debats.findIndex((debat) => debat.uid === sceanceUid);
  if (!sceanceUid || debatIndex < 0) {
    if (debats.length > 0) {
      // Si le debat n'existe pas ou est vide, on redirige vers le premier débat disponible
      if (sceanceUid) {
        permanentRedirect(`${debats[0].uid}`);
      } else {
        permanentRedirect(`debat/${debats[0].uid}`);
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
          <Select value={sceanceUid || ""} displayEmpty sx={{ flex: 1 }}>
            {debats.map((debat) => {
              const dateStr = debat.dateSeance ? formatDateDebat(debat.dateSeance) : "Date inconnue";
              const chambre = debat.chambre ?? "AN";
              const isHemicycle = debat.uid?.startsWith("CRSANR");
              const lieu = isHemicycle ? "Hémicycle" : "Commission";

              return (
                // @ts-ignore
                <MenuItem
                  key={debat.uid}
                  value={debat.uid || ""}
                  component={Link}
                  href={(debat.uid as string) || "#"}
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
                    {dateStr} - {chambre} - {lieu}
                  </Typography>
                </MenuItem>
              );
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
              href={debatIndex <= 0 ? "" : debats[debatIndex - 1].uid!}
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
                  : debats[debatIndex + 1].uid!
              }
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
