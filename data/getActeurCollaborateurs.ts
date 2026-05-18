import { getParlementDb } from "@/lib/mongodb";
import { cache } from "react";

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

    const mandats: Array<Record<string, unknown>> =
      acteur?.mandats?.mandat ?? [];
    const mandatAN = mandats.find((m) => m.typeOrgane === "ASSEMBLEE");
    const collaborateurs: Array<Record<string, string | null>> =
      (mandatAN?.collaborateurs as { collaborateur?: Array<Record<string, string | null>> })
        ?.collaborateur ?? [];

    return collaborateurs.map((c) => ({
      qualite: c.qualite ?? null,
      prenom: c.prenom ?? null,
      nom: c.nom ?? null,
    }));
  }
);
