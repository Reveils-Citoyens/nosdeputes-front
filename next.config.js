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

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Next.js injecte des scripts inline (hydratation) → 'unsafe-inline'.
  // 'unsafe-eval' seulement en dev (HMR / React Refresh).
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // MUI / Emotion injecte des styles inline.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  `img-src 'self' data: blob: ${ASSETS_HOST}`,
  // Appels client : nos routes /api + API Tricoteuses + APIs géo (code postal).
  `connect-src 'self' https://geo.api.gouv.fr https://territoires.code4code.eu${apiOrigin ? ` ${apiOrigin}` : ""}`,
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

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
