import { notFound } from "next/navigation";
import React from "react";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import VotesClient from "./VotesClient"; 

export default async function VotesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const acteur = await getActeurBySlug(slug);

  if (!acteur) {
    notFound();
  }

  return <VotesClient acteur={acteur} />;
}
