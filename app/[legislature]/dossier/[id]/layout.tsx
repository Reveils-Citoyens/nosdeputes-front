import React from "react";
import type { Metadata } from "next";

import { HeroSection } from "@/components/folders/HeroSection";
import ComprendreBanner from "@/components/folders/ComprendreBanner";
import MonDeputeSurDossier from "@/components/folders/MonDeputeSurDossier";
import Tabs from "./Tabs";

import { getCurrentStatus } from "./dataFunctions";
import { getDossier } from "@/data/getDossier";
import { getDebats } from "@/data/getDebats";
import { dossierSettings } from "./dossierSettings";
import { getAmendementCount, getScrutinCount } from "@/data/getDossierCounts";
import { getDossierEnrichment } from "@/data/mongo/getDossierEnrichment";
import { isThemeSlug } from "@/data/themes";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ legislature: string; id: string }>;
}): Promise<Metadata> {
  const { legislature, id } = await params;
  const dossier = await getDossier(id);

  if (dossier == null) {
    return { title: "Dossier introuvable — NosDéputés.fr" };
  }

  const titre = dossier.titre?.trim() || "Dossier législatif";
  const procedure = dossier.libelleProcedure?.trim();
  const url = `${SITE_URL}/${legislature}/dossier/${id}`;

  const description = `${procedure ? `${procedure} — ` : ""}${titre}. Suivez ce dossier législatif à l'Assemblée nationale : avancée du texte, amendements, votes et travaux en commission.`;

  return {
    title: `${titre} — Dossier législatif — NosDéputés.fr`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: titre,
      description,
      url,
    },
  };
}

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
  const [amendementCount, scrutinCount, debats, enrichment] = await Promise.all([
    tableAmendements ? getAmendementCount(id) : Promise.resolve(0),
    tableVotes ? getScrutinCount(id) : Promise.resolve(0),
    // getDebats est cached via React.cache, donc partagé avec page.tsx
    apercuVariant === "redirect-commission" ? getDebats(id) : Promise.resolve(null),
    getDossierEnrichment(id),
  ]);

  const themesSenat = (enrichment?.themes_senat ?? [])
    .filter(isThemeSlug)
    .slice(0, 3);

  // Le redirect vers /commission ne s'applique que si des travaux en commission existent.
  // Sans ça, on garde la tab Aperçu visible et on rend l'aperçu standard.
  const hasCommissionDebats = (debats ?? []).some(
    (d) => d.debateType === "commission" && d._count.paragraphes > 0,
  );
  const showApercu = !(apercuVariant === "redirect-commission" && hasCommissionDebats);

  // Missions d'information (10) et commissions d'enquête (9) : layout dédié —
  // uniquement Aperçu + Comptes-rendus, sans les autres onglets ni panneau latéral.
  const isMissionOuCE = ["9", "10"].includes(String(codeProcedure));

  return (
    <React.Fragment>
      <HeroSection
        libelleProcedure={libelleProcedure ?? ""}
        titre={titre}
        theme={theme}
        status={status}
        dossierUid={id}
        themesSenat={themesSenat}
      />
      {!isMissionOuCE && tableVotes && <MonDeputeSurDossier dossierUid={id} />}
      <ComprendreBanner />
      <Tabs
        legislature={legislature}
        dossierUid={id}
        showApercu
        showDebats={!isMissionOuCE && tableDebats}
        showAmendements={!isMissionOuCE && tableAmendements}
        showVotes={!isMissionOuCE && tableVotes}
        showComptesRendus={isMissionOuCE}
        hasAmendements={amendementCount > 0}
        hasVotes={scrutinCount > 0}
      />
      {children}
    </React.Fragment>
  );
}
