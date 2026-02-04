"use client";

import * as React from "react";
import Timeline from "@mui/lab/Timeline";
import TimelineItem, { timelineItemClasses } from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent, {
  timelineOppositeContentClasses,
} from "@mui/lab/TimelineOppositeContent";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme, useMediaQuery } from "@mui/material";

import { CardLayout } from "@/components/folders/CardLayout";
import { ActeLegislatif, Agenda } from "@prisma/client";
import { groupActs } from "@/repository/Acts";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDebats } from "@/data/getDebats";

// Utilitaire pour formater la date proprement
const formatDate = (date?: Date | null) => {
  if (!date) return "?";
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  isMobile,
}: React.PropsWithChildren<{
  act: ActeLegislatif;
  groupDate?: Date;
  isMobile: boolean;
}>) => {
  const title = act.nomCanonique || act.codeActe;
  const logo = getLogoPathFromCode(act.codeActe);
  const dateStr = formatDate(act.dateActe ?? groupDate);

  return (
    <React.Fragment>
      <TimelineItem>
        {/* Sur Desktop, date à gauche. Sur mobile, on cache. */}
        {!isMobile && (
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
                {dateStr}
              </Typography>
            </Box>
          </TimelineOppositeContent>
        )}

        <TimelineSeparator sx={{ minWidth: isMobile ? 40 : 50 }}>
          <Box
            sx={{
              width: isMobile ? 36 : 44,
              height: isMobile ? 36 : 44,
              my: 1,
              mx: "auto",
              borderColor: "grey.400",
              borderWidth: 2,
              borderRadius: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              bgcolor: "white",
              zIndex: 1,
            }}
          >
            {logo ? (
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.size}
                height={logo.size}
                style={{
                  width: isMobile ? logo.size * 0.8 : logo.size,
                  height: isMobile ? logo.size * 0.8 : logo.size,
                }}
              />
            ) : (
              act.codeActe
            )}
          </Box>
          <TimelineConnector />
        </TimelineSeparator>

        <TimelineContent sx={{ pr: 0 }}>
          {/* Sur Mobile, date au-dessus du titre */}
          {isMobile && (
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              {dateStr}
            </Typography>
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              minHeight: 50,
            }}
          >
            <Typography
              variant="body1"
              fontWeight="bold"
              sx={{ lineHeight: 1.2 }}
            >
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
  isMobile,
}: React.PropsWithChildren<{
  act: ActeLegislatif;
  groupDate?: Date;
  isMobile: boolean;
}>) => {
  const title = act.nomCanonique || act.codeActe;
  const dateStr = formatDate(act.dateActe ?? groupDate);

  return (
    <TimelineItem>
      {/* Desktop seulement */}
      {!isMobile && (
        <TimelineOppositeContent>
          <Typography
            variant="caption"
            fontWeight="light"
            sx={{ color: "grey.600", display: "block", mt: 1 }}
          >
            {dateStr}
          </Typography>
        </TimelineOppositeContent>
      )}

      <TimelineSeparator sx={{ minWidth: isMobile ? 40 : 50 }}>
        <TimelineConnector sx={{ height: 14, flexGrow: 0 }} />
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

      <TimelineContent sx={{ pb: 2, pr: 0 }}>
        <Typography variant="body1" sx={{ mb: 1, mt: 0.5, fontWeight: 500 }}>
          {title}
        </Typography>

        {/* Mobile seulement : Date sous le titre principal de l'étape */}
        {isMobile && (
          <Typography
            variant="caption"
            fontWeight="light"
            sx={{ color: "grey.600", display: "block", mb: 2, mt: -0.5 }}
          >
            {dateStr}
          </Typography>
        )}

        {children}
      </TimelineContent>
    </TimelineItem>
  );
};

const debatSeanceActeCodes = new Set([
  "AN1-DEBATS-SEANCE",
  "AN2-DEBATS-SEANCE",
  "AN3-DEBATS-SEANCE",
  "AN21-DEBATS-SEANCE",
  "ANLDEF-DEBATS-SEANCE",
  "ANLUNI-DEBATS-SEANCE",
  "ANNLEC-DEBATS-SEANCE",
]);

const comReunionActeCodes = new Set([
  "AN1-COM-FOND-REUNION",
  "AN1-COM-AVIS-REUNION",
  "AN2-COM-FOND-REUNION",
  "AN2-COM-AVIS-REUNION",
  "AN3-COM-FOND-REUNION",
  "AN3-COM-AVIS-REUNION",
  "ANLDEF-COM-FOND-REUNION",
  "ANLUNI-COM-CAE-REUNION",
  "ANLUNI-COM-FOND-REUNION",
  "ANNLEC-COM-AVIS-REUNION",
  "ANNLEC-COM-FOND-REUNION",
]);


