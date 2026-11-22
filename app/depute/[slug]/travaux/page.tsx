"use client";
import React from "react";

import {
  Box,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import {
  Edit as EditIcon,
  Description as DescriptionIcon,
  Campaign as CampaignIcon,
  FolderOpen as FolderIcon,
  PictureAsPdfOutlined as PdfIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getActeurBySlug } from "@/data/getActeurBySlug";
import type { DocumentTravaux, DossierTravaux } from "@/data/mongo/travauxAN";
import { lireJson } from "@/lib/lireJson";
import ErreurChargement from "@/components/ErreurChargement";
import { DeputeTravauxSkeleton } from "@/components/navigation/DeputeTabSkeleton";
import LienSource from "@/components/LienSource";
import { urlTexte } from "@/lib/sourcesAN";

// ─── Section shell (identique à /recherche pour cohérence) ────────────────────

function SectionShell({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        bgcolor: "white",
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: "16px",
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Icon sx={{ color: "grey.700" }} />
        <Typography variant="h6" fontWeight="bold" sx={{ color: "#1A1A1B" }}>
          {title}
        </Typography>
        {count !== undefined && count > 0 && (
          <Chip
            label={count}
            size="small"
            sx={{
              bgcolor: "grey.100",
              color: "grey.700",
              fontWeight: "bold",
              fontSize: "0.7rem",
              height: 22,
            }}
          />
        )}
      </Stack>
      {children}
    </Box>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
      {message}
    </Typography>
  );
}

// ─── Row pour un document (titre + date + lien PDF si dispo) ─────────────────

function DocumentRow({
  titre,
  date,
  pdfUrl,
  uid,
}: {
  titre: string | null | undefined;
  date: Date | null | undefined;
  pdfUrl: string | null | undefined;
  uid: string;
}) {
  const inner = (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{
        p: 1.25,
        borderRadius: "10px",
        "&:hover": pdfUrl ? { bgcolor: "grey.50" } : {},
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.8}>
          <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 0 }}>
            {titre ?? "Document"}
          </Typography>
          {/* Le titre ouvre le PDF ; la source officielle est le lien texte
              à droite. Deux actions, deux apparences. */}
          {pdfUrl && (
            <PdfIcon
              aria-label="PDF"
              sx={{ fontSize: 16, color: "grey.500", flexShrink: 0 }}
            />
          )}
        </Stack>
      </Box>
      {date && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ flexShrink: 0 }}
        >
          {date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Typography>
      )}
    </Stack>
  );

  // Le PDF est une copie hébergée par Tricoteuses ; la source officielle est
  // proposée à côté, hors du lien de la ligne (pas de lien dans un lien).
  const source = (
    <LienSource href={urlTexte(uid)} type="document" sx={{ flexShrink: 0, pl: 2, pr: 1 }}>
      Assemblée nationale
    </LienSource>
  );
  return (
    <Stack direction="row" alignItems="center">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {pdfUrl ? (
          <Link
            href={pdfUrl}
            target="_blank"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            {inner}
          </Link>
        ) : (
          inner
        )}
      </Box>
      {source}
    </Stack>
  );
}

// ─── Row pour un dossier législatif initié ───────────────────────────────────

