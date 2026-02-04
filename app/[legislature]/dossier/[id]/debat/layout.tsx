import React from "react";
import { DebateFilterBar } from "./DebateFilterBar";
import { getDossier } from "@/data/getDossier";
import { getReunionsWithCompteRendu } from "../dataFunctions";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{
    legislature: string;
    id: string;
  }>;
  children: React.ReactNode;
}) {
  const { id } = await params;

  const dossier = await getDossier(id);

  const reunionsWithCompteRendu = getReunionsWithCompteRendu(dossier);

  if (reunionsWithCompteRendu.length === 0) {
    return <p>Aucun débat n&apos;a été trouvé pour ce dossier legislatif.</p>;
  }

  return (
    <>
      <DebateFilterBar reunions={reunionsWithCompteRendu} />
      <div className="container">{children}</div>
    </>
  );
}
