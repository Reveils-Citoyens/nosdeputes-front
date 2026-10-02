import { THEMES } from "@/data/themes";
import { THEME_GROUPS } from "@/data/themeGroups";

export const MAIN_NAVIGATION_PAGES = {
  "/deputes": "Députés",
  "/dossiers": "Dossiers",
  "/themes": "Thèmes",
  "/comprendre": "Comprendre",
  "/about": "À propos",
} as const;
export type MainNavigationPath = keyof typeof MAIN_NAVIGATION_PAGES;

export type PageNavigationTarget = (
  | { kind: "search"; href: string; query: string }
  | { kind: "depute"; href: string; slug: string }
  | { kind: "main"; href: string; page: MainNavigationPath }
  | { kind: "home"; href: string }
  | { kind: "domain" | "theme"; href: string; slug: string }
  | { kind: "dossier"; href: string; legislature: string; id: string }
) & { scroll?: boolean };

/** Only supported local destinations get a full-page optimistic shell. Deputy
 * tabs keep their own navigation context and must retain the identity panel. */
export function getPageNavigationTarget(href: string, currentPath: string): PageNavigationTarget | null {
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  const url = new URL(href, "https://nosdeputes.invalid");
  // Cards and "Tous les…" links sometimes include a trailing slash.
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  currentPath = currentPath.replace(/\/+$/, "") || "/";
  if (url.pathname === "/") return currentPath === "/" ? null : { kind: "home", href };
  if (Object.hasOwn(MAIN_NAVIGATION_PAGES, url.pathname)) {
    // Clicking the current section must not flash a whole-page loader.
    return currentPath === url.pathname ? null : { kind: "main", href, page: url.pathname as MainNavigationPath };
  }
  if (url.pathname === "/recherche") {
    return { kind: "search", href, query: (url.searchParams.get("q") ?? "").trim() };
  }
  const domain = url.pathname.match(/^\/themes\/domaine\/([^/]+)$/);
  if (domain && Object.hasOwn(THEME_GROUPS, domain[1]) && currentPath !== url.pathname) {
    return { kind: "domain", href, slug: domain[1] };
  }
  const theme = url.pathname.match(/^\/themes\/([^/]+)$/);
  if (theme && Object.hasOwn(THEMES, theme[1]) && currentPath !== url.pathname) {
    return { kind: "theme", href, slug: theme[1] };
  }
  const dossier = url.pathname.match(/^\/(\d+)\/dossier\/([^/]+)$/);
  if (dossier) {
    const currentDossier = currentPath.match(/^\/(\d+)\/dossier\/([^/]+)(?:\/|$)/);
    if (currentDossier?.[1] === dossier[1] && currentDossier?.[2] === dossier[2]) return null;
    return { kind: "dossier", href, legislature: dossier[1], id: dossier[2] };
  }
  const match = url.pathname.match(/^\/depute\/([^/]+)\/?$/);
  if (!match) return null;
  const currentSlug = currentPath.match(/^\/depute\/([^/]+)(?:\/|$)/)?.[1];
  if (currentSlug === match[1]) return null;
  return { kind: "depute", href, slug: match[1] };
}
