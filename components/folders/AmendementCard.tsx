"use client";
import * as React from "react";
import { 
  Typography, 
  Stack, 
  Accordion, 
  AccordionDetails, 
  AccordionSummary, 
  Box, 
  Paper,
  useMediaQuery,
  useTheme
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatusChip from "@/components/StatusChip";
import { Amendement, Dossier } from "@prisma/client";
import ActeurCard from "./ActeurCard";
import Link from "next/link";

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
    amendement: Amendement & { dossierRef?: Dossier | null };
    acteurUid: null | string;
    titre?: string;
};

export default function AmendementCard(props: AmendementCardProps) {
  const { amendement, acteurUid, titre } = props;
  const nbSignataires = 1 + amendement.nombreCoSignataires;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
            minHeight: 60,
            "& .MuiAccordionSummary-content": {
                flexWrap: "wrap",
                alignItems: "center",
                gap: 1
            }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                <Typography 
                    variant="subtitle2" 
                    sx={{ 
                    fontWeight: 700, 
                    whiteSpace: 'nowrap',
                    minWidth: "auto"
                    }}
                >
                    {titre || `N°${amendement.numeroLong}`}
                </Typography>
                
                <Box sx={{ flexGrow: 0, minWidth: 0, maxWidth: isMobile ? 150 : 'auto' }}>
                    {acteurUid && <ActeurCard id={acteurUid} smallGroupColor link="name" />}
                </Box>
            </Box>

            <Box sx={{ flexShrink: 0 }}>
                <StatusChip
                    size="small"
                    label={amendement.sortAmendement}
                    status={getStatus(amendement.sortAmendement)}
                />
            </Box>
        </Box>

      </AccordionSummary>

      <AccordionDetails sx={{ px: 3, pt: 0, pb: 3 }}>
        <Stack spacing={3}>
          
            {amendement.dossierRef && (
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                  Dossier : 
                </Typography>
                <Link 
                  href={`/${amendement.dossierRef.legislature}/dossier/${amendement.dossierRef.uid}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Typography 
                    variant="body2" 
                    color="primary" 
                    sx={{ fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  >
                    {amendement.dossierRef.titre}
                  </Typography>
                </Link>
              </Box>
          )}

          {amendement.dispositif && (
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                Dispositif
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderLeft: '4px solid',
                  borderColor: 'primary.light',
                  borderRadius: '0 4px 4px 0',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: amendement.dispositif }}
                />
              </Paper>
            </Box>
          )}

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

          <Box sx={{ pt: 1 }}>
             <Stack 
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between" 
                spacing={{ xs: 2, sm: 0 }}
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