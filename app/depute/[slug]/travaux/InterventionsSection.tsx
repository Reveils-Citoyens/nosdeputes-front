"use client";
import React from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Box, Button, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { RecordVoiceOver as InterventionIcon } from "@mui/icons-material";
import type { DebatActeur, TypeDebat } from "@/data/mongo/interventionsActeurAN";
import { lireJson } from "@/lib/lireJson";
import ErreurChargement from "@/components/ErreurChargement";
import InfoDialogIcon from "@/components/InfoDialog/InfoDialogIcon";
import SectionShell from "./SectionShell";

/** Débats affichés d'abord : assez peu pour laisser voir le reste de l'onglet. */
const AFFICHES_AU_DEPART = 5;
/** Débats ajoutés à chaque « Voir plus ». */
const PAR_LOT = 10;

const FILTRES: { valeur: TypeDebat | ""; libelle: string }[] = [
  { valeur: "", libelle: "Tout" },
  { valeur: "seance", libelle: "Séance" },
  { valeur: "commission", libelle: "Commission" },
];

function formaterDate(jour: string): string {
  return new Date(`${jour}T12:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function LigneDebat({ debat }: { debat: DebatActeur }) {
  const compteur =
    debat.interventions > 0
      ? `${debat.interventions} intervention${debat.interventions > 1 ? "s" : ""}${debat.aPreside ? " · a présidé" : ""}`
      : "A présidé";

  const contenu = (
    <Box
      sx={{
        p: 1.25,
        borderRadius: "10px",
        "&:hover": debat.lien ? { bgcolor: "grey.50" } : {},
      }}
    >
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.25 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
          {formaterDate(debat.date)} · {debat.lieu}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontWeight: 600 }}>
          {compteur}
        </Typography>
      </Stack>
      <Typography variant="body2" fontWeight="bold">
        {debat.sujet ?? (debat.type === "seance" ? "Séance publique" : "Réunion de commission")}
      </Typography>
      {debat.extrait ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mt: 0.25,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          « {debat.extrait} »
        </Typography>
      ) : null}
      {debat.lien ? (
        <Typography variant="caption" sx={{ display: "inline-block", mt: 0.5, fontWeight: 600 }}>
          {debat.lienExterne ? "Compte rendu officiel ↗" : "Lire le débat →"}
        </Typography>
      ) : null}
    </Box>
  );

  if (!debat.lien) return contenu;
  const style = { textDecoration: "none", color: "inherit", display: "block" } as const;
  return debat.lienExterne ? (
    <a href={debat.lien} target="_blank" rel="noopener noreferrer" style={style}>
      {contenu}
    </a>
  ) : (
    <Link href={debat.lien} style={style}>
      {contenu}
    </Link>
  );
}

/**
 * Derniers débats où le député est intervenu, en séance publique et en
 * commission : une ligne par débat, avec le sujet, le nombre d'interventions
 * et le début de la première. Mêmes règles que le compteur « Interventions »
 * des statistiques d'activité.
 */
export default function InterventionsSection({ acteurUid }: { acteurUid: string }) {
  const [type, setType] = React.useState<TypeDebat | "">("");
  const [limite, setLimite] = React.useState(AFFICHES_AU_DEPART);

  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["interventions", acteurUid, type, limite],
    queryFn: ({ signal }) =>
      lireJson<{ debats: DebatActeur[]; total: number }>(
        `/api/acteurs/${acteurUid}/interventions?${new URLSearchParams({ type, limite: String(limite) })}`,
        signal,
      ),
    placeholderData: keepPreviousData,
  });

  const debats = data?.debats ?? [];
  const total = data?.total ?? 0;

  const choisir = (valeur: TypeDebat | "") => {
    setType(valeur);
    setLimite(AFFICHES_AU_DEPART);
  };

  const filtres = (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {FILTRES.map(({ valeur, libelle }) => (
        <Chip
          key={libelle}
          label={libelle}
          size="small"
          onClick={() => choisir(valeur)}
          variant={type === valeur ? "filled" : "outlined"}
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            ...(type === valeur ? { bgcolor: "grey.900", color: "white", "&:hover": { bgcolor: "grey.800" } } : {}),
          }}
        />
      ))}
    </Stack>
  );

  return (
    <SectionShell icon={InterventionIcon} title="Interventions en séance et en commission" action={filtres}>
      <Stack direction="row" alignItems="center" spacing={0.25} sx={{ mt: -1.5, mb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">
          Une ligne par débat, du plus récent au plus ancien
        </Typography>
        <InfoDialogIcon category="depute" item="presences" sx={{ p: 0.25, fontSize: "0.85rem" }} />
      </Stack>

      {isError ? (
        <ErreurChargement onRetry={() => refetch()} />
      ) : isPending ? (
        <Box role="status" aria-label="Chargement des interventions du député">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} height={72} />
          ))}
        </Box>
      ) : debats.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          {type === "seance"
            ? "Aucune intervention en séance publique."
            : type === "commission"
              ? "Aucune intervention en commission."
              : "Aucune intervention en séance ou en commission."}
        </Typography>
      ) : (
        <Stack spacing={0.5}>
          {debats.map((debat) => (
            <LigneDebat key={debat.compteRenduUid} debat={debat} />
          ))}
          {limite < total ? (
            <Box sx={{ pt: 1, textAlign: "center" }}>
              <Button
                size="small"
                variant="outlined"
                disabled={isFetching}
                onClick={() => setLimite((l) => l + PAR_LOT)}
                sx={{ borderRadius: 999, textTransform: "none", color: "text.primary", borderColor: "grey.300" }}
              >
                {isFetching ? "Chargement…" : "Voir plus"}
              </Button>
            </Box>
          ) : null}
        </Stack>
      )}
    </SectionShell>
  );
}
