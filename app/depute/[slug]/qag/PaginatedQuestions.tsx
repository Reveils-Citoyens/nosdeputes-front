"use client";
import * as React from "react";
import { getQuestions } from "@/data/getQuestion";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Pagination from "@/components/Pagination";
import QuestionCard from "./QuestionCard";

export default function PaginatedQuestions({
  acteurUid,
}: {
  acteurUid: string;
}) {
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

  if (!isPending && data.length === 0) {
    return <p>Aucune question enregistrée pour ce député.</p>;
  }
  return (
    <div>
      <Pagination
        {...pagination}
        page={page}
        setPage={setPage}
        isPending={isPending}
      />
      <div>
        {data?.map((question) => {
          return <QuestionCard key={question.uid} question={question} />;
        })}
      </div>
    </div>
  );
}
