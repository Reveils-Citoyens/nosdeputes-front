"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import type { Video } from "@/data/getVideoReunion";

/**
 * Lecteur de la vidéo d'une séance, calé à la seconde d'une intervention.
 *
 * Il est détaché du fil de la page : une séance peut compter des dizaines
 * d'interventions, et un lecteur posé dans le flux disparaît dès qu'on fait
 * défiler pour lire la suite. Ancré en bas de fenêtre, il reste visible pendant
 * qu'on parcourt les prises de parole, et changer d'intervention le fait sauter
 * au bon instant sans recharger la vidéo.
 *
 * Le flux est du HLS servi par le diffuseur de l'Assemblée. Safari le lit
 * nativement ; les autres navigateurs ont besoin de hls.js, chargé à la demande.
 * ⚠️ Le domaine doit figurer dans `connect-src` et `media-src` de la CSP
 * (next.config.js), faute de quoi la requête est refusée par le navigateur et
 * rien ne distingue ce cas d'une vidéo absente.
 */
export default function LecteurSeance(props: {
  video: Video;
  /** Seconde à laquelle se caler, quand on vient d'une intervention. */
  seconde?: number | null;
  /** Séance en cours de lecture, pour que l'utilisateur sache ce qu'il regarde. */
  legende: string;
  onFermer: () => void;
}) {
  const refVideo = React.useRef<HTMLVideoElement>(null);
  const [indisponible, setIndisponible] = React.useState(!props.video.flux);

  // Le flux n'est chargé qu'une fois : changer d'intervention déplace la tête
  // de lecture (effet suivant) au lieu de tout réinitialiser.
  React.useEffect(() => {
    const element = refVideo.current;
    const flux = props.video.flux;
    if (!element || !flux) return;

    let hls: { destroy: () => void } | null = null;
    let annule = false;

    // hls.js d'abord, repli natif ensuite — et surtout pas l'inverse :
    // `canPlayType("application/vnd.apple.mpegurl")` renvoie "maybe" dans
    // Chrome, une chaîne non vide donc vraie, alors que Chrome ne sait pas lire
    // le HLS. Tester le natif en premier envoie le .m3u8 dans `src`, où il
    // échoue sans bruit. Seul Safari doit prendre cette branche.
    import("hls.js").then(({ default: Hls }) => {
      if (annule) return;

      if (Hls.isSupported()) {
        const instance = new Hls({ startPosition: props.seconde ?? -1 });
        instance.loadSource(flux);
        instance.attachMedia(element);
        instance.on(Hls.Events.ERROR, (_evenement, donnees) => {
          if (donnees.fatal) setIndisponible(true);
        });
        hls = instance;
        return;
      }

      if (element.canPlayType("application/vnd.apple.mpegurl")) {
        element.src = flux;
        element.addEventListener("error", () => setIndisponible(true));
        return;
      }

      setIndisponible(true);
    });

    return () => {
      annule = true;
      hls?.destroy();
    };
    // `seconde` est volontairement absent : il pilote le calage, pas le chargement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.video.flux]);

  React.useEffect(() => {
    const element = refVideo.current;
    if (!element || props.seconde == null) return;
    const caler = () => {
      element.currentTime = props.seconde as number;
      void element.play().catch(() => {});
    };
    // Avant les métadonnées, `currentTime` est ignoré : on attend le signal.
    if (element.readyState >= 1) caler();
    else element.addEventListener("loadedmetadata", caler, { once: true });
    return () => element.removeEventListener("loadedmetadata", caler);
  }, [props.seconde]);

  React.useEffect(() => {
    const surTouche = (evenement: KeyboardEvent) => {
      if (evenement.key === "Escape") props.onFermer();
    };
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [props.onFermer]);

  return (
    <Paper
      elevation={8}
      role="region"
      aria-label="Vidéo de la séance"
      sx={{
        position: "fixed",
        zIndex: 1200,
        overflow: "hidden",
        borderRadius: 2,
        // Ancré au coin sur grand écran ; en bandeau bas sur téléphone, où un
        // coin flottant masquerait le texte qu'on est en train de lire.
        bottom: { xs: 0, sm: 16 },
        right: { xs: 0, sm: 16 },
        left: { xs: 0, sm: "auto" },
        width: { xs: "100%", sm: 400 },
        borderBottomLeftRadius: { xs: 0, sm: 8 },
        borderBottomRightRadius: { xs: 0, sm: 8 },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.5, py: 0.5 }}
      >
        <Typography variant="caption" color="text.secondary" noWrap>
          {props.legende}
        </Typography>
        <IconButton size="small" onClick={props.onFermer} aria-label="Fermer la vidéo">
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </Stack>

      {indisponible ? (
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            La vidéo de cette séance n’est plus diffusée en ligne.
            {props.video.page ? (
              <>
                {" "}
                <Link href={props.video.page} target="_blank" rel="noopener noreferrer">
                  Voir sur le site de l’Assemblée nationale
                </Link>
              </>
            ) : null}
          </Typography>
        </Box>
      ) : (
        <Box
          component="video"
          ref={refVideo}
          controls
          playsInline
          preload="metadata"
          sx={{
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: "#000",
            display: "block",
          }}
        />
      )}
    </Paper>
  );
}
