import React from "react";

import Timeline from "@mui/lab/Timeline";
import ParoleItem from "@/components/folders/DebatTab/ParoleItem";
import SectionItem from "@/components/folders/DebatTab/SectionItem";
import { timelineItemClasses } from "@mui/lab/TimelineItem";
import SubSectionItem from "@/components/folders/DebatTab/SubSectionItem";
import { Typography } from "@mui/material";
import { cleanText } from "@/components/folders/DebatTab/cleanText";
import { Paragraphe } from "@prisma/client";
import { SUMMARY_CODES } from "@/components/const";
import { estPriseDeParole } from "@/components/folders/DebatTab/estPriseDeParole";

type DebateTimelineProps = {
  paragraphes: Paragraphe[];
  /** Absent quand la séance n'a pas de vidéo : aucun bouton ne s'affiche alors. */
  onLire?: (seconde: number) => void;
};
export const DebateTimeline = React.memo(function DebateTimeline({
  paragraphes,
  onLire,
}: DebateTimelineProps) {
  return (
    <Timeline
      sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0,
        },
      }}
    >
      {paragraphes.map((paragraphe, index) => {
        const {
          uid,
          codeGrammaire,
          acteurRefUid,
          orateur,
          roleDebat,
          texte,
          stime,
          ordreAbsoluSeance,
        } = paragraphe;
        if (estPriseDeParole(paragraphe)) {
          return (
            <ParoleItem
              key={uid}
              id={
                ordreAbsoluSeance != null ? `p-${ordreAbsoluSeance}` : undefined
              }
              acteurUid={acteurRefUid}
              orateur={orateur}
              roleDebat={roleDebat}
              texte={texte}
              isFirst={index === 0}
              seconde={stime != null ? Number(stime) : null}
              onLire={onLire}
            />
          );
        }
        switch (codeGrammaire) {
          case "TITRE_TEXTE_DISCUSSION":
            return (
              <Typography
                key={uid}
                variant="h1"
                component="h2"
                sx={{ mt: 1.5, mb: 0.75, lineHeight: 1.25 }}
                dangerouslySetInnerHTML={{
                  __html: cleanText(texte ?? "", true),
                }}
              />
            );
          case "SOUS_TITRE_TEXTE_DISCUSSION":
            return (
              <Typography
                key={uid}
                variant="h3"
                component="h3"
                sx={{ mt: 1, mb: 0.5, lineHeight: 1.3 }}
                dangerouslySetInnerHTML={{
                  __html: cleanText(texte ?? "", true),
                }}
              />
            );
          case "ODJ_APPEL_DISCUSSION":
            return (
              <Typography
                key={uid}
                component="p"
                sx={{ mt: 0.5, mb: 1 }}
                dangerouslySetInnerHTML={{ __html: cleanText(texte ?? "") }}
              />
            );
          default:
            if (SUMMARY_CODES.has(codeGrammaire!)) {
              return (
                <SectionItem key={uid} id={uid.toString()} title={texte} />
              );
            }
            return texte ? (
              <SubSectionItem
                key={uid}
                title={texte}
                withoutConnector={codeGrammaire === "FIN_SEAN_1_0"}
              />
            ) : null;
          // return (
          //   <div
          //     key={uid}
          //     onClick={() => {
          //       console.log(other);
          //     }}
          //   >
          //     <h5>{codeGrammaire}</h5>
          //     <h6>{other.codeParole}</h6>
          //     <p dangerouslySetInnerHTML={{ __html: texte }} />
          //   </div>
          // );
        }
      })}
    </Timeline>
  );
});
