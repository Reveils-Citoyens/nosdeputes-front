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

describe("getDetailJournee — séance publique, mêmes règles que le calcul", () => {
  it("distingue ce qui établit la présence de ce qui compte comme intervention", async () => {
    const { analyserParagrapheSeance } = await import("./getDetailJournee");
    const long = "x".repeat(51);
    const fond = { code_grammaire: "PAROLE_GENERIQUE", orateurs: { orateur: { nom: "Mme Exemple" } } };
    const presidence = { code_grammaire: "PAROLE_GENERIQUE", orateurs: { orateur: { nom: "Mme la présidente" } } };
    const procedure = { code_grammaire: "RAP_REGLEMENT_2_2", orateurs: { orateur: { nom: "Mme Exemple" } } };
    const amendement = { code_grammaire: "DISC_ARTICLES_3_4_1", orateurs: { orateur: { nom: "Mme Exemple" } } };
    const sansOrateur = { code_grammaire: "OUV_SEAN_1_1", orateurs: { orateur: { nom: "" } } };

    // Prise de parole de fond courte : intervention comptée (pas de seuil de
    // longueur pour le compteur), mais insuffisante pour la présence.
    expect(analyserParagrapheSeance(fond, "Très bien !")).toEqual({ retenue: true, motif: null, etablitPresence: false });
    // Présidence ou procédure de plus de 50 caractères : établit la présence,
    // sans compter comme intervention.
    expect(analyserParagrapheSeance(presidence, long)).toEqual({ retenue: false, motif: "presidence", etablitPresence: true });
    expect(analyserParagrapheSeance(procedure, long)).toEqual({ retenue: false, motif: "procedure", etablitPresence: true });
    // Défense d'un amendement : intervention de fond sous un code de rubrique.
    expect(analyserParagrapheSeance(amendement, long)).toEqual({ retenue: true, motif: null, etablitPresence: true });
    // Identifiant sans orateur nommé (« Présidence de M. X ») : procédure.
    expect(analyserParagrapheSeance(sansOrateur, long).motif).toBe("procedure");
    // Le seuil est strict : 50 caractères ne suffisent pas.
    expect(analyserParagrapheSeance(fond, "x".repeat(50)).etablitPresence).toBe(false);
  });
});

describe("statutDansLesPrises — la page relit les prises de parole comptées", () => {
  it("compte le premier paragraphe, signale la suite, la présidence et le reste", async () => {
    const { statutDansLesPrises } = await import("./getDetailJournee");
    const prises = [
      { ordre: 2, presidence: false, suite: [3, 6] },
      { ordre: 9, presidence: true },
    ];
    expect(statutDansLesPrises(2, prises)).toEqual({ retenue: true, motif: null });
    expect(statutDansLesPrises(6, prises)).toEqual({ retenue: false, motif: "suite" });
    expect(statutDansLesPrises(9, prises)).toEqual({ retenue: false, motif: "presidence" });
    expect(statutDansLesPrises(4, prises)).toBeNull();
  });
});
