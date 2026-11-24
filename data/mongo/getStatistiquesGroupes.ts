import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";
import type { StatistiquesGroupes } from "@/lib/proximite";

/**
 * Nom complet de chaque groupe, par abréviation (« DEM » → « Les Démocrates ») :
 * celui du groupe le plus récent pour une abréviation reprise (UDR). Les
 * sigles seuls ne disent rien à la plupart des lecteurs.
 */
export const getLibellesGroupes = cache(async (legislature = 17): Promise<Record<string, string>> => {
  try {
    const db = await getParlementDb();
    const organes = await db
      .collection("organes")
      .find(
        { codeType: "GP", legislature: String(legislature) },
        { projection: { _id: 0, libelle: 1, libelleAbrev: 1, "viMoDe.dateDebut": 1 } }
      )
      .toArray();
    const libelles = new Map<string, { libelle: string; debut: string }>();
    for (const organe of organes) {
      const abrev = typeof organe.libelleAbrev === "string" ? organe.libelleAbrev : null;
      if (!abrev || typeof organe.libelle !== "string") continue;
      const debut = String(organe.viMoDe?.dateDebut ?? "");
      const connu = libelles.get(abrev);
      if (!connu || debut > connu.debut) libelles.set(abrev, { libelle: organe.libelle, debut });
    }
    return Object.fromEntries([...libelles].map(([abrev, { libelle }]) => [abrev, libelle]));
  } catch (error) {
    console.error("Error fetching libellés des groupes:", error);
    return {};
  }
});

/**
 * Cohésion des groupes et proximité de vote entre groupes, par période
 * (collection `statistiques_groupes`, calculée chaque nuit par
 * statistiques_activite.py). Serveur uniquement.
 *
 * Le calcul désigne les groupes par leur abréviation ; leur nom complet vient
 * de `getLibellesGroupes`.
 */
export const getStatistiquesGroupes = cache(
  async (legislature = 17): Promise<StatistiquesGroupes[]> => {
    try {
      const db = await getParlementDb();
      const [documents, libelles] = await Promise.all([
        db
          .collection("statistiques_groupes")
          .find({ legislature }, { projection: { _id: 0, periode: 1, scrutins: 1, groupes: 1, paires: 1 } })
          .toArray(),
        getLibellesGroupes(legislature),
      ]);

      return (documents as unknown as StatistiquesGroupes[]).map((document) => ({
        ...document,
        groupes: document.groupes.map((g) => ({ ...g, libelle: libelles[g.groupe] ?? null })),
      }));
    } catch (error) {
      console.error("Error fetching statistiques groupes:", error);
      return [];
    }
  }
);
