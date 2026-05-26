import * as React from "react";
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
        .map((item) => [item.uid, item])
    );

    return { acteurs, groups };
  } catch (error) {
    console.error("Error fetching deputes:", error);
    return null;
  }
}

export const getDeputes = React.cache(getDeputesUnCached);
