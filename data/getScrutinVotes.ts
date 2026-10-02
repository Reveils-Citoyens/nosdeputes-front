import { unstable_cache } from "next/cache";
import type { VoteWithActeur } from "@/app/[legislature]/dossier/[id]/votes/votes.type";

async function fetchScrutinVotes(apiUrl: string, uid: string): Promise<VoteWithActeur[]> {
  const response = await fetch(
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
export function getScrutinVotes(uid: string) {
  return cached(process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL ?? "", uid);
}
