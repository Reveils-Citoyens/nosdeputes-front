import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/getVideoReunion", () => ({ getVideoReunion: async () => null }));

const paragraphe = (ordre: number, texte: string) => ({
  ordre_absolu_seance: String(ordre),
  orateurs: { orateur: { nom: "Mme Exemple" } },
  code_grammaire: "PAROLE_GENERIQUE",
  texte: { _: texte },
});

const collections: Record<string, any[]> = {
  statistiques_quotidiennes: [
    {
      type: "interventionCommission",
      details: [
        {
          compteRenduUid: "CR-AVEC",
          interventions: 3,
          paragraphes: [
            { ordre: 30, presidence: false },
            { ordre: 10, presidence: false },
            { ordre: 20, presidence: true },
          ],
        },
        // Chiffre calculé avant l'enregistrement des paragraphes.
        { compteRenduUid: "CR-ANCIEN", interventions: 2 },
      ],
    },
  ],
  comptes_rendus: [
    {
      uid: "CR-AVEC",
      contenu: { point: [paragraphe(10, "Première intervention"), { sous: [paragraphe(20, "La parole est à M. X"), paragraphe(30, "Troisième")] }, paragraphe(40, "Non comptée par le calcul")] },
    },
  ],
};

vi.mock("@/lib/mongodb", () => ({
  getParlementDb: async () => ({
    collection: (nom: string) => ({
      find: (filtre: any) => ({
        toArray: async () =>
          (collections[nom] ?? []).filter((doc) => !filtre?.uid?.$in || filtre.uid.$in.includes(doc.uid)),
      }),
    }),
  }),
}));

describe("getDetailJournee — interventions en commission", () => {
  it("affiche exactement les paragraphes comptés, présidence comprise mais écartée", async () => {
    const { getDetailJournee } = await import("./getDetailJournee");
    const detail = await getDetailJournee("PA1", "2026-06-10");
    const [avec, ancien] = detail!.interventionsCommission;

    expect(avec).toMatchObject({ compteRenduUid: "CR-AVEC", nombre: 2, detailDisponible: true });
    expect(avec.interventions.map((i) => [i.ordre, i.texte, i.retenue, i.motif])).toEqual([
      [10, "Première intervention", true, null],
      [20, "La parole est à M. X", false, "presidence"],
      [30, "Troisième", true, null],
    ]);
    expect(avec.interventions.every((i) => i.seconde === null)).toBe(true);

    expect(ancien).toEqual({ compteRenduUid: "CR-ANCIEN", nombre: 2, interventions: [], detailDisponible: false });
  });
});
