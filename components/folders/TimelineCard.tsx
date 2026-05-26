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
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";

import { CardLayout } from "@/components/folders/CardLayout";
import StatusChip from "@/components/StatusChip";
import { ActeLegislatif, Scrutin } from "@prisma/client";
import { groupActs } from "@/repository/Acts";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDebats } from "@/data/getDebats";
import { getDocument } from "@/data/getDocument";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

type Outcome = {
  label: string;
  date: Date | null;
  /** "positive" → adoptée/promulguée (vert) ; "negative" → rejetée (rouge) */
  variant: "positive" | "negative";
};

function detectOutcome(acts: ActeLegislatif[]): Outcome | null {
  // Promulgation (lois)
  const prom = acts.find((a) => a.codeActe?.startsWith("PROM"));
  if (prom) {
    return { label: "Promulguée", date: prom.dateActe ?? null, variant: "positive" };
  }

  // Décision en lecture unique (résolutions)
  const decision = acts.find(
    (a) => a.codeActe === "ANLUNI-DEBATS-DEC" && a.adoption !== null,
  );
  if (decision) {
    return decision.adoption
      ? { label: "Adoptée", date: decision.dateActe ?? null, variant: "positive" }
      : { label: "Rejetée", date: decision.dateActe ?? null, variant: "negative" };
  }

  // Décision en lecture définitive (lois après navette)
  const decisionDef = acts.find(
    (a) => a.codeActe === "ANLDEF-DEBATS-DEC" && a.adoption !== null,
  );
  if (decisionDef) {
    return decisionDef.adoption
      ? { label: "Adoptée", date: decisionDef.dateActe ?? null, variant: "positive" }
      : { label: "Rejetée", date: decisionDef.dateActe ?? null, variant: "negative" };
  }

  return null;
}

const OutcomeTimelineItem = ({
  outcome,
  isMobile,
}: {
  outcome: Outcome;
  isMobile: boolean;
}) => {
  const isPositive = outcome.variant === "positive";
  const color = isPositive ? "#16a34a" : "#dc2626";
  const bg = isPositive ? "#dcfce7" : "#fee2e2";
  const textColor = isPositive ? "#166534" : "#991b1b";

  return (
    <TimelineItem>
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
              {formatDate(outcome.date)}
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
            bgcolor: color,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff",
            zIndex: 1,
          }}
        >
          {isPositive ? (
            <CheckIcon sx={{ fontSize: isMobile ? 22 : 26 }} />
          ) : (
            <CloseIcon sx={{ fontSize: isMobile ? 22 : 26 }} />
          )}
        </Box>
      </TimelineSeparator>

      <TimelineContent sx={{ pr: 0 }}>
        {isMobile && (
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mt: 1 }}
          >
            {formatDate(outcome.date)}
          </Typography>
        )}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minHeight: 50,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.8,
              bgcolor: bg,
              color: textColor,
              px: 1.5,
              py: 0.6,
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "0.9rem",
              letterSpacing: "0.02em",
            }}
          >
            {outcome.label}
          </Box>
        </Box>
      </TimelineContent>
    </TimelineItem>
  );
};

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

function getScrutinStatus(code: string | null) {
  if (code) {
    const s = code.toLowerCase().trim();
    if (s === "adopté" || s === "adopte")
      return { status: "validated" as const, label: "Adopté" };
    if (s === "rejeté" || s === "rejete")
      return { status: "refused" as const, label: "Rejeté" };
  }
  return { status: "review" as const, label: "Résultat" };
}

