import { unstable_cache } from "next/cache";
import type { VoteWithActeur } from "@/app/[legislature]/dossier/[id]/votes/votes.type";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

async function fetchScrutinVotes(apiUrl: string, uid: string): Promise<VoteWithActeur[]> {
  const response = await fetchTricoteuses(
    `${apiUrl}/scrutins/${uid}?include=votes.acteurRef,votes.groupeVotantRef.organeRef`,
    // La réponse brute dépasse parfois la limite Next de 2 Mo. Mettre en
    // cache le résultat projeté ci-dessous, pas cette réponse volumineuse.
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error("Upstream unavailable");
  const { data } = await response.json();
  if (!data || !Array.isArray(data.votes)) throw new Error("Invalid votes response");
  return (data.votes as VoteWithActeur[]).map((vote) => ({
    ...vote,
    acteurRef: vote.acteurRef ? {
      uid: vote.acteurRef.uid, slug: vote.acteurRef.slug,
      prenom: vote.acteurRef.prenom, nom: vote.acteurRef.nom,
      urlImage: vote.acteurRef.urlImage,
    } : null,
    groupeVotantRef: vote.groupeVotantRef ? {
      uid: vote.groupeVotantRef.uid,
      organeRef: vote.groupeVotantRef.organeRef ? {
        libelle: vote.groupeVotantRef.organeRef.libelle,
        libelleAbrev: vote.groupeVotantRef.organeRef.libelleAbrev,
        couleurAssociee: vote.groupeVotantRef.organeRef.couleurAssociee,
      } : null,
    } : null,
  }));
}

// Les exceptions ne sont pas mises en cache. Aucune liste vide de substitution
// n'est enregistrée en cas de panne. L'URL source fait partie de la clé.
const cached = unstable_cache(fetchScrutinVotes, ["scrutin-votes-light-v1"], { revalidate: 60 });
/**
 * Notre base d'abord (cf. data/mongo/votesScrutinAN.ts), identique à l'API à
 * la date près (l'API la décalait d'un jour) ; l'API reste le repli pour un
 * scrutin pas encore importé.
 */
export async function getScrutinVotes(uid: string): Promise<VoteWithActeur[]> {
  try {
    const { getScrutinVotesAN } = await import("./mongo/votesScrutinAN");
    const depuisBase = await getScrutinVotesAN(uid);
    if (depuisBase) return depuisBase;
  } catch (error) {
    console.warn("getScrutinVotes: lecture de la base impossible, repli sur l'API", uid, error);
  }
  return cached(process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL ?? "", uid);
}
