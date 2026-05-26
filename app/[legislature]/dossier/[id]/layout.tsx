import React from "react";

import { HeroSection } from "@/components/folders/HeroSection";
import ComprendreBanner from "@/components/folders/ComprendreBanner";
import MonDeputeSurDossier from "@/components/folders/MonDeputeSurDossier";
import Tabs from "./Tabs";

import { getCurrentStatus } from "./dataFunctions";
import { getDossier } from "@/data/getDossier";
import { getDebats } from "@/data/getDebats";
import { dossierSettings } from "./dossierSettings";
import { getAmendementCount, getScrutinCount } from "@/data/getDossierCounts";

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
    apercuVariant = "chronologie",
  } = (codeProcedure ? dossierSettings[codeProcedure] : {}) ?? {};
  const status = getCurrentStatus(actesLegislatifs);

  // Comptes légers pour activer/désactiver les tabs sans données
  const [amendementCount, scrutinCount, debats] = await Promise.all([
    tableAmendements ? getAmendementCount(id) : Promise.resolve(0),
    tableVotes ? getScrutinCount(id) : Promise.resolve(0),
    // getDebats est cached via React.cache, donc partagé avec page.tsx
    apercuVariant === "redirect-commission" ? getDebats(id) : Promise.resolve(null),
  ]);

  // Le redirect vers /commission ne s'applique que si des travaux en commission existent.
  // Sans ça, on garde la tab Aperçu visible et on rend l'aperçu standard.
  const hasCommissionDebats = (debats ?? []).some(
    (d) => d.debateType === "commission" && d._count.paragraphes > 0,
  );
  const showApercu = !(apercuVariant === "redirect-commission" && hasCommissionDebats);

  return (
    <React.Fragment>
      <HeroSection
        libelleProcedure={libelleProcedure ?? ""}
        titre={titre}
        theme={theme}
        status={status}
        dossierUid={id}
      />
      {tableVotes && <MonDeputeSurDossier dossierUid={id} />}
      <ComprendreBanner />
      <Tabs
        legislature={legislature}
        dossierUid={id}
        showApercu={showApercu}
        showDebats={tableDebats}
        showAmendements={tableAmendements}
        showVotes={tableVotes}
        hasAmendements={amendementCount > 0}
        hasVotes={scrutinCount > 0}
      />
      {children}
    </React.Fragment>
  );
}
