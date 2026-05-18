import React from "react";

import { HeroSection } from "@/components/folders/HeroSection";
import ComprendreBanner from "@/components/folders/ComprendreBanner";
import Tabs from "./Tabs";

import { getCurrentStatus } from "./dataFunctions";
import { getDossier } from "@/data/getDossier";
import { dossierSettings } from "./dossierSettings";

export default async function Dossier({
  children,
  params,
}: React.PropsWithChildren<{
  params: Promise<{ legislature: string; id: string }>;
}>) {
  const { legislature, id } = await params;
  const dossier = await getDossier(id);

  if (dossier == null) {
    return <p>Dossier not found</p>;
  }
  const { libelleProcedure, titre, theme, actesLegislatifs, codeProcedure } =
    dossier;

  const {
    tableDebats = true,
    tableAmendements = true,
    tableVotes = true,
  } = (codeProcedure ? dossierSettings[codeProcedure] : {}) ?? {};
  const status = getCurrentStatus(actesLegislatifs);

  return (
    <React.Fragment>
      <HeroSection
        libelleProcedure={libelleProcedure ?? ""}
        titre={titre}
        theme={theme}
        status={status}
        dossierUid={id}
      />
      <ComprendreBanner />
      <Tabs
        legislature={legislature}
        dossierUid={id}
        showDebats={tableDebats}
        showAmendements={tableAmendements}
        showVotes={tableVotes}
      />
      {children}
    </React.Fragment>
  );
}
