"use client";

import React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

import throttle from "lodash/throttle";

/** Entrée du sommaire : l'id de l'élément de la page vers lequel elle mène. */
export type EntreeSommaire = {
  id: string;
  libelle: string;
  /** 2 = sous-partie, affichée en retrait. */
  niveau?: 1 | 2;
};

const noop = () => {};

// From https://github.com/mui/material-ui/blob/8b66a36f3378d8c6c3554b44cd65fb2b61d28b64/docs/src/modules/components/AppTableOfContents.js
function useThrottledOnScroll(
  callback: ((args: unknown) => unknown) | null,
  delay: number,
) {
  const throttledCallback = React.useMemo(
    () => (callback ? throttle(callback, delay) : noop),
    [callback, delay],
  );

  React.useEffect(() => {
    if (throttledCallback === noop) {
      return undefined;
    }

    window.addEventListener("scroll", throttledCallback);
    return () => {
      window.removeEventListener("scroll", throttledCallback);
      if ("cancel" in throttledCallback) {
        throttledCallback.cancel();
      }
    };
  }, [throttledCallback]);
}

export function samePageLinkNavigation(event: React.MouseEvent<HTMLElement>) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return true;
  }
  return false;
}

/**
 * Sommaire latéral collant : l'entrée de la partie en cours de lecture est
 * mise en avant pendant le défilement. Utilisé par les pages débats et par
 * /methodologie.
 */
export function SommaireLateral({
  entrees,
  titre = "Sommaire",
  haut = 50,
  replie = false,
  sx,
}: {
  entrees: EntreeSommaire[];
  titre?: string;
  /** Décalage du haut de l'écran quand le sommaire est collé (px). */
  haut?: number;
  /** Replié à l'ouverture (version mobile, placée au-dessus du contenu). */
  replie?: boolean;
  sx?: SxProps<Theme>;
}) {
  const theme = useTheme();
  // Titres en gras seulement s'il y a des sous-parties à distinguer : le
  // sommaire des débats, à un seul niveau, garde son apparence.
  const hierarchise = entrees.some((e) => e.niveau === 2);
  // Identifiants uniques : la page peut afficher deux sommaires (ordinateur et mobile).
  const idBase = React.useId();

  const [activeState, setActiveState] = React.useState<string | null>(null);
  const clickedRef = React.useRef(false);
  const unsetClickedRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const findActiveIndex = React.useCallback(() => {
    // Don't set the active index based on scroll if a link was just clicked
    if (clickedRef.current) {
      return;
    }

    let active: { id: string | null } | undefined;
    for (let i = entrees.length - 1; i >= 0; i -= 1) {
      // No id if we're near the top of the page
      if (document.documentElement.scrollTop < 200) {
        active = { id: null };
        break;
      }

      const item = entrees[i];
      const node = document.getElementById(item.id);

      if (process.env.NODE_ENV !== "production") {
        if (!node) {
          console.error(`Missing node on the item ${JSON.stringify(item, null, 2)}`);
        }
      }

      // Position dans le document, quel que soit le conteneur positionné qui
      // l'englobe (offsetTop est relatif à ce conteneur).
      if (
        node &&
        node.getBoundingClientRect().top < document.documentElement.clientHeight / 8
      ) {
        active = item;
        break;
      }
    }

    if (active && activeState !== active.id) {
      setActiveState(active.id);
    }
  }, [activeState, entrees]);

  // Corresponds to 10 frames at 60 Hz
  useThrottledOnScroll(entrees.length > 0 ? findActiveIndex : null, 166);

  const handleClick =
    (id: string) => (event: React.MouseEvent<HTMLElement>) => {
      // Ignore click events meant for native link handling, for example open in new tab
      if (samePageLinkNavigation(event)) {
        return;
      }

      // Used to disable findActiveIndex if the page scrolls due to a click
      clickedRef.current = true;
      unsetClickedRef.current = setTimeout(() => {
        clickedRef.current = false;
      }, 1000);

      if (activeState !== id) {
        setActiveState(id);
      }
    };

  React.useEffect(
    () => () => {
      if (unsetClickedRef.current) clearTimeout(unsetClickedRef.current);
    },
    [],
  );

  return (
    <Accordion
      elevation={0}
      disableGutters
      defaultExpanded={!replie}
      color="secondary"
      sx={{
        alignSelf: "flex-start",
        position: "sticky",
        top: haut,
        ...sx,
      }}
    >
      <AccordionSummary aria-controls={`${idBase}-contenu`} id={`${idBase}-titre`}>
        <Typography>{titre}</Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          // Sommaire potentiellement plus haut que l'écran (longs débats) : on
          // borne la hauteur et on fait défiler en interne.
          maxHeight: `calc(100vh - ${haut + 70}px)`,
          overflowY: "auto",
        }}
      >
        <Stack direction="column" spacing={2} pb={3}>
          {entrees.map(({ id, libelle, niveau = 1 }, index) =>
            activeState === id || (activeState === null && index === 0) ? (
              <Box
                key={id}
                sx={{
                  backgroundColor: theme.palette.grey[900],
                  p: 1,
                  borderRadius: 2,
                  ml: niveau === 2 ? 1.5 : 0,
                }}
              >
                <Typography
                  color="#fff"
                  component="a"
                  href={`#${id}`}
                  variant={niveau === 2 ? "body2" : "body1"}
                >
                  {libelle}
                </Typography>
              </Box>
            ) : (
              <Typography
                key={id}
                component="a"
                href={`#${id}`}
                variant="body2"
                onClick={handleClick(id)}
                sx={{
                  pl: niveau === 2 ? 1.5 : 0,
                  fontWeight: hierarchise && niveau === 1 ? 600 : undefined,
                  color: niveau === 2 ? "text.secondary" : undefined,
                }}
              >
                {libelle}
              </Typography>
            ),
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
