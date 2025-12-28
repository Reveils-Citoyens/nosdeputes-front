"use client";
import * as React from "react";
import { 
  Typography, 
  Stack, 
  Accordion, 
  AccordionDetails, 
  AccordionSummary, 
  Box, 
  Divider, 
  Paper 
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Organe, Question } from "@prisma/client";
import StatusChip from "@/components/StatusChip";

type QuestionCardProps = {
  question: Question & { ministerInteroge: Organe | null };
};

export default function QuestionCard(props: QuestionCardProps) {
  const {
    question: {
      uid,
      type,
      numero,
      dateDepot,
      titre,
      rubrique,
      texteQuestion,
      erratumQuestion,
      texteReponse,
      erratumReponse,
      ministerInteroge,
    },
  } = props;

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
          <Typography variant="subtitle2" sx={{ fontWeight: "medium", flexGrow: 1 }}>
             {titre || `Question N°${numero}`}
          </Typography>
          
          <Stack direction="row" spacing={1}>
            {rubrique && <StatusChip size="small" label={rubrique} />}
            {type && <StatusChip size="small" label={type} />}
          </Stack>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pt: 0, pb: 3 }}>

        <Stack spacing={3}>
          {texteQuestion && (
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                Question {erratumQuestion && "(avec Erratum)"}
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
                  sx={{ lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: texteQuestion }}
                />
                {erratumQuestion && (
                  <Typography variant="caption" sx={{ mt: 2, display: 'block', fontStyle: 'italic', color: 'warning.main' }}>
                    Note: {erratumQuestion}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}

          {/* SECTION RÉPONSE */}
          {texteReponse && (
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                Réponse du Ministère {erratumReponse && "(avec Erratum)"}
              </Typography>
              <Typography
                variant="body2"
                sx={{ lineHeight: 1.8, color: 'text.primary', textAlign: 'justify' }}
                dangerouslySetInnerHTML={{ __html: texteReponse }}
              />
              {erratumReponse && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                  Erratum: {erratumReponse}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ pt: 1 }}>
             <Stack 
                direction="row" 
                justifyContent="space-between" 
                sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1 }}
              >
                <MetaItem label="N° Question" value={numero.toString()} />
                <MetaItem 
                    label="Destinataire" 
                    value={ministerInteroge?.libelleAbrege || "Non spécifié"} 
                />
                <MetaItem 
                    label="Déposée le" 
                    value={dateDepot ? new Date(dateDepot).toLocaleDateString("fr-FR") : "-"} 
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