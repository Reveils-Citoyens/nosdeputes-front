import type { ReturnedActeur } from "./getActeur";
import { getActeur } from "./getActeur";
import { resolveAuGouvernementBatch } from "./helpers/resolveAuGouvernement";

export type DebateActeur = Pick<ReturnedActeur,
  "uid" | "prenom" | "nom" | "slug" | "urlImage" | "auGouvernement"
> & {
  mandatPrincipal: Pick<NonNullable<ReturnedActeur["mandatPrincipal"]>, "chambre"> | null;
  groupeParlementaire: Pick<NonNullable<ReturnedActeur["groupeParlementaire"]>,
    "uid" | "libelle" | "libelleAbrev" | "libelleAbrege" | "couleurAssociee"
  > | null;
};

function project(acteur: ReturnedActeur): DebateActeur {
  const group = acteur.groupeParlementaire;
  return {
    uid: acteur.uid, prenom: acteur.prenom, nom: acteur.nom, slug: acteur.slug,
    urlImage: acteur.urlImage, auGouvernement: acteur.auGouvernement,
    mandatPrincipal: acteur.mandatPrincipal ? { chambre: acteur.mandatPrincipal.chambre } : null,
    groupeParlementaire: group ? {
      uid: group.uid, libelle: group.libelle, libelleAbrev: group.libelleAbrev,
      libelleAbrege: group.libelleAbrege, couleurAssociee: group.couleurAssociee,
    } : null,
  };
}

export async function getDebateActeurs(uids: string[]): Promise<DebateActeur[]> {
  const unique = [...new Set(uids)];
  const batches: string[][] = [];
  for (let i = 0; i < unique.length; i += 50) batches.push(unique.slice(i, i + 50));
  const results = await Promise.all(batches.map(async (batch) => {
    let acteurs: ReturnedActeur[] = [];
    try {
      const params = new URLSearchParams({
        uid: batch.join(","), include: "mandatPrincipal,groupeParlementaire", perPage: "50",
      });
      const response = await fetch(`${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/acteurs?${params}`,
        { next: { revalidate: 60 } });
      if (!response.ok) throw new Error("Actors unavailable");
      const { data } = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid actors response");
      acteurs = await resolveAuGouvernementBatch(data.filter((a: ReturnedActeur) => batch.includes(a.uid)));
    } catch {
      // Une API ancienne ou une panne du batch ne supprime pas les orateurs.
    }
    const found = new Set(acteurs.map((a) => a.uid));
    const missing = await Promise.all(batch.filter((uid) => !found.has(uid)).map((uid) => getActeur(uid)));
    return [...acteurs, ...missing.filter((a): a is ReturnedActeur => a !== null)].map(project);
  }));
  return results.flat();
}
