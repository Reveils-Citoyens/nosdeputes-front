import React from "react";

import { getActeurBySlug } from "@/data/getActeurBySlug";
import PaginatedQuestions from "./PaginatedQuestions";

export default async function Votes({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const depute = await getActeurBySlug(slug);

  if (depute === null) {
    return <p>Deputé inconnu</p>;
  }

  return (
    <div>
      <PaginatedQuestions acteurUid={depute.uid} />
    </div>
  );
}