function DossierRow({
  uid,
  legislature,
  titre,
}: {
  uid: string;
  legislature: number | string | null;
  titre: string | null;
}) {
  return (
    <Link
      href={`/${legislature}/dossier/${uid}/`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{
          p: 1.25,
          borderRadius: "10px",
          "&:hover": { bgcolor: "grey.50" },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight="bold" noWrap>
            {titre ?? "Dossier"}
          </Typography>
        </Box>
      </Stack>
    </Link>
  );
}

// ─── Dédoublonnage par dossier ───────────────────────────────────────────────
// L'API renvoie un document distinct par étape d'un même texte (B = déposé,
// BTC = adopté en commission…) plus l'avis du Conseil d'État (AVCE). Pour une
// liste « propositions initiées », on ne veut qu'UNE entrée par proposition :
// on regroupe par dossier et on garde le texte initial déposé (segment « B »,
// préfixe PION/PRJL) comme représentant ; à défaut, le premier du groupe.
function dedupeByDossier<
  T extends { uid: string; dossierRefUid?: string | null; dateCreation?: Date | null },
>(docs: T[]): T[] {
  const isInitialDeposit = (uid: string) =>
    /^(?:PION|PRJL)ANR5L\d{2}B\d{4}$/.test(uid);

  const groups = new Map<string, T[]>();
  for (const d of docs) {
    const key = d.dossierRefUid ?? d.uid; // sans dossier : on conserve tel quel
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(d);
  }

  const result = Array.from(groups.values()).map(
    (group) => group.find((d) => isInitialDeposit(d.uid)) ?? group[0],
  );

  // Tri du plus récent au plus ancien sur la date du représentant retenu.
  return result.sort(
    (a, b) => (b.dateCreation?.getTime() ?? 0) - (a.dateCreation?.getTime() ?? 0),
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Travaux() {
  const { slug } = useParams<{ slug: string }>();

  const { data: acteur, isPending: acteurIsPending } = useQuery({
    queryKey: ["acteur", slug],
    queryFn: async () => await getActeurBySlug(slug),
  });

  // Lu par une route du site (notre base, l'API Tricoteuses en repli) plutôt
  // que directement dans l'API : sa lenteur faisait afficher des listes vides.
  const {
    data: travaux,
    isPending: travauxIsPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["travaux", acteur?.uid],
    queryFn: async ({ signal }) => {
      const reponse = await lireJson<{ documents: DocumentTravaux[]; dossiers: DossierTravaux[] }>(
        `/api/acteurs/${acteur!.uid}/travaux`,
        signal,
      );
      return {
        documents: reponse.documents.map((d) => ({
          ...d,
          dateCreation: d.dateCreation ? new Date(d.dateCreation) : null,
        })),
        dossiers: reponse.dossiers,
      };
    },
    enabled: !!acteur?.uid,
  });

  const documents = travaux?.documents ?? [];
  const dossiers = travaux?.dossiers ?? [];

  const propositionsDeLoi = dedupeByDossier(
    documents.filter((doc) => doc.classeCode === "PIONLOI"),
  );
  const rapports = documents.filter(
    (doc) => doc.classeCode === "RAPPORT" || doc.classeCode === "RAPINF",
  );
  const resolutions = dedupeByDossier(
    documents.filter((doc) => doc.classeCode === "PIONRES"),
  );

  const isLoading = acteurIsPending || (travauxIsPending && !isError);

  return (
    <Container sx={{ pt: 3, pb: 6 }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{
            fontWeight: "bold",
            letterSpacing: "0.15em",
            color: "grey.600",
          }}
        >
          Activité parlementaire
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "1.5rem", md: "2rem" },
            fontWeight: "bold",
            color: "#1A1A1B",
          }}
        >
          Travaux législatifs
        </Typography>
      </Stack>

      {isError ? (
        <ErreurChargement onRetry={() => refetch()} />
      ) : isLoading ? (
        <DeputeTravauxSkeleton contentOnly />
      ) : (
        <Stack spacing={3}>
          <SectionShell
            icon={EditIcon}
            title="Propositions de loi"
            count={propositionsDeLoi.length}
          >
            {propositionsDeLoi.length === 0 ? (
              <EmptyRow message="Aucune proposition de loi trouvée." />
            ) : (
              <Stack spacing={0.5}>
                {propositionsDeLoi.map((doc) => (
                  <DocumentRow
                    key={doc.uid}
                    titre={doc.titrePrincipalCourt}
                    date={doc.dateCreation}
                    pdfUrl={doc.pdfUrl}
                    uid={doc.uid}
                  />
                ))}
              </Stack>
            )}
          </SectionShell>

          <SectionShell
            icon={DescriptionIcon}
            title="Rapports"
            count={rapports.length}
          >
            {rapports.length === 0 ? (
              <EmptyRow message="Aucun rapport trouvé." />
            ) : (
              <Stack spacing={0.5}>
                {rapports.map((doc) => (
                  <DocumentRow
                    key={doc.uid}
                    titre={doc.titrePrincipalCourt}
                    date={doc.dateCreation}
                    pdfUrl={doc.pdfUrl}
                    uid={doc.uid}
                  />
                ))}
              </Stack>
            )}
          </SectionShell>

          <SectionShell
            icon={CampaignIcon}
            title="Résolutions"
            count={resolutions.length}
          >
            {resolutions.length === 0 ? (
              <EmptyRow message="Aucune résolution trouvée." />
            ) : (
              <Stack spacing={0.5}>
                {resolutions.map((doc) => (
                  <DocumentRow
                    key={doc.uid}
                    titre={doc.titrePrincipalCourt}
                    date={doc.dateCreation}
                    pdfUrl={doc.pdfUrl}
                    uid={doc.uid}
                  />
                ))}
              </Stack>
            )}
          </SectionShell>

          <SectionShell
            icon={FolderIcon}
            title="Dossiers législatifs initiés"
            count={dossiers.length}
          >
            {dossiers.length === 0 ? (
              <EmptyRow message="Aucun dossier législatif initié." />
            ) : (
              <Stack spacing={0.5}>
                {dossiers.map((dossier) => (
                  <DossierRow
                    key={dossier.uid}
                    uid={dossier.uid}
                    legislature={dossier.legislature}
                    titre={dossier.titre}
                  />
                ))}
              </Stack>
            )}
          </SectionShell>
        </Stack>
      )}
    </Container>
  );
}
