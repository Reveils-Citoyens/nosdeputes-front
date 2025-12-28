"use client";

import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from "@mui/lab/TimelineOppositeContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { CardLayout } from "@/components/folders/CardLayout";

import { ActeLegislatif } from "@prisma/client";

import { groupActs } from "@/repository/Acts";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDebats } from "@/data/getDebats";

const dashedConnectorStyle = {
  bgcolor: "transparent",
  borderLeft: "2px dashed",
  borderColor: "grey.400",
};

function getLogoPathFromCode(code: string) {
  if (code.startsWith("AN")) {
    return { src: "/LogoAN.svg", alt: "Assemblée Nationale", size: 30 };
  }
  if (code.startsWith("SN")) {
    return { src: "/LogoSN.svg", alt: "Sénat", size: 44 };
  }
  if (code.startsWith("CC")) {
    return { src: "/LogoCC.svg", alt: "Conseil Consitiutionel", size: 44 };
  }
  return undefined;
}

const TimelineItemLvl0 = ({
  act,
  groupDate,
  children,
}: React.PropsWithChildren<{
  act: ActeLegislatif;
  groupDate?: Date;
}>) => {
  const title = act.nomCanonique || act.codeActe;
  const date = act.dateActe ?? groupDate;
  const logo = getLogoPathFromCode(act.codeActe);
  return (
    <React.Fragment>
      <TimelineItem>
        <TimelineOppositeContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", height: 50 }}>
            <Typography variant="body2" fontWeight="light">
              {date ? date.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" }) : "?"}
            </Typography>
          </Box>
        </TimelineOppositeContent>
        <TimelineSeparator sx={{ minWidth: 50 }}>
          <Box sx={{ width: 44, height: 44, my: 1, mx: "auto", borderColor: "grey.400", borderWidth: 2, borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
            {logo ? <Image src={logo.src} alt={logo.alt} width={logo.size} height={logo.size} /> : act.codeActe}
          </Box>
          <TimelineConnector sx={dashedConnectorStyle} />
        </TimelineSeparator>
        <TimelineContent>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", height: 50 }}>
            <Typography variant="body1" fontWeight="bold">{title}</Typography>
          </Box>
        </TimelineContent>
      </TimelineItem>
      {children}
    </React.Fragment>
  );
};

const TimelineItemLvl1 = ({
  act,
  groupDate,
  children,
}: React.PropsWithChildren<{
  act: ActeLegislatif;
  groupDate?: Date;
}>) => {
  const title = act.nomCanonique || act.codeActe;
  const date = act.dateActe ?? groupDate;
  return (
    <TimelineItem>
      <TimelineOppositeContent>
        <Typography variant="caption" fontWeight="light" sx={{ color: "grey.600", display: "block", mt: 1 }}>
          {date ? date.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" }) : "?"}
        </Typography>
      </TimelineOppositeContent>
      <TimelineSeparator sx={{ minWidth: 50 }}>
        <TimelineConnector sx={{ ...dashedConnectorStyle, height: 14, flexGrow: 0 }} />
        <Box sx={{ bgcolor: "black", width: 8, height: 8, my: 0.5, mx: "auto", borderRadius: "50%" }} />
        <TimelineConnector sx={dashedConnectorStyle} />
      </TimelineSeparator>
      <TimelineContent sx={{ pb: 2 }}> 
        <Typography variant="body1" sx={{ mb: 2, mt: 0.5, fontWeight: 500 }}>{title}</Typography>
        {children}
      </TimelineContent>
    </TimelineItem>
  );
};

export const TimelineCard = ({
  actesLegislatifs,
  dossierUid,
  legislature,
}: {
  actesLegislatifs: ActeLegislatif[];
  dossierUid: string;
  legislature: string;
}) => {
  const { rootIds, actsLookup } = groupActs(actesLegislatifs);
  const [expandedLvl2, setExpandedLvl2] = React.useState<Record<string, boolean>>({});

  const { data: debats } = useQuery({
    queryKey: ["debats", dossierUid],
    queryFn: async () => await getDebats(dossierUid),
  });

  const agendatsToDebatMap: Record<string, string> = {};
  debats?.forEach((debat) => {
    if (debat.reunionRefUid && debat._count.paragraphes > 0) {
      agendatsToDebatMap[debat.reunionRefUid] = debat.uid;
    }
  });

  return (
    <CardLayout title="Chronologie du dossier">
      <Timeline sx={{ [`& .${timelineOppositeContentClasses.root}`]: { flex: 0.2 } }}>
        {rootIds?.map((rootId) => {
          const act = actsLookup[rootId];
          return (
            <TimelineItemLvl0 key={act.uid} act={act} groupDate={act.date}>
              {act.children.map((lvl1Uid) => {
                const lvl1Act = actsLookup[lvl1Uid];

                return (
                  <TimelineItemLvl1 key={lvl1Act.uid} act={lvl1Act} groupDate={lvl1Act.date}>
                    {lvl1Act.children.map((lvl2Uid) => {
                      const lvl2Act = actsLookup[lvl2Uid];
                      const allLvl3Uids = lvl2Act.children;
                      const isExpanded = expandedLvl2[lvl2Uid];
                      const displayedLvl3Uids = isExpanded ? allLvl3Uids : allLvl3Uids.slice(0, 6);

                      const debatUid = lvl2Act.reunionRefUid && agendatsToDebatMap[lvl2Act.reunionRefUid];
                      const link = debatUid ? `/${legislature}/dossier/${dossierUid}/debat/${debatUid}` : undefined;
                      const lvl2Title = `${lvl2Act.nomCanonique}${lvl2Act.date ? ` du ${lvl2Act.date.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" })}` : ""}`;

                      return (
                        <Box key={lvl2Act.uid} sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            component={link ? Link : "p"}
                            href={link} 
                            sx={{ 
                              display: "block", 
                              color: link ? "primary.main" : "text.primary",
                              fontWeight: 500,
                              textDecoration: "none",
                              mb: 0.8,
                              cursor: link ? "pointer" : "default",
                              "&:hover": { textDecoration: link ? "underline" : "none" }
                            }}
                          >
                            {lvl2Title}
                          </Typography>

                          {displayedLvl3Uids.map((lvl3Uid) => {
                            const lvl3Act = actsLookup[lvl3Uid];
                            const date3 = lvl3Act.dateActe;
                            return (
                              <Typography key={lvl3Uid} variant="caption" component="p" sx={{ ml: 2, color: "grey.600", mt: 0.4, lineHeight: 1.4 }}>
                                • {lvl3Act.nomCanonique}
                                {date3 && ` (${date3.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' })})`}
                              </Typography>
                            );
                          })}

                          {allLvl3Uids.length > 6 && !isExpanded && (
                            <Button
                              size="small"
                              onClick={() => setExpandedLvl2(prev => ({ ...prev, [lvl2Uid]: true }))}
                              sx={{ textTransform: "none", fontSize: "0.7rem", ml: 2, p: 0, mt: 1, minWidth: 0, display: 'block' }}
                            >
                              + {allLvl3Uids.length - 6} autres actes...
                            </Button>
                          )}
                        </Box>
                      );
                    })}
                  </TimelineItemLvl1>
                );
              })}
            </TimelineItemLvl0>
          );
        })}
      </Timeline>
    </CardLayout>
  );
};