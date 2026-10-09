import { SITE_URL } from "@/lib/site";

/** Élément d'un flux RSS, indépendant du format. */
export type ElementFlux = {
  /**
   * Identifiant stable : un lecteur RSS ne réaffiche jamais deux fois le même.
   * On utilise les uid de l'Assemblée (acte, scrutin, question…).
   */
  guid: string;
  titre: string;
  /** Chemin sur le site (« /17/dossier/… ») ou URL absolue. */
  lien: string;
  /** Texte brut, sans HTML. */
  description?: string;
  date: Date;
};

export type Flux = {
  titre: string;
  /** Chemin de la page suivie. */
  lien: string;
  /** Chemin du flux lui-même. */
  chemin: string;
  description: string;
  elements: ElementFlux[];
};

/** Nombre maximal d'éléments par flux : les lecteurs n'en gardent pas plus. */
export const MAX_ELEMENTS = 50;

// Caractères interdits en XML 1.0 (contrôles hors tabulation et retours à la
// ligne) : un seul suffit à rendre le flux illisible pour certains lecteurs.
const CARACTERES_INTERDITS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;

export function echapperXml(texte: string): string {
  return texte
    .replace(CARACTERES_INTERDITS, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function urlAbsolue(lien: string): string {
  return /^https?:\/\//.test(lien) ? lien : `${SITE_URL}${lien}`;
}

/**
 * Date d'un acte parlementaire. Les sources ne donnent que le jour
 * (« 2026-07-21 » ou minuit UTC) : placée à minuit, elle s'afficherait la
 * veille dans les lecteurs à l'ouest de Paris. On la fixe à 10 h UTC
 * (11 h ou 12 h à Paris), qui reste le même jour partout en France.
 */
export function dateDuJour(valeur: string | Date | null | undefined): Date | null {
  if (!valeur) return null;
  const jour = (valeur instanceof Date ? valeur.toISOString() : String(valeur)).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(jour)) return null;
  const date = new Date(`${jour}T10:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatJour(date: Date): string {
  return date
    .toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    })
    .replace(/^1 /, "1er ");
}

/** Trie du plus récent au plus ancien, retire les doublons de guid, limite. */
export function preparerElements(elements: ElementFlux[]): ElementFlux[] {
  const vus = new Set<string>();
  return [...elements]
    .sort((a, b) => b.date.getTime() - a.date.getTime() || a.guid.localeCompare(b.guid))
    .filter((e) => (vus.has(e.guid) ? false : (vus.add(e.guid), true)))
    .slice(0, MAX_ELEMENTS);
}

/** Sérialise un flux en RSS 2.0, avec le lien `atom:link rel="self"` recommandé. */
export function rendreRss(flux: Flux): string {
  const elements = preparerElements(flux.elements);
  const derniereDate = elements[0]?.date;
  const items = elements
    .map((e) =>
      [
        "    <item>",
        `      <title>${echapperXml(e.titre)}</title>`,
        `      <link>${echapperXml(urlAbsolue(e.lien))}</link>`,
        `      <guid isPermaLink="false">${echapperXml(e.guid)}</guid>`,
        `      <pubDate>${e.date.toUTCString()}</pubDate>`,
        e.description ? `      <description>${echapperXml(e.description)}</description>` : null,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${echapperXml(flux.titre)}</title>`,
    `    <link>${echapperXml(urlAbsolue(flux.lien))}</link>`,
    `    <atom:link href="${echapperXml(urlAbsolue(flux.chemin))}" rel="self" type="application/rss+xml" />`,
    `    <description>${echapperXml(flux.description)}</description>`,
    "    <language>fr-FR</language>",
    derniereDate ? `    <lastBuildDate>${derniereDate.toUTCString()}</lastBuildDate>` : null,
    // Les données ne changent qu'à l'import nocturne : inutile de relire le
    // flux plus d'une fois par heure.
    "    <ttl>60</ttl>",
    items || null,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((ligne) => ligne !== null)
    .join("\n");
}

export function reponseRss(flux: Flux | string): Response {
  return new Response(typeof flux === "string" ? flux : rendreRss(flux), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, stale-while-revalidate=3600",
    },
  });
}

/** Lien `<link rel="alternate">` pour la découverte automatique du flux. */
export function alternateRss(chemin: string, titre: string) {
  return { "application/rss+xml": [{ url: chemin, title: titre }] };
}

/** Flux général (app/rss.xml), annoncé sur l'accueil et la liste des dossiers. */
export const ALTERNATE_FLUX_GENERAL = alternateRss(
  "/rss.xml",
  "Votes sur les textes à l'Assemblée nationale — flux RSS",
);
