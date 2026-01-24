"use client";
import React from "react";

import { useSelectedLayoutSegment, useRouter, permanentRedirect } from "next/navigation";
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
  const router = useRouter();
  const sceanceUid = useSelectedLayoutSegment();

  const debatIndex = debats.findIndex((debat) => debat.uid === sceanceUid);
  React.useEffect(() => {
    if (debats.length > 0 && (!sceanceUid || debatIndex < 0)) {
      router.replace(`${debats[0].uid}`);
    }
  }, [sceanceUid, debatIndex, debats, router]);

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
          <Select value={sceanceUid || ""} displayEmpty sx={{ flex: 1 }} onChange={(e) => router.push(`${e.target.value}`)} >
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
          <Stack justifyContent="flex-end" direction="row" flex={3} gap={2} sx={{ display: { xs: "none", md: "flex" } }}>
            <IconButton 
              disabled={debatIndex <= 0}
              onClick={() => router.push(`${debats[debatIndex - 1].uid}`)}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton 
              disabled={debatIndex >= debats.length - 1}
              onClick={() => router.push(`${debats[debatIndex + 1].uid}`)}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
