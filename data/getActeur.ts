import * as React from "react";
import { Acteur, Mandat, Organe } from "@prisma/client";
import { getOrgane } from "./getOrgane";
import { resolveAuGouvernement } from "./helpers/resolveAuGouvernement";

async function getActeurUnCached(uid: string): Promise<
  | (Acteur & {
      groupeParlementaire: Organe | null;
      mandatPrincipal: Mandat | null;
      auGouvernement: boolean;
    })
  | null
> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/acteurs/${uid}?include=mandatPrincipal`
    );

    const { data } = await rep.json();

    if (!data) return null;

    data.groupeParlementaire = null;
    if (data.groupeParlementaireUid) {
      data.groupeParlementaire = await getOrgane(data.groupeParlementaireUid);
    }
    return await resolveAuGouvernement(data);
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return null;
  }
}

export type ReturnedActeur = Acteur & {
  groupeParlementaire: Organe | null;
  mandatPrincipal: Mandat | null;
  auGouvernement: boolean;
};
export const getActeur = React.cache(getActeurUnCached);
