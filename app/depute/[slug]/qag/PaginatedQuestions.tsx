"use client";
import * as React from "react";
import { getQuestions } from "@/data/getQuestion";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { Alert } from "@mui/material";
import Pagination from "@/components/Pagination";
import QuestionCard from "./QuestionCard";

export default function PaginatedQuestions({
  acteurUid,
}: {
  acteurUid: string;
}) {
  const searchParams = useSearchParams();
  const targetUid = searchParams.get("question");

  const [page, setPage] = React.useState(1);

  const { data: result, isPending } = useQuery({
    queryKey: ["questions", acteurUid, page],
    queryFn: async () =>
      getQuestions(acteurUid, {
        page,
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

  if (!isPending && data.length === 0) {
    return <p>Aucune question enregistrée pour ce député.</p>;
  }
  return (
    <div>
      {targetUid && !isOnCurrentPage && !isPending && (
        <Alert severity="info" sx={{ mb: 2 }}>
          La question demandée n&apos;est pas sur cette page. Utilisez la
          pagination pour la retrouver.
        </Alert>
      )}
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
    </div>
  );
}
