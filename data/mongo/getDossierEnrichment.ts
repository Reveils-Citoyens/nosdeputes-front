import { getParlementDb } from "@/lib/mongodb";
import { cache } from "react";

export type Enjeu = {
  sujet: string;
  importance: string | null;
  arbitrages: string | null;
};

export type ActeurConcerne = {
  acteur: string;
  impact: string | null;
};

export type DossierEnrichment = {
  tldr: string | null;
  pourquoi: string | null;
  objectif: string | null;
  enjeux: Enjeu[];
  ce_qui_change: string[];
  acteurs_concernes: ActeurConcerne[];
  themes_ouverts: string[];
  themes_senat: string[];
  model_name: string | null;
};

export const getDossierEnrichment = cache(
  async (uid: string): Promise<DossierEnrichment | null> => {
    const db = await getParlementDb();
    const doc = await db.collection("dossiers_enrichis").findOne(
      { uid },
      {
        projection: {
          _id: 0,
          "dossier_summary_enrichment.structured_summary": 1,
          "dossier_summary_enrichment.qualification.themes_ouverts": 1,
          "dossier_summary_enrichment.qualification.themes_senat": 1,
          "dossier_summary_enrichment.model_name": 1,
        },
      }
    );
    if (!doc) return null;

    const s = doc.dossier_summary_enrichment?.structured_summary;
    if (!s) return null;

    const enjeux: Enjeu[] = Array.isArray(s.enjeux)
      ? s.enjeux
          .filter((e: unknown) => e && typeof e === "object")
          .map((e: Record<string, unknown>) => ({
            sujet: typeof e.sujet === "string" ? e.sujet : "",
            importance: typeof e.importance === "string" ? e.importance : null,
            arbitrages: typeof e.arbitrages === "string" ? e.arbitrages : null,
          }))
          .filter((e: Enjeu) => e.sujet)
      : [];

    const acteurs_concernes: ActeurConcerne[] = Array.isArray(s.acteurs_concernes)
      ? s.acteurs_concernes
          .filter((a: unknown) => a && typeof a === "object")
          .map((a: Record<string, unknown>) => ({
            acteur: typeof a.acteur === "string" ? a.acteur : "",
            impact: typeof a.impact === "string" ? a.impact : null,
          }))
          .filter((a: ActeurConcerne) => a.acteur)
      : [];

    const ce_qui_change: string[] = Array.isArray(s.ce_qui_change)
      ? s.ce_qui_change.filter((c: unknown) => typeof c === "string" && c)
      : [];

    const qual = doc.dossier_summary_enrichment?.qualification;

    const themes_ouverts: string[] = Array.isArray(qual?.themes_ouverts)
      ? qual.themes_ouverts.filter((t: unknown) => typeof t === "string" && t)
      : [];

    const themes_senat: string[] = Array.isArray(qual?.themes_senat)
      ? qual.themes_senat.filter((t: unknown) => typeof t === "string" && t)
      : [];

    return {
      tldr: typeof s.tldr === "string" ? s.tldr : null,
      pourquoi: typeof s.pourquoi === "string" ? s.pourquoi : null,
      objectif: typeof s.objectif === "string" ? s.objectif : null,
      enjeux,
      ce_qui_change,
      acteurs_concernes,
      themes_ouverts,
      themes_senat,
      model_name: typeof doc.dossier_summary_enrichment?.model_name === "string"
        ? doc.dossier_summary_enrichment.model_name
        : null,
    };
  }
);
