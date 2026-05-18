import React from "react";
import HeroSection from "@/components/home/HeroSection";
import DossierSection from "@/components/home/Dossiers";
import AgendaSection from "@/components/home/Agenda";
import ComprendreSection from "@/components/home/ComprendreSection";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <DossierSection />
      <ComprendreSection />
      <React.Suspense>
        <AgendaSection />
      </React.Suspense>
    </div>
  );
}
