import type { MetadataRoute } from "next";
import { SITE_URL, IS_INDEXABLE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Hors prod (beta.nosdeputes.fr, staging…) : on interdit tout le crawl pour
  // ne pas indexer un environnement non canonique.
  if (!IS_INDEXABLE) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // On exclut les routes techniques et transactionnelles (les pages de
        // gestion d'alertes portent un token et sont déjà en noindex).
        disallow: [
          "/api/",
          "/alertes/gerer",
          "/alertes/confirme",
          "/alertes/desabonne",
          "/alertes/erreur",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
