import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://www.nosdeputes.fr";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
