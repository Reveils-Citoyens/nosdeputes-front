import { getFluxDepute } from "@/data/flux/fluxDepute";
import { reponseRss } from "@/lib/rss";

// Données mises à jour à l'import nocturne : réponse mise en cache une heure
// (ISR). La liste vide de generateStaticParams est nécessaire : sans elle, Next
// ne met pas en cache un gestionnaire de route à paramètres et relance les
// requêtes à chaque appel. Rien n'est rendu au build (pas de base disponible) ;
// chaque flux est généré à sa première demande.
export const revalidate = 3600;
export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const flux = await getFluxDepute(slug);
  if (!flux) return new Response("Député introuvable", { status: 404 });
  return reponseRss(flux);
}
