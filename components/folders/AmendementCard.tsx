"use client";
import * as React from "react";

import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatusChip from "@/components/StatusChip";

import { Amendement } from "@prisma/client";

import ActeurCard from "./ActeurCard";
import { Avatar, Box } from "@mui/material";

function getStatus(label: string | null) {
  switch (label) {
    case "Adopté":
      return "validated";
    case "Rejeté":
    case "Irrecevable":
    case "Tombé":
    case "Irrecevable 40":
      return "refused";
    case "Non soutenu":
    case "Retiré":
      return "dropped";
    default:
      return "review";
  }
}
type AmendementCardProps = {
  amendement: Amendement;
  titre?: string;
};

function GouvernementAvatar(props: { sx?: React.CSSProperties }) {
  return (
    <Box sx={{ display: "flex", minWidth: 0, ...props.sx }}>
      <Avatar
        sx={{ height: 40, width: 40 }}
        alt="Gouvernement"
        src="/marianne.png"
      >
        Gouv
      </Avatar>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: 1.3,
          minWidth: 0,
        }}
      >
        <Typography variant="body2" fontWeight="medium">
          Gouvernement
        </Typography>
        <Typography variant="body2" fontWeight="medium"></Typography>
      </Box>
    </Box>
  );
}
export default function AmendementCard(props: AmendementCardProps) {
  const { amendement, titre } = props;

  const nbSignataires = 1 + amendement.nombreCoSignataires;

  const pannelId = `${amendement.uid}-pannel`;
  const headerId = `${amendement.uid}-header`;
  return (
    <Accordion
      elevation={0}
      disableGutters
      sx={(theme) => ({
        borderBottom: `solid ${theme.palette.divider} 1px`,
        borderRadius: 0,
      })}
    >
      <AccordionSummary
        aria-controls={pannelId}
        id={headerId}
        expandIcon={<ExpandMoreIcon />}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ width: "100%", mr: 2 }}
        >
          <Box sx={{ flexGrow: 1 }}>
            {amendement.acteurRefUid && (
              <ActeurCard
                id={amendement.acteurRefUid}
                smallGroupColor
                link="name"
              />
            )}
            {!amendement.acteurRefUid &&
              amendement.typeAuteur === "Gouvernement" && (
                <GouvernementAvatar />
              )}
          </Box>
          {titre && <Typography>{titre}</Typography>}

          <StatusChip
            size="small"
            label={amendement.sortAmendement}
            status={getStatus(amendement.sortAmendement)}
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack direction="column" spacing={2}>
          <Typography variant="caption">N°{amendement.numeroLong}</Typography>
          {amendement.dispositif && (
            <Typography
              fontWeight="light"
              variant="body1"
              flexGrow={1}
              flexShrink={1}
              flexBasis={0}
              component="div"
              sx={{ bgcolor: "grey.50", p: 1 }}
              dangerouslySetInnerHTML={{ __html: amendement.dispositif }}
            />
          )}
          {amendement.exposeSommaire && (
            <Typography
              fontWeight="light"
              variant="body2"
              flexGrow={1}
              flexShrink={1}
              flexBasis={0}
              component="div"
              dangerouslySetInnerHTML={{ __html: amendement.exposeSommaire }}
            />
          )}

          {/* <Typography fontWeight="light" variant="body2">
            Examiné par:&nbsp;
            <Typography component="a" variant="body2">
              Le nom d&apos;une commission parlementaire
            </Typography>
          </Typography> */}
          <Stack direction="row" justifyContent="space-between" flexBasis={0}>
            <Typography fontWeight="light" variant="body2">
              Déposé par:&nbsp;
              {amendement.typeAuteur === "Gouvernement" ? (
                <Typography component="span" variant="body2">
                  Gouvernement
                </Typography>
              ) : (
                <Typography component="span" variant="body2">
                  {nbSignataires} député{nbSignataires > 1 ? "s" : ""}
                </Typography>
              )}
            </Typography>

            <Typography fontWeight="light" variant="body2">
              Date de dépôt:&nbsp;
              <Typography component="span" variant="body2">
                {amendement.dateDepot
                  ? new Date(amendement.dateDepot).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "-"}
              </Typography>
            </Typography>

            <Typography fontWeight="light" variant="body2">
              Date d&apos;examen:&nbsp;
              <Typography component="span" variant="body2">
                {amendement.dateSort
                  ? new Date(amendement.dateSort).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "-"}
              </Typography>
            </Typography>
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
