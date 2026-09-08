"use client";

import React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { SpeakingTime } from "@/components/folders/SpeakingTime";
import { DebateTimeline } from "@/app/[legislature]/dossier/[id]/debat/[debatUid]/DebateTimeline";

import { ClockMovingIcon } from "@/icons/ClockMovingIcon";
import { useTheme } from "@mui/material";
import { WORDS_PER_MINUTES } from "@/components/const";
import { Paragraphe } from "@prisma/client";
import LecteurSeance from "@/components/LecteurSeance";
import type { Video } from "@/data/getVideoReunion";

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
  /** Null quand la séance n'a pas de vidéo : aucun bouton ne s'affiche alors. */
  video?: Video | null;
};
export const DebateTranscript = (props: DebateTranscriptProps) => {
  const { paragraphes, wordsCounts, title, video } = props;

  // Seconde en cours de lecture. Le lecteur est ancré en bas de fenêtre : un
  // compte rendu se parcourt sur des dizaines d'écrans, un lecteur posé dans le
  // fil disparaîtrait au premier défilement.
  const [seconde, setSeconde] = React.useState<number | null>(null);

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
      <Stack spacing={1} mb={2}>
        <Typography variant="h4">{title}</Typography>
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
      <Box sx={{ mt: 2 }}>
        <DebateTimeline
          paragraphes={paragraphes}
          onLire={video ? setSeconde : undefined}
        />
      </Box>

      {video && seconde !== null ? (
        <LecteurSeance
          video={video}
          seconde={seconde}
          legende={title}
          onFermer={() => setSeconde(null)}
        />
      ) : null}
    </>
  );
};
