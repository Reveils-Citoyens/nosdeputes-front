import React from "react";
import type { Metadata } from "next";
import HeroSection from "@/components/home/HeroSection";
import DossierSection from "@/components/home/Dossiers";
import ThemesSection from "@/components/home/Themes";
import AgendaSection from "@/components/home/Agenda";
import ComprendreSection from "@/components/home/ComprendreSection";
import { SITE_URL } from "@/lib/site";

// Titre/description hérités du layout racine (déjà adaptés à l'accueil) ; on
// fixe ici la canonical pour consolider l'indexation sur le domaine de prod.
export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

// Rendu au runtime, pas au build : la home lit l'agenda de la semaine courante
// (getAgendaSemaine → MongoDB), une donnée vivante indisponible au moment du
// build du conteneur. Évite aussi un agenda figé à la date du build.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <ThemesSection />
      <DossierSection />
      <ComprendreSection />
      <React.Suspense>
        <AgendaSection />
      </React.Suspense>
    </div>
  );
}
