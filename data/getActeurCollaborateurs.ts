import { getParlementDb } from "@/lib/mongodb";
import { cache } from "react";
import { liste } from "@/data/mongo/conversionAN";

export type Collaborateur = {
  qualite: string | null;
  prenom: string | null;
  nom: string | null;
};

export const getActeurCollaborateurs = cache(
  async (uid: string): Promise<Collaborateur[]> => {
    const db = await getParlementDb();
    const acteur = await db.collection("acteurs").findOne(
      { uid },
      { projection: { _id: 0, "mandats.mandat": 1 } }
    );

    // L'open data rend un objet seul, et non une liste, quand il n'y a qu'un
    // élément (un seul mandat, un seul collaborateur) : `.map` plantait alors
    // toute la fiche du député.
    const mandats = liste<Record<string, unknown>>(acteur?.mandats?.mandat);
    const mandatAN = mandats.find((m) => m.typeOrgane === "ASSEMBLEE");
    const collaborateurs = liste<Record<string, string | null>>(
      (mandatAN?.collaborateurs as { collaborateur?: unknown } | undefined)?.collaborateur as
        | Record<string, string | null>
        | Record<string, string | null>[]
        | undefined
    );

    return collaborateurs.map((c) => ({
      qualite: c.qualite ?? null,
      prenom: c.prenom ?? null,
      nom: c.nom ?? null,
    }));
  }
);
