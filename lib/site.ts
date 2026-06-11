// URL publique canonique du déploiement, injectée au build via
// NEXT_PUBLIC_BASE_URL (cf. Dockerfile + secret GitHub). Défaut = prod.
export const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.nosdeputes.fr";

// On n'autorise l'indexation par les moteurs QUE sur le domaine de production
// canonique. Tout autre domaine (beta.nosdeputes.fr, staging, previews…) est
// passé en noindex pour ne pas créer de contenu dupliqué avec le site officiel
// ni polluer son référencement.
export const IS_INDEXABLE = SITE_URL === "https://www.nosdeputes.fr";
