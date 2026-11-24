import { notFound } from "next/navigation";
import React from "react";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import PaginatedQuestions from "../questions/PaginatedQuestions";

export default async function QuestionsOrales({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const depute = await getActeurBySlug(slug);

  if (depute === null) {
    notFound();
  }

  return <PaginatedQuestions acteurUid={depute.uid} famille="orales" />;
}
