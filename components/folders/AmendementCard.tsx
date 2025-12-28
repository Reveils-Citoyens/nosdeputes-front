"use client";
import * as React from "react";
import { Typography, Stack, Accordion, AccordionDetails, AccordionSummary, Box, Divider, Paper } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatusChip from "@/components/StatusChip";
import { Amendement } from "@prisma/client";
import ActeurCard from "./ActeurCard";

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
  acteurUid: null | string;
  titre?: string;
};

export default function AmendementCard(props: AmendementCardProps) {
  const { amendement, acteurUid, titre } = props;
  const nbSignataires = 1 + amendement.nombreCoSignataires;

  return (
    <Accordion
      elevation={0}
      disableGutters
      sx={{
        '&:before': { display: 'none' },
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&.Mui-expanded': {
          bgcolor: 'rgba(0, 0, 0, 0.01)',
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ 
          px: 2,
          minHeight: 48,
          '&.Mui-expanded': { minHeight: 64 } 
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%", mr: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: "medium", whiteSpace: 'nowrap' }}>
             {titre || `N°${amendement.numeroLong}`}
          </Typography>
          
          <Box sx={{ flexGrow: 1 }}>
            {acteurUid && <ActeurCard id={acteurUid} smallGroupColor link="name" />}
          </Box>

          <StatusChip
            size="small"
            label={amendement.sortAmendement}
            status={getStatus(amendement.sortAmendement)}
          />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pt: 0, pb: 3 }}>

        <Stack spacing={2}>
          {amendement.dispositif && (
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', mb: 0.8, display: 'block' }}>
                Dispositif
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: 'grey.50',
                  borderLeft: '4px solid',
                  borderColor: 'primary.light',
                  borderRadius: '0 4px 4px 0',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: amendement.dispositif }}
                />
              </Paper>
            </Box>
          )}

          {/* Section EXPOSÉ */}
          {amendement.exposeSommaire && (
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                Exposé Sommaire
              </Typography>
              <Typography
                variant="body2"
                sx={{ lineHeight: 1.8, color: 'text.primary' }}
                dangerouslySetInnerHTML={{ __html: amendement.exposeSommaire }}
              />
            </Box>
          )}

          <Box sx={{ pt: .5 }}>
             <Stack 
                direction="row" 
                justifyContent="space-between" 
                sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1 }}
              >
                <MetaItem label="Signataires" value={`${nbSignataires} député${nbSignataires > 1 ? "s" : ""}`} />
                <MetaItem 
                    label="Dépôt" 
                    value={amendement.dateDepot ? new Date(amendement.dateDepot).toLocaleDateString("fr-FR") : "-"} 
                />
                <MetaItem 
                    label="Examen" 
                    value={amendement.dateSort ? new Date(amendement.dateSort).toLocaleDateString("fr-FR") : "-"} 
                />
              </Stack>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

function MetaItem({ label, value }: { label: string, value: string }) {
  return (
    <Box>
      <Typography variant="caption" display="block" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.6rem', fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
        {value}
      </Typography>
    </Box>
  );
}