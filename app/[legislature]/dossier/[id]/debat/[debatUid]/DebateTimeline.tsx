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

import TimelineItem from "@mui/lab/TimelineItem"; // Import ajouté
import TimelineSeparator from "@mui/lab/TimelineSeparator"; // Import ajouté
import TimelineConnector from "@mui/lab/TimelineConnector"; // Import ajouté
import TimelineContent from "@mui/lab/TimelineContent"; // Import ajouté
import TimelineDot from "@mui/lab/TimelineDot"; // Import ajouté

type DebateTimelineProps = {
  paragraphes: Paragraphe[];
};

const connectorStyle = {
  bgcolor: "transparent",
  borderLeft: "1px dashed",
  borderColor: "grey.400",
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
      ({ id, codeGrammaire, acteurRefUid, roleDebat, texte }, index) => {
        
        const safeId = id ? id.toString() : `fallback-id-${index}`;
        const itemKey = `${safeId}-${index}`;

        switch (codeGrammaire) {
          case "PAROLE_GENERIQUE":
          case "INTERRUPTION_1_10":
            return (
              <ParoleItem
                key={id}
                acteurUid={acteurRefUid}
                roleDebat={roleDebat}
                texte={texte}
              />
            );

          case "TITRE_TEXTE_DISCUSSION":
            return (
              <TimelineItem key={itemKey}>
                <TimelineSeparator sx={{ minWidth: 50 }}>
                  <TimelineConnector sx={connectorStyle} />
                  <TimelineDot sx={{ bgcolor: "black" }} />
                  <TimelineConnector sx={connectorStyle} />
                </TimelineSeparator>
                <TimelineContent sx={{ my: "auto" }}>
                  <Typography
                    variant="h1"
                    component="h2"
                    dangerouslySetInnerHTML={{
                      __html: cleanText(texte ?? "", true),
                    }}
                  />
                </TimelineContent>
              </TimelineItem>
            );

          case "SOUS_TITRE_TEXTE_DISCUSSION":
            return (
              <TimelineItem key={itemKey}>
                <TimelineSeparator sx={{ minWidth: 50 }}>
                  <TimelineConnector sx={connectorStyle} />
                  <TimelineDot variant="outlined" />
                  <TimelineConnector sx={connectorStyle} />
                </TimelineSeparator>
                <TimelineContent sx={{ my: "auto" }}>
                  <Typography
                    variant="h3"
                    component="h3"
                    dangerouslySetInnerHTML={{
                      __html: cleanText(texte ?? "", true),
                    }}
                  />
                </TimelineContent>
              </TimelineItem>
            );
          case "ODJ_APPEL_DISCUSSION":
            return (
              <TimelineItem key={itemKey}>
                <TimelineSeparator sx={{ minWidth: 50 }}>
                  <TimelineConnector sx={connectorStyle} />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography
                    component="p"
                    variant="body2"
                    sx={{ fontStyle: "italic", color: "grey.700" }}
                    dangerouslySetInnerHTML={{ __html: cleanText(texte ?? "") }}
                  />
                </TimelineContent>
              </TimelineItem>
            );
          default:
            if (codeGrammaire && SUMMARY_CODES.has(codeGrammaire)) {
              return <SectionItem key={itemKey} id={safeId} title={texte} />;
            }
            return texte ? (
              <SubSectionItem
                key={id}
                title={texte}
                withoutConnector={codeGrammaire === "FIN_SEAN_1_0"}
              />
            ) : null;
        }
      }
    )}
  </Timeline>
);
