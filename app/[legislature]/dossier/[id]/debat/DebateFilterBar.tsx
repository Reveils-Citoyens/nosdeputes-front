"use client";
import React from "react";

import { useSelectedLayoutSegment } from "next/navigation";
import { permanentRedirect } from "next/navigation";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "next/link";

import { Agenda } from "@prisma/client";

type DebateFilterBarProps = {
  reunions: Agenda[];
};

export const DebateFilterBar = (props: DebateFilterBarProps) => {
  // const { debats } = props;
  const { reunions } = props;
  const reunionUid = useSelectedLayoutSegment();

  const debatIndex = reunions.findIndex((reu) => reu.uid === reunionUid);
  
  // const debatIndex = debats.findIndex((debat) => debat.uid === sceanceUid);
  if (!reunionUid || debatIndex < 0) {
    if (reunions.length > 0) {
      // Si le debat n'existe pas ou est vide, on redirige vers le premier débat disponible
      if (reunionUid) {
        permanentRedirect(`${reunions[0].uid}`);
      } else {
        permanentRedirect(`debat/${reunions[0].uid}`);
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
          <Select value={reunionUid} displayEmpty sx={{ flex: 1 }}>
            {reunions.map((reunion) => {
              const reunuionUid = reunion.uid;
              // console.log(reunion.dateSeance)
              console.log(reunion);
                const dateSeanceJour = reunion.timestampDebut
                ? new Date(reunion.timestampDebut).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  })
                : "Date inconnue";
              return (
                // @ts-ignore
                <MenuItem
                  key={reunuionUid}
                  value={reunuionUid}
                  component={Link}
                  href={reunuionUid}
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
                    {dateSeanceJour}
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
              href={debatIndex <= 0 ? "" : reunions[debatIndex - 1].uid}
              disabled={debatIndex <= 0}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              component={Link}
              href={
                debatIndex >= reunions.length - 1
                  ? ""
                  : reunions[debatIndex + 1].uid
              }
              disabled={debatIndex >= reunions.length - 1}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
