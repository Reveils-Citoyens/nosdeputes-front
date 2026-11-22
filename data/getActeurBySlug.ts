import * as React from "react";
import { Acteur, Mandat, Organe } from "@prisma/client";
import { getOrgane } from "./getOrgane";
import { resolveAuGouvernement } from "./helpers/resolveAuGouvernement";
import { cacheTricoteuses } from "./cacheTricoteuses";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

async function getActeurBySlugUnCached(slug: string): Promise<
  | (Acteur & {
      groupeParlementaire: Organe | null;
      mandatPrincipal: Mandat | null;
      auGouvernement: boolean;
    })
  | null
> {
  // Serveur : notre base d'abord (cf. data/mongo/referentielAN.ts) ; l'API ne
  // sert plus que de repli (acteurs d'autres législatures). Navigateur : notre
  // route, qui fait de même.
  if (typeof window === "undefined") {
    const { getActeurParSlugAN } = await import("./mongo/referentielAN");
    const acteur = await getActeurParSlugAN(slug);
    if (acteur) return acteur as unknown as ReturnedActeur;
  } else {
    try {
      const rep = await fetch(`/api/acteurs?slug=${encodeURIComponent(slug)}`);
      if (!rep.ok) return null;
      const { data } = await rep.json();
      return data ?? null;
    } catch (error) {
      console.error("Error fetching acteur:", error);
      return null;
    }
  }
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/acteurs/?slug=${slug}&include=mandatPrincipal`,
      cacheTricoteuses("contenu")
    );

    const { data } = await rep.json();

    if (!Array.isArray(data) || data.length === 0) {
      // Pas d'acteur trouvé
      return null;
    }

    const acteur = data[0];
    acteur.groupeParlementaire = null;
    if (acteur.groupeParlementaireUid) {
      acteur.groupeParlementaire = await getOrgane(
        acteur.groupeParlementaireUid
      );
    }
    return await resolveAuGouvernement(acteur);
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
export const getActeurBySlug = React.cache(getActeurBySlugUnCached);