const VoteIndicator = ({
  voteRefs,
  dossierUid,
  legislature,
  acteUid,
}: {
  voteRefs: { voteRef: Scrutin | null }[];
  dossierUid: string;
  legislature: string;
  acteUid: string;
}) => {
  const theme = useTheme();

  const validVotes = React.useMemo(() => {
    return voteRefs?.filter((v) => v.voteRef != null) ?? [];
  }, [voteRefs]);
  if (validVotes.length === 0) return null;

  // On prend le dernier vote (souvent le plus pertinent s'il y en a plusieurs)
  const scrutin = validVotes[validVotes.length - 1].voteRef!;
  const { status, label } = getScrutinStatus(scrutin.code);
  const linkHref = `/${legislature}/dossier/${dossierUid}/votes?acteId=${acteUid}`;

 const TooltipContent = (
    <Box
      sx={{
        p: 2,
        bgcolor: "background.paper", // Fond clair
        boxShadow: theme.shadows[2], // Ombre portée plus marquée
        borderRadius: 1, // Bordures arrondies
        maxWidth: 300, // Largeur maximale
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        display="block"
        mb={1.5}
        color="text.primary" // Couleur de texte principale
      >
        {scrutin.titre}
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack alignItems="center">
          <Typography variant="h6" sx={{ color: "success.main", fontWeight: "bold" }}>
            {scrutin.pour}
          </Typography>
          <Typography variant="caption" color="text.secondary">Pour</Typography>
        </Stack>
        <Stack alignItems="center">
          <Typography variant="h6" sx={{ color: "error.main", fontWeight: "bold" }}>
            {scrutin.contre}
          </Typography>
          <Typography variant="caption" color="text.secondary">Contre</Typography>
        </Stack>
        <Stack alignItems="center">
          <Typography variant="h6" sx={{ color: "text.secondary", fontWeight: "bold" }}>
            {scrutin.abstentions}
          </Typography>
          <Typography variant="caption" color="text.secondary">Abst.</Typography>
        </Stack>
      </Stack>
      
      <Typography
        variant="caption"
        component={Link} // Le texte devient un lien
        href={linkHref}
        sx={{
          display: "block",
          textAlign: "center",
          color: "primary.main",
          textDecoration: "none",
          fontWeight: 500,
          "&:hover": {
            textDecoration: "underline",
          },
        }}
      >
        Cliquez pour voir le détail du vote
      </Typography>
    </Box>
  );

  return (
    <Link
      href={linkHref}
      passHref
      style={{ textDecoration: 'none' }} // Suppression du soulignement sur le lien global
    >
      <Tooltip
        title={TooltipContent}
        arrow
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "transparent", // Rend le conteneur du tooltip transparent pour laisser voir notre Box stylisée
              p: 0, // Supprime le padding par défaut du tooltip
            },
          },
          arrow: {
            sx: {
              color: "background.paper", // Couleur de la flèche assortie au fond de notre Box
            },
          },
        }}
      >
        <Box component="span" sx={{ display: "inline-block", cursor: "pointer" }}>
          <StatusChip
            label={label}
            status={status}
            size="small"
            clickable
            sx={{
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          />
        </Box>
      </Tooltip>
    </Link>
  );
};

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

