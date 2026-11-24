import type { Metadata } from "next";
import PageIntrouvable from "@/components/erreurs/PageIntrouvable";

export const metadata: Metadata = {
  title: "Page introuvable — NosDéputés.fr",
  robots: { index: false },
};

export default function NotFound() {
  return <PageIntrouvable />;
}
