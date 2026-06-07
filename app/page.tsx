import React from "react";
import HeroSection from "@/components/home/HeroSection";
import DossierSection from "@/components/home/Dossiers";
import ThemesSection from "@/components/home/Themes";
import AgendaSection from "@/components/home/Agenda";
import ComprendreSection from "@/components/home/ComprendreSection";

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
