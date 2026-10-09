import { unstable_cache } from "next/cache";
import { getFluxVotes } from "@/data/flux/fluxDecisions";
import { rendreRss, reponseRss } from "@/lib/rss";

// Rendu à la demande : sans paramètre, Next pré-rendrait ce flux au build,
// où la base n'est pas accessible. Le XML est conservé une heure entre les
// requêtes ; une erreur n'est pas mise en cache (nouvel essai au prochain appel).
export const dynamic = "force-dynamic";

const fluxVotes = unstable_cache(async () => rendreRss(await getFluxVotes()), ["flux-rss-votes-v1"], {
  revalidate: 3600,
});

export async function GET() {
  return reponseRss(await fluxVotes());
}