export const TimelineCard = ({
  actesLegislatifs,
  dossierUid,
  legislature,
}: {
  actesLegislatifs: ActeLegislatif[];
  dossierUid: string;
  legislature: string;
}) => {
  const theme = useTheme();
  // On considère mobile tout ce qui est en dessous de 'sm' (600px)
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { rootIds, actsLookup } = groupActs(actesLegislatifs);
  const [expandedLvl2, setExpandedLvl2] = React.useState<
    Record<string, boolean>
  >({});

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
        position={isMobile ? "right" : "right"} // 'Right' aligne le contenu à droite de la ligne
        sx={{
          p: 0,
          // Hack CSS important pour supprimer l'espace vide à gauche sur mobile
          [`& .${timelineItemClasses.root}:before`]: isMobile
            ? { flex: 0, padding: 0 }
            : { flex: 0.2 },
          [`& .${timelineOppositeContentClasses.root}`]: isMobile
            ? { display: "none" }
            : { flex: 0.2 },
        }}
      >
        {(() => {
          // Set pour tracker les agendaUids déjà affichés (éviter les duplicats)
          const displayedAgendaUids = new Set<string>();
          
          return rootIds?.map((rootId) => {
          const act = actsLookup[rootId];
          return (
            <TimelineItemLvl0
              key={act.uid}
              act={act}
              groupDate={act.date}
              isMobile={isMobile}
            >
              {act.children.map((lvl1Uid) => {
                const lvl1Act = actsLookup[lvl1Uid];

                return (
                  <TimelineItemLvl1
                    key={lvl1Act.uid}
                    act={lvl1Act}
                    groupDate={lvl1Act.date}
                    isMobile={isMobile}
                  >
                    {lvl1Act.children.map((lvl2Uid) => {
                      const lvl2Act = actsLookup[lvl2Uid];
                      const allLvl3Uids = lvl2Act.children;
                      const isExpanded = expandedLvl2[lvl2Uid];
                      const displayedLvl3Uids = isExpanded
                        ? allLvl3Uids
                        : allLvl3Uids.slice(0, 6);


                      
                      //
                      let link;
                      
                      if (debatSeanceActeCodes.has(lvl2Act.codeActe)) {
                        //
                        const agenda: Agenda = lvl2Act.agendaRef;
                        
                        // Skip si cet agenda a déjà été affiché
                        if (agenda?.uid && displayedAgendaUids.has(agenda.uid)) {
                          return null;
                        }
                        // on récupère les point odj associés à ce dossier législatif
                        const matchingPoints = agenda?.pointsOdj?.filter(
                          (point) => 
                            point.dossierLegislatifUid === lvl2Act.dossierRefUid
                        ) || [];
                        
                        if (matchingPoints.length === 0) {
                          console.log("Aucun point d'ordre du jour trouvé pour l'acte: ", lvl2Act.uid);
                          return null; // Skip cet élément
                        }

                        const hasTerminePoint = matchingPoints.some(
                          (point) => point.etat === "Terminé"
                        );

                        if (!hasTerminePoint) {
                          console.warn("Aucun point terminé trouvé pour l'acte: ", lvl2Act.uid);
                          return null; // Skip cet élément
                        }
                        
                        // Pour eviter les "dupliquats" d'acte qui pointent vers la meme reunion"
                        if (agenda?.uid) {
                          displayedAgendaUids.add(agenda.uid);
                        }
                        
                        // on utilise l'id de la reunion pour gérer la page debat (plus facile)
                        link = `/${legislature}/dossier/${dossierUid}/debat/${agenda.uid}`;
                      }
                      
                      const dateLvl2 = formatDate(lvl2Act.date);
                      const lvl2Title = `${lvl2Act.nomCanonique} ${
                        lvl2Act.date ? `(${dateLvl2})` : ""
                      }`;

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
                              lineHeight: 1.4,
                              cursor: link ? "pointer" : "default",
                              "&:hover": {
                                textDecoration: link ? "underline" : "none",
                              },
                            }}
                          >
                            {lvl2Title}
                          </Typography>

                          {displayedLvl3Uids.map((lvl3Uid) => {
                            const lvl3Act = actsLookup[lvl3Uid];
                            const date3Str = formatDate(lvl3Act.dateActe);

                            // link to CR de reunion de commission
                            // let link = undefined;
                            // if (comReunionActeCodes.has(lvl3Act.codeActe)) {
                            //   // Si acte de réunion de commission
                            //   // on filtre les point ordre du jour qui sont terminé
                            //   const finishedPodj = lvl3Act.agendaRef?.pointsOdj?.filter(
                            //     point => point.etat === "Terminé"
                            //   ) || [];
                            //   // on check le nombre de sujet à l'ordre du jour:
                            //   // const nOjd = finishedPodj.length;
                            //   // console.log("nOjd:", nOjd);
                            //   // Si on a un seul point à l'ordre du jour, on peut linker directement vers le débat
                            //   const debatUid = lvl3Act.agendaRef?.transcriptionRefUid || lvl3Act.agendaRef?.compteRenduRefUid;
                            //   link =
                            //     debatUid && (finishedPodj.length === 1)
                            //       ? `/${legislature}/dossier/${dossierUid}/debat/${debatUid}`
                            //       : undefined;
                            // }

                            return (
                              <Typography
                                key={lvl3Uid}
                                variant="caption"
                                component="p"
                                // component={link ? Link : "p"}
                                // href={link}
                                sx={{
                                  ml: 2,
                                  color: "grey.600",
                                  mt: 0.4,
                                  lineHeight: 1.4,
                                }}
                              >
                                • {lvl3Act.nomCanonique}
                                {lvl3Act.dateActe && ` (${date3Str})`}
                              </Typography>
                            );
                          })}

                          {allLvl3Uids.length > 6 && !isExpanded && (
                            <Button
                              size="small"
                              onClick={() =>
                                setExpandedLvl2((prev) => ({
                                  ...prev,
                                  [lvl2Uid]: true,
                                }))
                              }
                              sx={{
                                textTransform: "none",
                                fontSize: "0.7rem",
                                ml: 2,
                                p: 0,
                                mt: 1,
                                minWidth: 0,
                                display: "block",
                              }}
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
        });
        })()}
      </Timeline>
    </CardLayout>
  );
};
