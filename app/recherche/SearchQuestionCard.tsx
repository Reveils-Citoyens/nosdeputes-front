"use client";

import * as React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatusChip from "@/components/StatusChip";
import ActeurCard from "@/components/folders/ActeurCard";
import { capitalizeFirst } from "@/lib/strings";
import type { QuestionSearchResult } from "@/data/mongo/searchQuestion";

export default function SearchQuestionCard({
  question: q,
}: {
  question: QuestionSearchResult;
}) {
  const date = q.dateDepot
    ? new Date(q.dateDepot).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const hasQuestionText = !!q.texteQuestion;
  const hasResponseText = !!q.texteReponse;
  const responseLabel = hasQuestionText
    ? "Réponse du ministère"
    : "Échange en séance";
  // Badge "Répondue" pertinent uniquement pour les questions écrites
  // (les QG/QOSD ont par nature une réponse en séance, le badge serait trivial).
  const isEcrite = q.type === "Question écrite";
  const showRepondueBadge = isEcrite && hasResponseText;

  return (
    <Accordion
      elevation={0}
      disableGutters
      sx={{
        "&:before": { display: "none" },
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:last-child": { borderBottom: "none" },
        "&.Mui-expanded": { bgcolor: "rgba(0, 0, 0, 0.01)" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          py: 1.5,
          "& .MuiAccordionSummary-content": {
            flexDirection: "column",
            alignItems: "stretch",
            gap: 0.75,
            my: 0,
            minWidth: 0,
            overflow: "hidden",
            pr: 1.5,
          },
        }}
      >
        {/* Ligne 1 : titre seul (pleine largeur, tronqué si long) */}
        <Typography
          variant="subtitle2"
          fontWeight="bold"
          noWrap
          sx={{ color: "#1A1A1B" }}
        >
          {q.titre}
        </Typography>

        {/* Ligne 2 : député (gauche) + chips rubrique/type (droite, alignés) */}
        {(q.acteurRefUid || q.rubrique || q.type) && (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            sx={{ minWidth: 0 }}
          >
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ minWidth: 0, flex: "0 0 auto" }}
            >
              {q.acteurRefUid && (
                <ActeurCard
                  id={q.acteurRefUid}
                  link="name"
                  smallGroupColor
                  groupColorSize="small"
                />
              )}
            </Box>
            {(q.rubrique || q.type || showRepondueBadge) && (
              <Stack
                direction="row"
                spacing={0.5}
                flexWrap="wrap"
                useFlexGap
                sx={{ flexShrink: 0, justifyContent: "flex-end" }}
              >
                {q.rubrique && (
                  <StatusChip size="small" label={capitalizeFirst(q.rubrique)} />
                )}
                {q.type && <StatusChip size="small" label={q.type} />}
                {showRepondueBadge && (
                  <StatusChip size="small" status="validated" label="Répondue" />
                )}
              </Stack>
            )}
          </Stack>
        )}

        {/* Ligne 3 : meta (date + ministre interrogé) */}
        {(date || q.ministerInteroge) && (
          <Typography variant="caption" color="text.secondary">
            {[
              date && `Le ${date}`,
              q.ministerInteroge?.libelleAbrege &&
                `Destinataire : ${q.ministerInteroge.libelleAbrege}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Typography>
        )}
      </AccordionSummary>

      <AccordionDetails sx={{ px: 3, pt: 0, pb: 3 }}>
        <Stack spacing={3}>
          {hasQuestionText && (
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontWeight: "bold", mb: 0.5, display: "block" }}
              >
                Question posée
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
                  dangerouslySetInnerHTML={{ __html: q.texteQuestion! }}
                />
              </Paper>
            </Box>
          )}

          {hasResponseText && (
            <Box>
              <Typography
                variant="overline"
                sx={{ color: "text.secondary", fontWeight: "bold", mb: 0.5, display: "block" }}
              >
                {responseLabel}
              </Typography>
              <Typography
                component="div"
                variant="body2"
                sx={{ lineHeight: 1.8, color: "text.primary", textAlign: "justify" }}
                dangerouslySetInnerHTML={{ __html: q.texteReponse! }}
              />
            </Box>
          )}

          {!hasQuestionText && !hasResponseText && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
              Texte intégral non disponible pour cette question.
            </Typography>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
