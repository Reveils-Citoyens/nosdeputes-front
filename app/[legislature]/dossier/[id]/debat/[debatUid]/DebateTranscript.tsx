"use client";

import React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { SpeakingTime } from "@/components/folders/SpeakingTime";
import { DebateTimeline } from "@/app/[legislature]/dossier/[id]/debat/[debatUid]/DebateTimeline";

import { ClockMovingIcon } from "@/icons/ClockMovingIcon";
import { useTheme } from "@mui/material";
import { WORDS_PER_MINUTES } from "@/components/const";
import { Paragraphe } from "@prisma/client";
import { formatDateDebat } from "@/utils/formatDateDebat";

function getWordsPerActeur(paragraphes: Paragraphe[]) {
  const wordsPerActeur: Record<string, number> = {};
  paragraphes.forEach((paragraphe) => {
    const { codeGrammaire, acteurRefUid, texte } = paragraphe;

    if (
      !codeGrammaire ||
      !["INTERRUPTION_1_10", "PAROLE_GENERIQUE"].includes(codeGrammaire) ||
      !acteurRefUid ||
      !texte
    ) {
      return;
    }

    const wordCount = texte.split(" ").length;
    if (wordsPerActeur[acteurRefUid]) {
      wordsPerActeur[acteurRefUid] += wordCount;
    } else {
      wordsPerActeur[acteurRefUid] = wordCount;
    }
  });

  return wordsPerActeur;
}

type DebateTranscriptProps = {
  paragraphes: Paragraphe[];
  wordsCounts: Record<string, number>;
  title: string;
  debatUid: string;
  chambre?: string | null;
};

export const DebateTranscript = (props: DebateTranscriptProps) => {
  const { paragraphes, wordsCounts, title, debatUid, chambre } = props;

  const formattedDate = formatDateDebat(title);
  const institution = chambre === "SN" ? "Sénat" : "Assemblée nationale";
  const location = debatUid.includes("CRS") ? "Hémicycle" : "Commission";

  const wordsPerActeur = React.useMemo(
    () => getWordsPerActeur(paragraphes),
    [paragraphes]
  );

  const durationEstimation = Math.round(
    Object.values(wordsCounts).reduce((acc, wordCount) => acc + wordCount, 0) /
      WORDS_PER_MINUTES
  );
  const theme = useTheme();

  return (
    <>
      <Stack spacing={1} mb={1}>
        <Typography variant="h4" sx={{ textTransform: "capitalize" }}>
          {formattedDate} • {institution} • {location}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ClockMovingIcon fontSize="inherit" fill={theme.palette.grey[900]} />
          <Typography
            variant="caption"
            fontWeight="light"
            sx={{ color: theme.palette.grey[700] }}
          >
            Temps de lecture : {durationEstimation} minute
            {durationEstimation > 1 ? "s" : ""}
          </Typography>
        </Stack>
      </Stack>
      <Accordion
        elevation={0}
        disableGutters
        defaultExpanded
        variant="outlined"
      >
        <AccordionSummary
          aria-controls="additional-info-content"
          id="additional-info-header"
        >
          <Typography>Temps de parole par groupe</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SpeakingTime wordsPerActeur={wordsPerActeur} />
        </AccordionDetails>
      </Accordion>
      <DebateTimeline paragraphes={paragraphes} />
    </>
  );
};