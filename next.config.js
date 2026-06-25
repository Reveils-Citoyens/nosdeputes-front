/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// Origine de l'API Tricoteuses (appelée côté client via React Query) — dérivée
// de l'env pour rester correcte si l'URL change (staging → prod).
let apiOrigin = "";
try {
  if (process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL) {
    apiOrigin = new URL(process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL).origin;
  }
} catch {
  // URL invalide : on ignore, connect-src restera sur 'self' + APIs publiques.
}

// Hôte des assets (photos de députés, marianne…).
const ASSETS_HOST = "https://tricoteuses-assets.s3.fr-par.scw.cloud";
// Serveur Umami (analytics sans cookie, hébergé sur Pikapods).
const UMAMI_HOST = "https://burrowing-partridge.pikapod.net";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js injecte des scripts inline (hydratation) → 'unsafe-inline'.
  // 'unsafe-eval' seulement en dev (HMR / React Refresh).
  // Umami est chargé depuis son propre domaine Pikapods.
  `script-src 'self' 'unsafe-inline' ${UMAMI_HOST}${isDev ? " 'unsafe-eval'" : ""}`,
  // MUI / Emotion injecte des styles inline.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob: ${ASSETS_HOST}`,
  // Appels client : nos routes /api + API Tricoteuses + APIs géo (code postal)
  // + Umami /api/send (POST des events analytics).
  `connect-src 'self' https://geo.api.gouv.fr https://territoires.code4code.eu ${UMAMI_HOST}${apiOrigin ? ` ${apiOrigin}` : ""}`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

// Domaine canonique public (celui que Google doit indexer). Piloté par l'env,
// même source de vérité que les liens d'e-mail (NEXT_PUBLIC_BASE_URL).
const CANONICAL_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || "https://beta.nosdeputes.fr"
).replace(/\/$/, "");

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Redirection 301 de l'URL technique Scaleway (ex.
  // nosdeputesx49wzdoj-nos-deputes-front.functions.fnc.fr-par.scw.cloud) vers le
  // domaine canonique. Évite que Google indexe l'URL technique et la traite comme
  // du duplicate content du vrai domaine. On matche tout l'espace d'hôtes des
  // fonctions Scaleway pour rester robuste si le sous-domaine technique change.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?<scwHost>.*\\.functions\\.fnc\\.fr-par\\.scw\\.cloud)",
          },
        ],
        destination: `${CANONICAL_URL}/:path*`,
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
