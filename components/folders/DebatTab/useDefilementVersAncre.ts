"use client";

import * as React from "react";

/**
 * Ancres des prises de parole (« #p-675 ») : les flux RSS, la fiche député et
 * la recherche y mènent.
 */
const ANCRE_PAROLE = /^p-\d+$/;

/**
 * Pendant ce délai, la position est recalée : les avatars, chargés après coup,
 * et les polices décalent le fil au-dessus de l'intervention visée.
 */
const RECALAGE_MS = 2500;

/** Attribut posé sur l'intervention visée, pour la mettre en évidence. */
export const ATTRIBUT_CIBLE = "data-cible";

const GESTES = ["wheel", "touchstart", "keydown", "mousedown"] as const;

/**
 * Amène la page sur l'intervention désignée par l'ancre de l'adresse.
 *
 * Le navigateur ne le fait pas seul : le compte rendu arrive en flux, après
 * son premier rendu, et la page reste en haut. Le recalage cesse dès que le
 * lecteur fait défiler lui-même.
 */
export function useDefilementVersAncre() {
  React.useEffect(() => {
    let arreter: (() => void) | null = null;

    const viser = () => {
      arreter?.();
      document.querySelectorAll(`[${ATTRIBUT_CIBLE}]`).forEach((e) => e.removeAttribute(ATTRIBUT_CIBLE));

      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!ANCRE_PAROLE.test(id)) return;
      const cible = document.getElementById(id);
      if (!cible) return;
      cible.setAttribute(ATTRIBUT_CIBLE, "");

      const debut = performance.now();
      let image = 0;
      const recaler = () => {
        const marge = parseFloat(getComputedStyle(cible).scrollMarginTop) || 0;
        const ecart = cible.getBoundingClientRect().top - marge;
        if (Math.abs(ecart) > 2) window.scrollBy(0, ecart);
        if (performance.now() - debut < RECALAGE_MS) image = requestAnimationFrame(recaler);
      };
      const lacher = () => arreter?.();
      GESTES.forEach((g) => window.addEventListener(g, lacher, { passive: true }));
      arreter = () => {
        cancelAnimationFrame(image);
        GESTES.forEach((g) => window.removeEventListener(g, lacher));
        arreter = null;
      };
      recaler();
    };

    viser();
    window.addEventListener("hashchange", viser);
    return () => {
      arreter?.();
      window.removeEventListener("hashchange", viser);
    };
  }, []);
}
