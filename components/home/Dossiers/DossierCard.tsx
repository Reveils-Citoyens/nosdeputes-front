import React from "react";

import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Link from "next/link";
import StatusChip, { Status } from "@/components/StatusChip";
import Chip from "@mui/material/Chip";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";

type DossierCardProps = {
  href: string;
  titre: null | string;
  dateDernierActe: Date | null;
  type: string;
  // etape: null | string; //TODO: use an enum when the type of etape will be clear
  thematique: string; // TODO: use an enum latter – pour le moment en attendant Thomas
  statusType?: Status;
  statusLabel?: string | null;
  interventions?: number;
  amendements?: number;
};
const DossierCard = (props: DossierCardProps) => {
  const {
    titre,
    type,
    href,
    interventions,
    amendements,
    dateDernierActe,
    statusLabel,
    statusType,
  } = props;

  const formattedDate = dateDernierActe
    ? dateDernierActe.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const withStats = interventions !== undefined && amendements !== undefined;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.3s",
        "&:hover": {
          boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={href}
        sx={{
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          height: "100%",
          gap: 2,
        }}
      >
        {/* --- HAUT : Type & Date --- */}
        <Stack
          direction="row"
          justifyContent="space-between"
          width="100%"
          alignItems="center"
        >
          <Chip
            label={type}
            size="small"
            variant="outlined"
            sx={{
              fontSize: "0.7rem",
              height: 24,
              borderColor: "grey.300",
              color: "text.secondary",
            }}
          />
          {formattedDate && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CalendarTodayOutlinedIcon
                sx={{ fontSize: 14, color: "text.secondary" }}
              />
              <Typography variant="caption" color="text.secondary">
                {formattedDate}
              </Typography>
            </Stack>
          )}
        </Stack>

        {/* --- MILIEU : Titre --- */}
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{
            lineHeight: 1.4,
            overflow: "hidden",
            flexGrow: 1,
          }}
        >
          {titre}
        </Typography>

        {/* --- BAS : Statut & Métriques --- */}
        <Stack width="100%" spacing={1.5}>
          {/* Ligne des badges */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ rowGap: 1 }}
          >
            {statusLabel && (
              <StatusChip
                size="small"
                status={statusType || "review"}
                label={statusLabel}
              />
            )}
            {/* {thematique && (
              <LabelChip size="small" label={thematique} />
            )} */}
          </Stack>

          {/* Ligne des compteurs discrets */}
          {amendements !== undefined && amendements > 0 && (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{
                pt: 1,
                borderTop: 1,
                borderColor: "grey.100",
                width: "100%",
              }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                title={`${amendements} amendements détectés`}
              >
                <DescriptionOutlinedIcon
                  sx={{ fontSize: 16, color: "text.secondary" }}
                />
                <Typography
                  variant="caption"
                  fontWeight="medium"
                  color="text.secondary"
                >
                  {amendements} amendements
                </Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
      </CardActionArea>
    </Card>
  );
};

export default DossierCard;
