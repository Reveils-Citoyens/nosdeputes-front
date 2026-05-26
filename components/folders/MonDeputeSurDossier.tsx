"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Avatar, Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import {
  CheckCircle as PourIcon,
  Cancel as ContreIcon,
  RemoveCircle as AbstentionIcon,
  RadioButtonUnchecked as NonVotantIcon,
  ArrowForward as ArrowForwardIcon,
  Edit as EditIcon,
  RecordVoiceOver as VoiceIcon,
  AssignmentInd as RoleIcon,
  CompareArrowsSharp as DissidentIcon,
} from "@mui/icons-material";
import { MON_DEPUTE_EVENT, readMonDepute, MonDepute } from "@/lib/monDepute";
import type {
  ActeurSurDossier,
  ActeurVoteSurDossier,
} from "@/data/getActeurSurDossier";

type Props = { dossierUid: string };

function deputePhotoUrl(uid: string): string {
  return `https://tricoteuses-assets.s3.fr-par.scw.cloud/photos/${uid.replace(
    /^PA/,
    ""
  )}_124x124.jpg`;
}

const POSITION_CONFIG = {
  pour: { label: "Pour", color: "#15803d", bg: "#dcfce7", Icon: PourIcon },
  contre: { label: "Contre", color: "#b91c1c", bg: "#fee2e2", Icon: ContreIcon },
  abstention: {
    label: "Abstention",
    color: "#a16207",
    bg: "#fef3c7",
    Icon: AbstentionIcon,
  },
  nonVotant: {
    label: "Non-votant",
    color: "#4b5563",
    bg: "#f3f4f6",
    Icon: NonVotantIcon,
  },
} as const;

