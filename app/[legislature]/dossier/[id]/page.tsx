import React from "react";
import { redirect } from "next/navigation";

import { PreviewTab } from "@/app/[legislature]/dossier/[id]/PreviewTab";
import { getDossier } from "@/data/getDossier";
import { getDebats } from "@/data/getDebats";
import { dossierSettings } from "./dossierSettings";

export default async function Page({
  params,
}: {
  params: Promise<{ legislature: string; id: string }>;
}) {
  const { legislature, id } = await params;

  const dossier = await getDossier(id);

  if (dossier === null) {
    return <p>Dossier Not Found</p>;
  }

  const apercuVariant =
    (dossier.codeProcedure ? dossierSettings[dossier.codeProcedure] : undefined)
      ?.apercuVariant ?? "chronologie";

  // Redirect vers /commission uniquement si des travaux en commission existent.
  // Sans ce check, les CE/missions d'info récentes sans réunion encore tenue
  // atterriraient sur un message "Aucune réunion" sans tab Aperçu accessible.
  if (apercuVariant === "redirect-commission") {
    const debats = await getDebats(id);
    const hasCommissionDebats = (debats ?? []).some(
      (d) => d.debateType === "commission" && d._count.paragraphes > 0,
    );
    if (hasCommissionDebats) {
      redirect(`/${legislature}/dossier/${id}/commission`);
    }
  }

  return <PreviewTab dossier={dossier} />;
}
