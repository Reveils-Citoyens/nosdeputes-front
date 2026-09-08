"use client";
import * as React from "react";
import Button from "@mui/material/Button";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import LecteurSeance from "@/components/LecteurSeance";
import type { Video } from "@/data/getVideoReunion";

/**
 * Bouton d'accès à la vidéo d'une réunion de commission.
 *
 * En séance publique, chaque prise de parole porte son propre horodatage et
 * donc son propre bouton : la vidéo se découvre en lisant. Les comptes rendus
 * de commission n'ont pas de `stime` — vérifié, le champ est vide sur toutes
 * les interventions — il n'y a donc qu'un seul point d'entrée pour toute la
 * réunion. S'il passe inaperçu, la vidéo n'existe pas pour le lecteur : d'où un
 * bouton plein, et non le lien discret qu'on se permet ailleurs.
 *
 * La lecture démarre à `secondeDebut` : la captation commence avant l'ouverture
 * de la séance, parfois d'une demi-heure de salle vide.
 */
export default function BoutonVideoReunion({
  video,
  legende,
  taille = "principal",
  onLire,
}: {
  video: Video;
  /** Ce qu'on s'apprête à regarder, affiché en tête du lecteur. */
  legende: string;
  /**
   * `principal` en tête de compte rendu, seul appel à la vidéo de la page.
   * `liste` dans une énumération de réunions, où le bouton se répète et doit
   * rester subordonné au titre de chaque réunion.
   */
  taille?: "principal" | "liste";
  /**
   * Quand la page pilote déjà un lecteur, le bouton le lui délègue au lieu
   * d'en monter un second. Deux lecteurs ancrés en bas de fenêtre se
   * superposeraient, et la vidéo qu'on vient de lancer masquerait celle qui
   * jouait déjà.
   */
  onLire?: (video: Video, legende: string) => void;
}) {
  const [ouvert, setOuvert] = React.useState(false);
  const enListe = taille === "liste";
  const declencher = () => (onLire ? onLire(video, legende) : setOuvert(true));

  return (
    <>
      <Button
        onClick={declencher}
        variant="contained"
        disableElevation
        size={enListe ? "small" : "medium"}
        startIcon={<PlayArrowRoundedIcon />}
        data-umami-event="video-reunion-ouverte"
        data-umami-event-source={enListe ? "liste-reunions" : "compte-rendu"}
        sx={{
          textTransform: "none",
          borderRadius: 999,
          fontWeight: 600,
          bgcolor: "#1A1A1B",
          color: "common.white",
          px: enListe ? 1.5 : 2.25,
          py: enListe ? 0.4 : 0.75,
          fontSize: enListe ? "0.75rem" : "0.875rem",
          "&:hover": { bgcolor: "#000" },
          "& .MuiButton-startIcon": { mr: 0.5 },
          "& .MuiSvgIcon-root": { fontSize: enListe ? 18 : 22 },
        }}
      >
        {enListe ? "Voir la vidéo" : "Voir la vidéo de la réunion"}
      </Button>

      {ouvert && !onLire ? (
        <LecteurSeance
          video={video}
          seconde={video.secondeDebut}
          legende={legende}
          onFermer={() => setOuvert(false)}
        />
      ) : null}
    </>
  );
}
