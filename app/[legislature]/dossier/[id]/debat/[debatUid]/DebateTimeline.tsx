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

type DebateTimelineProps = {
  paragraphes: Paragraphe[];
};
export const DebateTimeline = ({ paragraphes }: DebateTimelineProps) => (
  <Timeline
    sx={{
      [`& .${timelineItemClasses.root}:before`]: {
        flex: 0,
        padding: 0,
      },
    }}
  >
    {paragraphes.map(
      ({ uid, codeGrammaire, acteurRefUid, roleDebat, texte }, index) => {
        switch (codeGrammaire) {
          case "PAROLE_GENERIQUE":
          case "INTERRUPTION_1_10":
            return (
              <ParoleItem
                key={uid}
                acteurUid={acteurRefUid}
                roleDebat={roleDebat}
                texte={texte}
                isFirst={index === 0}
              />
            );

          case "TITRE_TEXTE_DISCUSSION":
            return (
              <Typography
                key={uid}
                variant="h1"
                component="h2"
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
                dangerouslySetInnerHTML={{ __html: cleanText(texte ?? "") }}
              />
            );
          default:
            if (SUMMARY_CODES.has(codeGrammaire!)) {
              return <SectionItem key={uid} id={uid.toString()} title={texte} />;
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
      }
    )}
  </Timeline>
);
