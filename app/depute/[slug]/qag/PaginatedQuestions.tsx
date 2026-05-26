"use client";
import * as React from "react";
import { getQuestions } from "@/data/getQuestion";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Stack, Typography } from "@mui/material";
import Pagination from "@/components/Pagination";
import QuestionCard from "./QuestionCard";
import SearchInput from "@/components/SearchInput";
import debounce from "@/utils/debounce";

export default function PaginatedQuestions({
  acteurUid,
}: {
  acteurUid: string;
}) {
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

  const { data: result, isPending } = useQuery({
    queryKey: ["questions", acteurUid, page, search],
    queryFn: async () =>
      getQuestions(acteurUid, {
        page,
        search,
      }),
    placeholderData: keepPreviousData,
  });

  const data = result?.data ?? [];
  const pagination = result?.pagination;

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
        placeholder="Rechercher dans les questions…"
      />

      {targetUid && !isOnCurrentPage && !isPending && (
        <Alert severity="info">
          La question demandée n&apos;est pas sur cette page. Utilisez la
          pagination pour la retrouver.
        </Alert>
      )}

      {!isPending && data.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          <Typography>
            {search
              ? `Aucune question ne correspond à « ${search} ».`
              : "Aucune question enregistrée pour ce député."}
          </Typography>
        </Box>
      ) : (
        <>
          <Pagination
            {...pagination}
            page={page}
            setPage={setPage}
            isPending={isPending}
          />
          <div>
            {data?.map((question) => (
              <QuestionCard
                key={question.uid}
                question={question}
                defaultExpanded={question.uid === targetUid}
              />
            ))}
          </div>
        </>
      )}
    </Stack>
  );
}
