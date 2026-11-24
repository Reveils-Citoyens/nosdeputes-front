"use client";
import * as React from "react";
import LecteurSeance from "@/components/LecteurSeance";
import type { Video } from "@/data/getVideoReunion";

/**
 * Vidéo en cours de lecture sur les pages d'un député, qui survit au
 * changement d'onglet (Activités, Travaux, Amendements…).
 *
 * Le lecteur vivait dans la page de l'onglet : changer d'onglet la démontait,
 * et la vidéo s'arrêtait. Le fournisseur est placé dans le layout de la fiche,
 * qui reste monté d'un onglet à l'autre ; les pages ne font que lui confier la
 * lecture. Passer à un autre député, ou quitter la fiche, ferme le lecteur.
 */
export type LectureEnCours = {
  video: Video;
  /** Seconde à laquelle se caler. */
  seconde: number | null;
  legende: string;
};

const Contexte = React.createContext<((lecture: LectureEnCours) => void) | null>(null);

export function LecteurPersistantProvider({ children }: { children: React.ReactNode }) {
  const [lecture, setLecture] = React.useState<LectureEnCours | null>(null);
  const fermer = React.useCallback(() => setLecture(null), []);

  return (
    <Contexte.Provider value={setLecture}>
      {children}
      {lecture ? (
        <LecteurSeance
          // Autre vidéo : lecteur neuf (flux et état « indisponible » remis à
          // zéro). Même vidéo : la tête de lecture se déplace sans recharger.
          key={lecture.video.flux ?? lecture.video.page ?? ""}
          video={lecture.video}
          seconde={lecture.seconde}
          legende={lecture.legende}
          onFermer={fermer}
        />
      ) : null}
    </Contexte.Provider>
  );
}

/**
 * Lancer une vidéo. Sous le fournisseur, elle continue d'un onglet à l'autre ;
 * ailleurs, le composant affiche lui-même `lecteurLocal`.
 */
export function useLecteur(): {
  lire: (lecture: LectureEnCours) => void;
  lecteurLocal: React.ReactNode;
} {
  const lancer = React.useContext(Contexte);
  const [locale, setLocale] = React.useState<LectureEnCours | null>(null);
  const fermer = React.useCallback(() => setLocale(null), []);

  return {
    lire: lancer ?? setLocale,
    lecteurLocal:
      !lancer && locale ? (
        <LecteurSeance
          key={locale.video.flux ?? locale.video.page ?? ""}
          video={locale.video}
          seconde={locale.seconde}
          legende={locale.legende}
          onFermer={fermer}
        />
      ) : null,
  };
}
