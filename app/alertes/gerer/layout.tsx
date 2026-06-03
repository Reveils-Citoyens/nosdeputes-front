import type { Metadata } from "next";

// La page de gestion porte un token secret dans l'URL (?token=...).
// On empêche son indexation par les moteurs de recherche et on supprime
// l'en-tête Referer pour éviter toute fuite du token vers des sites tiers.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function GererLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
