import * as React from "react";
import { unstable_cache } from "next/cache";
import { Acteur, Mandat, Organe } from "@prisma/client";
import { unique } from "@/utils/unique";
import { getOrgane } from "./getOrgane";
import { resolveAuGouvernementBatch } from "./helpers/resolveAuGouvernement";

export type ActeurDepute = Acteur & {
  mandatPrincipal: Mandat;
  auGouvernement: boolean;
};

/**
 *
 * @param legislature Revois la liste des deputes pour une legislature donnée
 * @returns
 */
async function getDeputesUnCached(legislature: number): Promise<{
  acteurs: Record<string, ActeurDepute>;
  groups: Record<string, Organe>;
} | null> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/acteurs/?chambre=AN&actif=true&perPage=1000&include=mandatPrincipal`
    );

    const { data } = (await rep.json()) as {
      data: (Acteur & { mandatPrincipal: Mandat })[];
    };

    // Enrichit les députés au gouvernement (récupère leur vrai mandat ASSEMBLEE
    // et la photo standard à la place de la marianne).
    const enriched = (await resolveAuGouvernementBatch(data)) as ActeurDepute[];

    const groupsUid = unique(enriched.map((item) => item.groupeParlementaireUid));

    const groupsArray = await Promise.all(
      groupsUid.map(async (uid) => (uid === null ? null : await getOrgane(uid)))
    );

    const acteurs = Object.fromEntries(enriched.map((item) => [item.uid, item]));
    const groups = Object.fromEntries(
      groupsArray
        .filter((item) => item !== null)
        .map((item) => [item!.uid, item!])
    );

    // Si aucun groupe n'a pu être chargé mais qu'on attend des groupes
    // (acteurs avec groupeParlementaireUid), on lève une erreur pour éviter
    // de mettre en cache un résultat dégradé : unstable_cache ne stocke pas
    // les exceptions, la prochaine requête fera une nouvelle tentative.
    const expectedGroups = groupsUid.filter(uid => uid !== null).length;
    if (expectedGroups > 0 && Object.keys(groups).length === 0) {
      throw new Error("getDeputes: tous les appels getOrgane ont échoué, résultat non mis en cache.");
    }

    return { acteurs, groups };
  } catch (error) {
    console.error("Error fetching deputes:", error);
    return null;
  }
}

// unstable_cache persiste le résultat entre les requêtes (contrairement à React.cache
// qui ne déduplique qu'au sein d'une même requête). La page reste dynamique — l'API
// Tricoteuses n'est appelée qu'une fois par heure au lieu d'une fois par visiteur.
const getDeputesCached = unstable_cache(getDeputesUnCached, ["deputes-list"], {
  revalidate: 3600,
});

export const getDeputes = React.cache(getDeputesCached);
