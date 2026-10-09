import type { Metadata } from "next";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

export const SITE_NAME = "NosDéputés.fr";

// Image générée par app/opengraph-image.tsx.
const IMAGE_PAR_DEFAUT = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "NosDéputés.fr, observatoire citoyen de l'activité parlementaire",
};

/**
 * Next ne fusionne pas `openGraph` : celui d'une page remplace entièrement
 * celui du layout racine, image de partage comprise. On réinjecte donc ici
 * les champs communs.
 *
 * Une route qui a son propre `opengraph-image.tsx` passe `imageDediee: true` :
 * déclarer `images` masquerait alors l'image générée pour ce segment.
 */
export function openGraphPage(og: OpenGraph, { imageDediee = false } = {}): OpenGraph {
  return {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
    ...(imageDediee ? {} : { images: IMAGE_PAR_DEFAUT }),
    ...og,
  } as OpenGraph;
}
