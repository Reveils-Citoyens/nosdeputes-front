import { notFound } from "next/navigation";
import React from "react";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { getMetriquesActeur } from "@/data/mongo/getStatistiquesMetriques";
import { MESURE_PROXIMITE } from "@/lib/proximite";
import { getLibellesGroupes } from "@/data/mongo/getStatistiquesGroupes";
import VotesClient from "./VotesClient";
import ProximiteCard from "./ProximiteCard";

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

  // Proximité de vote avec les groupes, calculée chaque nuit : absente tant
  // que le calcul n'a pas tourné, la carte ne s'affiche alors pas.
  const [metriques, libelles] = await Promise.all([getMetriquesActeur(acteur.uid), getLibellesGroupes()]);
  const proximites = metriques.filter((m) => m.mesure === MESURE_PROXIMITE);

  return (
    <>
      <ProximiteCard metriques={proximites} nom={`${acteur.prenom} ${acteur.nom}`} libelles={libelles} />
      <VotesClient acteur={acteur} />
    </>
  );
}
