"use client";
import * as React from "react";

import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Organe, Question } from "@prisma/client";
import StatusChip from "@/components/StatusChip";
import { capitalizeFirst } from "@/lib/strings";
import LienSource from "@/components/LienSource";
import { urlQuestion } from "@/lib/sourcesAN";

type QuestionCardProps = {
  question: Question & { ministerInteroge: Organe | null };
  defaultExpanded?: boolean;
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
    defaultExpanded = false,
  } = props;

  const pannelId = `${uid}-pannel`;
  const headerId = `${uid}-header`;

  return (
    <Accordion
      id={`question-${uid}`}
      defaultExpanded={defaultExpanded}
      elevation={0}
      disableGutters
      sx={{
        "&:before": { display: "none" },
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
        "&.Mui-expanded": {
          bgcolor: "rgba(0, 0, 0, 0.01)",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          minHeight: 48,
          "&.Mui-expanded": { minHeight: 64 },
        }}
        aria-controls={pannelId}
        id={headerId}
      >
        {/* Le titre prend la place restante et passe à la ligne ; les
            pastilles restent groupées sur une ligne (sous le titre sur
            mobile), au lieu de s'empiler quand le titre est long. */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={{ xs: 1, sm: 2 }}
          sx={{ width: "100%", mr: 1, minWidth: 0 }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: "medium", flex: 1, minWidth: 0 }}
          >
            {titre || `Question N°${numero}`}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            useFlexGap
            sx={{ flexShrink: 0, flexWrap: { xs: "wrap", sm: "nowrap" } }}
          >
            {rubrique && (
              <StatusChip size="small" label={capitalizeFirst(rubrique)} />
            )}
            {type && <StatusChip size="small" label={type} />}
            {/* Badge "Répondue" pour les QE qui ont une réponse */}
            {type === "QE" && texteReponse && (
              <StatusChip size="small" status="validated" label="Répondue" />
            )}
          </Stack>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pt: 0, pb: 3 }}>
        <Stack spacing={3}>
          {texteQuestion && (
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Question {erratumQuestion && "(avec Erratum)"}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "grey.50",
                  borderLeft: "4px solid",
                  borderColor: "primary.light",
                  borderRadius: "0 4px 4px 0",
                }}
              >
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: texteQuestion }}
                />
                {erratumQuestion && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 2,
                      display: "block",
                      fontStyle: "italic",
                      color: "warning.main",
                    }}
                  >
                    Note: {erratumQuestion}
                  </Typography>
                )}
              </Paper>
            </Box>
          )}

          {/* SECTION RÉPONSE */}
          {texteReponse && (
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold",
                  mb: 0.5,
                  display: "block",
                }}
              >
                Réponse du Ministère {erratumReponse && "(avec Erratum)"}
              </Typography>
              <Typography
                component="div"
                variant="body2"
                sx={{
                  lineHeight: 1.8,
                  color: "text.primary",
                  textAlign: "justify",
                }}
                dangerouslySetInnerHTML={{ __html: texteReponse }}
              />
              {erratumReponse && (
                <Typography
                  variant="caption"
                  sx={{ mt: 1, display: "block", fontStyle: "italic" }}
                >
                  Erratum: {erratumReponse}
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ pt: 1 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              flexWrap="wrap"
              useFlexGap
              columnGap={2}
              rowGap={1.5}
              sx={{ bgcolor: "grey.100", p: 1.5, borderRadius: 1 }}
            >
              <MetaItem label="N° Question" value={numero.toString()} />
              <MetaItem
                label="Destinataire"
                value={ministerInteroge?.libelleAbrege || "Non spécifié"}
              />
              <MetaItem
                label="Déposée le"
                value={
                  dateDepot
                    ? new Date(dateDepot).toLocaleDateString("fr-FR")
                    : "-"
                }
              />
              <MetaItem
                label="Source"
                value={
                  <LienSource href={urlQuestion(uid)} type="question" sx={metaLienSx}>
                    Assemblée nationale
                  </LienSource>
                }
              />
            </Stack>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

// Le lien vers la source se lit comme les autres valeurs de la barre.
const metaLienSx = { fontSize: "0.85rem", fontWeight: 600, color: "text.primary", whiteSpace: "normal" };

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography
        variant="caption"
        display="block"
        sx={{
          color: "text.secondary",
          textTransform: "uppercase",
          fontSize: "0.6rem",
          fontWeight: 800,
        }}
      >
        {label}
      </Typography>
      <Typography variant="body2" component="div" sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
        {value}
      </Typography>
    </Box>
  );
}
