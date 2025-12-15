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

import { CardLayout } from "@/components/folders/CardLayout";

import { ActeLegislatif } from "@prisma/client";

import { groupActs } from "@/repository/Acts";
import { sortActDate } from "../utils";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDebats } from "@/data/getDebats";

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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              height: 50,
            }}
          >
            <Typography variant="body2" fontWeight="light">
              {date
                ? date.toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "?"}
            </Typography>
          </Box>
        </TimelineOppositeContent>
        <TimelineSeparator sx={{ minWidth: 50 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              my: 1,
              mx: "auto",
              borderColor: "grey.400",
              borderWidth: 2,
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {logo && (
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.size}
                height={logo.size}
                style={{
                  width: logo.size,
                  height: logo.size,
                }}
              />
            )}
          </Box>

          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              height: 50,
            }}
          >
            <Typography variant="body1" fontWeight="bold">
              {title}
            </Typography>
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
}: React.PropsWithChildren<{ act: ActeLegislatif; groupDate?: Date }>) => {
  const title = act.nomCanonique || act.codeActe;
  const date = act.dateActe ?? groupDate;
  return (
    <TimelineItem key={act.uid}>
      <TimelineOppositeContent />
      <TimelineSeparator sx={{ minWidth: 50 }}>
        <TimelineConnector sx={{ height: 10, flexGrow: 0 }} />
        <Box
          sx={{
            bgcolor: "black",
            width: 8,
            height: 8,
            my: 0.5,
            mx: "auto",
            borderRadius: "50%",
          }}
        />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <Typography variant="body1">{title}</Typography>
        <Typography
          variant="caption"
          component="p"
          fontWeight="light"
          sx={{
            textTransform: "capitalize",
            color: "grey.600",
          }}
        >
          {date
            ? date.toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "?"}
        </Typography>
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
      <Timeline
        sx={{
          [`& .${timelineOppositeContentClasses.root}`]: {
            flex: 0.2,
          },
        }}
      >
        {rootIds?.map((rootId) => {
          const act = actsLookup[rootId];
          return (
            <TimelineItemLvl0 key={act.uid} act={act} groupDate={act.date}>
              {act.children.map((lvl1Uid) => {
                const lvl1Act = actsLookup[lvl1Uid];
                return (
                  <TimelineItemLvl1
                    key={lvl1Act.uid}
                    act={lvl1Act}
                    groupDate={lvl1Act.date}
                  >
                    {lvl1Act.children.map((lvl2Uid) => {
                      const lvl2Act = actsLookup[lvl2Uid];

                      const debatUid =
                        lvl2Act.reunionRefUid &&
                        agendatsToDebatMap[lvl2Act.reunionRefUid];

                      const link = debatUid
                        ? `/${legislature}/dossier/${dossierUid}/debat/${debatUid}`
                        : undefined;
                      const title = `${lvl2Act.nomCanonique}${
                        lvl2Act.date
                          ? ` du ${lvl2Act.date.toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}`
                          : ""
                      }`;

                      return (
                        <div key={lvl2Act.uid}>
                          <Typography
                            variant="caption"
                            component={link ? Link : "p"}
                            fontWeight="light"
                            href={link}
                            sx={{ my: 1.5 }}
                          >
                            {title}
                          </Typography>

                          {lvl2Act.children.map((lvl3Uid) => {
                            const lvl3Act = actsLookup[lvl3Uid];
                            const date = lvl3Act.dateActe;
                            const title = `${lvl3Act.nomCanonique}${
                              date
                                ? ` du ${date.toLocaleDateString("fr-FR", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })}`
                                : ""
                            }`;

                            return (
                              <Typography
                                variant="caption"
                                component="p"
                                fontWeight="light"
                                key={lvl3Act.uid}
                                sx={{ my: 0, ml: 4 }}
                              >
                                {title}
                              </Typography>
                            );
                          })}
                        </div>
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