export default function MonDeputeSurDossier({ dossierUid }: Props) {
  const [mounted, setMounted] = React.useState(false);
  const [depute, setDepute] = React.useState<MonDepute | null>(null);

  React.useEffect(() => {
    const sync = () => setDepute(readMonDepute());
    sync();
    setMounted(true);
    window.addEventListener(MON_DEPUTE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MON_DEPUTE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const { data, isLoading } = useQuery({
    enabled: mounted && !!depute,
    queryKey: ["depute-sur-dossier", depute?.uid, dossierUid],
    queryFn: async (): Promise<ActeurSurDossier> => {
      const res = await fetch(
        `/api/depute-sur-dossier?acteurUid=${encodeURIComponent(
          depute!.uid
        )}&dossierUid=${encodeURIComponent(dossierUid)}`
      );
      if (!res.ok) return { votes: [] };
      return res.json();
    },
  });

  if (!mounted || !depute) return null;

  return (
    <Box
      sx={{
        maxWidth: 960,
        width: "100%",
        mx: "auto",
        px: { xs: 2, md: 4 },
        mt: 2,
        mb: { xs: 3, md: 4 },
      }}
    >
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: "16px",
          bgcolor: "white",
          border: "1px solid",
          borderColor: "grey.200",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2, flexWrap: "wrap" }}
        >
          <Link
            href={`/depute/${depute.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Avatar
              src={deputePhotoUrl(depute.uid)}
              sx={{ width: 48, height: 48 }}
            >
              {depute.prenom[0]}
              {depute.nom[0]}
            </Avatar>
          </Link>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: "bold",
                letterSpacing: "0.1em",
                color: "grey.600",
                lineHeight: 1.2,
                display: "block",
              }}
            >
              Député de votre circonscription
            </Typography>
            <Link
              href={`/depute/${depute.slug}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                sx={{
                  color: "#1A1A1B",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {depute.prenom} {depute.nom}
              </Typography>
            </Link>
          </Box>

          {/* CTA aligné à droite avec l'avatar */}
          <Link
            href={`/depute/${depute.slug}`}
            style={{ textDecoration: "none", flexShrink: 0 }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                color: "#1A1A1B",
                fontWeight: "bold",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                whiteSpace: "nowrap",
                "&:hover": { color: "#333" },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Fiche complète
              </Box>
              <ArrowForwardIcon sx={{ fontSize: 14 }} />
            </Stack>
          </Link>
        </Stack>

        {/* Rôle (rapporteur) */}
        {data?.roles && data.roles.length > 0 && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              p: 1.5,
              mb: 2,
              borderRadius: "10px",
              bgcolor: "#FEF3C7",
              border: "1px solid",
              borderColor: "#FBD38D",
              alignItems: "center",
            }}
          >
            <RoleIcon sx={{ color: "#92400E", fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: "#92400E", fontWeight: 600 }}>
              {data.roles.map((r) => r.typeRapporteur).join(" · ")} de ce dossier
            </Typography>
          </Stack>
        )}

        {/* Stats rapides (amendements + interventions) */}
        {data && (data.amendements.total > 0 || data.interventionsCount > 0) && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <StatTile
              icon={<EditIcon sx={{ fontSize: 18 }} />}
              count={data.amendements.total}
              label={data.amendements.total > 1 ? "amendements déposés" : "amendement déposé"}
              detail={
                data.amendements.total > 0
                  ? [
                      data.amendements.adoptes > 0 && `${data.amendements.adoptes} adopté${data.amendements.adoptes > 1 ? "s" : ""}`,
                      data.amendements.rejetes > 0 && `${data.amendements.rejetes} rejeté${data.amendements.rejetes > 1 ? "s" : ""}`,
                      data.amendements.retires > 0 && `${data.amendements.retires} retiré${data.amendements.retires > 1 ? "s" : ""}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : null
              }
            />
            <StatTile
              icon={<VoiceIcon sx={{ fontSize: 18 }} />}
              count={data.interventionsCount}
              label={data.interventionsCount > 1 ? "interventions en séance" : "intervention en séance"}
            />
          </Stack>
        )}

        {/* Section votes */}
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight="bold"
            sx={{
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display: "block",
              mb: 1,
            }}
          >
            Votes sur ce dossier
          </Typography>

          {isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Chargement…
            </Typography>
          ) : !data || data.votes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucun vote enregistré sur ce dossier.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {data.votes.map((vote) => (
                <VoteRow key={vote.scrutinUid} vote={vote} />
              ))}
            </Stack>
          )}
        </Box>

      </Box>
    </Box>
  );
}

function StatTile({
  icon,
  count,
  label,
  detail,
}: {
  icon: React.ReactNode;
  count: number;
  label: string;
  detail?: string | null;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        flex: 1,
        p: 1.5,
        borderRadius: "10px",
        bgcolor: "grey.50",
        border: "1px solid",
        borderColor: "grey.200",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          bgcolor: "white",
          border: "1px solid",
          borderColor: "grey.200",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "grey.700",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ color: "#1A1A1B" }}>
          <Box component="span" sx={{ fontWeight: "bold", fontSize: "1rem" }}>
            {count}
          </Box>{" "}
          {label}
        </Typography>
        {detail && (
          <Typography variant="caption" color="text.secondary">
            {detail}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

function VoteRow({ vote }: { vote: ActeurVoteSurDossier }) {
  const config = vote.position ? POSITION_CONFIG[vote.position] : null;
  const date = vote.dateScrutin
    ? new Date(vote.dateScrutin).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={1.5}
      sx={{
        p: 1.25,
        bgcolor: "grey.50",
        borderRadius: "10px",
      }}
    >
      {config && (
        <Chip
          icon={<config.Icon sx={{ "&&": { color: config.color } }} />}
          label={config.label}
          size="small"
          sx={{
            bgcolor: config.bg,
            color: config.color,
            fontWeight: "bold",
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            height: 26,
            flexShrink: 0,
          }}
        />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight="medium"
          sx={{
            color: "#1A1A1B",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {vote.scrutinObjet || `Scrutin n°${vote.scrutinNumero ?? "?"}`}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }} flexWrap="wrap">
          {date && (
            <Typography variant="caption" color="text.secondary">
              {date}
            </Typography>
          )}
          {vote.parDelegation && (
            <Typography
              variant="caption"
              sx={{ color: "grey.500", fontStyle: "italic" }}
            >
              · par délégation
            </Typography>
          )}
          {vote.isDissident && vote.groupePosition && (
            <Tooltip
              title={`Position majoritaire de son groupe ${vote.groupeAbrev ?? ""} : ${POSITION_CONFIG[vote.groupePosition].label}`}
              arrow
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.4}
                sx={{
                  bgcolor: "#FEF3C7",
                  color: "#92400E",
                  px: 0.75,
                  py: 0.25,
                  borderRadius: "6px",
                  cursor: "help",
                }}
              >
                <DissidentIcon sx={{ fontSize: 12 }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Dissident
                </Typography>
              </Stack>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