export const TimelineCard = ({
  actesLegislatifs,
  dossierUid,
  legislature,
}: {
    actesLegislatifs: (ActeLegislatif & {
    voteRefs?: { voteRef: Scrutin }[];
  })[];
  dossierUid: string;
  legislature: string;
}) => {
  const theme = useTheme();
  // On considère mobile tout ce qui est en dessous de 'sm' (600px)
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { rootIds, actsLookup } = groupActs(actesLegislatifs);
  const outcome = React.useMemo(
    () => detectOutcome(actesLegislatifs),
    [actesLegislatifs],
  );
  const [expandedLvl2, setExpandedLvl2] = React.useState<
    Record<string, boolean>
  >({});

  // Collect all unique document UIDs from acts
  const documentUids = React.useMemo(() => {
    const uids = new Set<string>();
    actesLegislatifs.forEach((act) => {
      if (act.texteAdopteRefUid) uids.add(act.texteAdopteRefUid);
      if (act.texteAssocieRefUid) uids.add(act.texteAssocieRefUid);
    });
    return Array.from(uids);
  }, [actesLegislatifs]);

  // Pre-fetch all documents to check which have PDFs
  const { data: documentsMap } = useQuery({
    queryKey: ["dossier-documents", dossierUid, documentUids],
    queryFn: async () => {
      const docs = await Promise.all(
        documentUids.map((uid) => getDocument(uid))
      );
      const map: Record<string, boolean> = {};
      documentUids.forEach((uid, index) => {
        map[uid] = docs[index] != null; // true if document has pdfUrl
      });
      return map;
    },
    enabled: documentUids.length > 0,
  });

  const hasDocument = (act: any) => {
    if (!documentsMap) return false;
    return !!(
      (act.texteAdopteRefUid && documentsMap[act.texteAdopteRefUid]) ||
      (act.texteAssocieRefUid && documentsMap[act.texteAssocieRefUid])
    );
  };

  const openActDocument = async (act: any) => {
    try {
      const candidateUids = [act.texteAdopteRefUid, act.texteAssocieRefUid].filter(Boolean);
      for (const uid of candidateUids) {
        const document = await getDocument(uid as string);
        if (document?.pdfUrl) {
          window.open(document.pdfUrl, "_blank");
          return;
        }
      }
    } catch (e) {
      // ignore errors silently
      // console.error(e);
    }
  };

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
        {rootIds?.map((rootId) => {
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

                      const debatUid =
                        lvl2Act.reunionRefUid &&
                        agendatsToDebatMap[lvl2Act.reunionRefUid];
                      const link = debatUid
                        ? `/${legislature}/dossier/${dossierUid}/debat/${debatUid}`
                        : undefined;

                      const dateLvl2 = formatDate(lvl2Act.date);
                      const lvl2Title = `${lvl2Act.nomCanonique} ${
                        lvl2Act.date ? `(${dateLvl2})` : ""
                      }`;

                      const voteRefs = (lvl2Act as any).voteRefs;

                      return (
                        <Box key={lvl2Act.uid} sx={{ mb: 2 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            sx={{ mb: 0.8 }}
                          >
                            <Typography
                              variant="body2"
                              component={link ? Link : "p"}
                              href={link}
                              sx={{
                                display: "block",
                                color: link ? "primary.main" : "text.primary",
                                fontWeight: 500,
                                textDecoration: "none",
                                lineHeight: 1.4,
                                cursor: link ? "pointer" : "default",
                                "&:hover": {
                                  textDecoration: link ? "underline" : "none",
                                },
                              }}
                            >
                              {lvl2Title}
                            </Typography>
                            {hasDocument(lvl2Act) && (
                              <Box
                                onClick={() => openActDocument(lvl2Act)}
                                sx={{
                                  ml: 1,
                                  mb: 0.7,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "1px solid",
                                  borderColor: "grey.300",
                                  borderRadius: 2,
                                  p: 0.4,
                                }}
                                title="Ouvrir le document"
                              >
                                <Image src="/documents.png" alt="Doc" width={18} height={18} />
                              </Box>
                            )}
                            <VoteIndicator
                              voteRefs={voteRefs}
                              dossierUid={dossierUid}
                              legislature={legislature}
                              acteUid={lvl2Act.uid}
                            />
                          </Stack>

                          {displayedLvl3Uids.map((lvl3Uid) => {
                            const lvl3Act = actsLookup[lvl3Uid];
                            const date3Str = formatDate(lvl3Act.dateActe);
                            const lvl3VoteRefs = (lvl3Act as any).voteRefs;

                            return (
                            <Stack
                                key={lvl3Uid}
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ ml: 2, mt: 0.4 }}
                              >
                                <Typography
                                  variant="caption"
                                  component="p"
                                  sx={{
                                    color: "grey.600",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  • {lvl3Act.nomCanonique}
                                  {lvl3Act.dateActe && ` (${date3Str})`}
                                </Typography>
                               {hasDocument(lvl3Act) && (
                                  <Box
                                    onClick={() => openActDocument(lvl3Act)}
                                    sx={{
                                      ml: 1,
                                      cursor: "pointer",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      border: "1px solid",
                                      borderColor: "grey.300",
                                      borderRadius: 2,
                                      p: 0.3,
                                    }}
                                    title="Ouvrir le document"
                                  >
                                    <Image src="/documents.png" alt="Doc" width={16} height={16} />
                                  </Box>
                                )}
                                <VoteIndicator
                                  voteRefs={lvl3VoteRefs}
                                  dossierUid={dossierUid}
                                  legislature={legislature}
                                  acteUid={lvl3Act.uid}
                                />
                              </Stack>
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
        })}
        {outcome && <OutcomeTimelineItem outcome={outcome} isMobile={isMobile} />}
      </Timeline>
    </CardLayout>
  );
};
