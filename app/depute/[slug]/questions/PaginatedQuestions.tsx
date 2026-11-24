"use client";
import * as React from "react";
import type { QuestionActeur } from "@/data/mongo/questionsAN";
import type { PaginatedResponse } from "@/data/pagination";
import { lireJson } from "@/lib/lireJson";
import ErreurChargement from "@/components/ErreurChargement";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Stack, Tooltip, Typography } from "@mui/material";
import Pagination from "@/components/Pagination";
import QuestionCard from "./QuestionCard";
import SearchInput from "@/components/SearchInput";
import debounce from "@/utils/debounce";
import { DeputeListSkeleton } from "@/components/navigation/DeputeTabSkeleton";

/**
 * Deux onglets de la fiche : questions écrites (QE) d'un côté, questions
 * orales de l'autre — questions au Gouvernement (QG) et questions orales sans
 * débat (QOSD), posées en séance.
 */
export type FamilleQuestions = "ecrites" | "orales";

const FAMILLES: Record<FamilleQuestions, { types: string; nom: string; aucune: string }> = {
  ecrites: { types: "QE", nom: "questions écrites", aucune: "Aucune question écrite enregistrée pour ce député." },
  orales: { types: "QG,QOSD", nom: "questions orales", aucune: "Aucune question orale enregistrée pour ce député." },
};

/** Questions affichées par page. */
const PAR_PAGE = 20;

export default function PaginatedQuestions({
  acteurUid,
  famille,
}: {
  acteurUid: string;
  famille: FamilleQuestions;
}) {
  const { types, nom, aucune } = FAMILLES[famille];
  const searchParams = useSearchParams();
  const targetUid = searchParams.get("question");

  const [value, setValue] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);

  const debouncedSetSearch = React.useMemo(
    () =>
      debounce((next: string) => {
        setSearch(next);
        setPage(1);
      }, 400),
    [],
  );

  const handleSearchChange = (next: string) => {
    setValue(next);
    debouncedSetSearch(next);
  };

  // Lu par une route du site (notre base, l'API Tricoteuses en repli) plutôt
  // que directement dans l'API : sa lenteur faisait afficher « Aucune question ».
  const { data: result, isPending, isError, refetch } = useQuery({
    queryKey: ["questions", acteurUid, famille, page, search],
    queryFn: async ({ signal }) =>
      lireJson<PaginatedResponse<QuestionActeur> & { parType?: Record<string, number> }>(
        `/api/acteurs/${acteurUid}/questions?${new URLSearchParams({ page: String(page), perPage: String(PAR_PAGE), search, types })}`,
        signal,
      ),
    placeholderData: keepPreviousData,
  });

  const data = React.useMemo(() => result?.data ?? [], [result?.data]);
  const pagination = result?.pagination;
  // Questions orales : la carte de la fiche ne compte que les questions orales
  // sans débat ; l'onglet liste aussi les questions au Gouvernement. On le dit.
  const nombreQG = famille === "orales" ? result?.parType?.QG ?? 0 : 0;
  const nombreQOSD = result?.parType?.QOSD ?? 0;

  // Si une question cible est passée en URL et qu'elle est sur la page
  // courante, on scroll vers elle après le rendu.
  const isOnCurrentPage = React.useMemo(
    () => !!targetUid && data.some((q) => q.uid === targetUid),
    [targetUid, data]
  );

  React.useEffect(() => {
    if (!isOnCurrentPage || !targetUid) return;
    // Délai pour laisser l'accordéon s'ouvrir et le DOM se peindre
    const t = setTimeout(() => {
      const el = document.getElementById(`question-${targetUid}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    return () => clearTimeout(t);
  }, [isOnCurrentPage, targetUid]);

  return (
    <Stack spacing={2}>
      <SearchInput
        value={value}
        onChange={handleSearchChange}
        placeholder={`Rechercher dans les ${nom}…`}
      />

      {nombreQG > 0 && !search ? (
        <Typography variant="body2" color="text.secondary">
          {nombreQG} question{nombreQG > 1 ? "s" : ""} au Gouvernement et {nombreQOSD} question
          {nombreQOSD > 1 ? "s" : ""} orale{nombreQOSD > 1 ? "s" : ""} sans débat.{" "}
          <Tooltip title="Les questions au Gouvernement du mardi et du mercredi sont réparties entre les députés par leur groupe, selon un contingent hebdomadaire : elles n’entrent pas dans le compteur « Questions orales sans débat » de la fiche, qui mesure une initiative personnelle. Elles sont indiquées à côté.">
            <Box
              component="span"
              tabIndex={0}
              sx={{ borderBottom: "1px dotted", borderColor: "text.disabled", cursor: "help" }}
            >
              Seules les questions orales sans débat entrent dans le compteur de la fiche.
            </Box>
          </Tooltip>
        </Typography>
      ) : null}

      {targetUid && !isOnCurrentPage && !isPending && (
        <Alert severity="info">
          La question demandée n&apos;est pas sur cette page. Utilisez la
          pagination pour la retrouver.
        </Alert>
      )}

      {isError ? (
        <ErreurChargement onRetry={() => refetch()} />
      ) : isPending ? <DeputeListSkeleton variant="qag" showFilters={false} /> : data.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography>
            {search
              ? `Aucune question ne correspond à « ${search} ».`
              : aucune}
          </Typography>
        </Box>
      ) : (
        <>
          <div>
            {data?.map((question) => (
              <QuestionCard
                key={question.uid}
                question={question}
                defaultExpanded={question.uid === targetUid}
                // Un seul type de question écrite : l'étiquette n'apprendrait rien.
                afficherType={famille === "orales"}
              />
            ))}
          </div>
          {/* Sous la liste, comme dans l'onglet Amendements. */}
          <Pagination
            {...pagination}
            page={page}
            setPage={setPage}
            isPending={isPending}
          />
        </>
      )}
    </Stack>
  );
}
