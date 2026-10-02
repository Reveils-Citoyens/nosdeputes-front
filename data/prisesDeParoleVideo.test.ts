import { describe, expect, it, vi } from "vitest";
import {
  calculerPrisesDeParole,
  choisirCandidates,
  type SourcesPrisesDeParole,
} from "./prisesDeParoleVideo";

const long = (mot: string) => `${mot} `.repeat(60);

function intervention(n: number, extra: Record<string, unknown> = {}) {
  return {
    uid: `I${n}`,
    dateSeance: `2026-06-${String(30 - n).padStart(2, "0")}T14:00:00.000Z`,
    debatRefUid: `CRSANR5L17S2026O1N${n}`,
    dossierRefUid: `DLR${n}`,
    stime: String(100 + n),
    texte: long(`texte${n}`),
    ...extra,
  };
}

function sources(
  interventions: unknown[] | null,
  disponibilite: Record<string, boolean | null> = {}
): SourcesPrisesDeParole {
  return {
    interventions: vi.fn(async () => interventions as never),
    reunionDuCompteRendu: vi.fn(async (debat: string) => `RU-${debat}`),
    videoReunion: vi.fn(async (reunion: string | null) => ({
      flux: `https://flux/${reunion}`,
      page: `https://page/${reunion}`,
      secondeDebut: 10,
    })),
    fluxDisponible: vi.fn(async (url: string | null) => {
      const cle = Object.keys(disponibilite).find((k) => url?.includes(k));
      return cle ? disponibilite[cle] : true;
    }),
    vignette: vi.fn(async (page: string | null) => (page ? `${page}.jpg` : null)),
    titreDossier: vi.fn(async (uid: string | null) => `Titre ${uid}`),
  };
}

describe("choisirCandidates", () => {
  it("garde la séance publique, une intervention substantielle par sujet, la plus longue", () => {
    const candidates = choisirCandidates([
      intervention(1),
      intervention(2, { debatRefUid: "CRCANR5L17S2026PO1N1" }), // commission
      intervention(3, { texte: "trop court" }),
      intervention(4, { stime: null }),
      intervention(5, { dossierRefUid: "DLR1", texte: long("plus-long-sur-le-meme-sujet") }),
    ]);
    expect(candidates.map((c) => c.uid)).toEqual(["I5"]);
  });

  it("nettoie le balisage et regroupe par jour sans dossier", () => {
    const [candidate] = choisirCandidates([
      intervention(1, { dossierRefUid: null, texte: `${long("aaaa")}<br/>&amp;<italique>b</italique>` }),
    ]);
    expect(candidate.texte.endsWith("aaaa &b")).toBe(true);
  });
});

describe("calculerPrisesDeParole", () => {
  it("retient les trois sujets les plus récents dont la vidéo répond, dans l'ordre", async () => {
    const s = sources(
      [1, 2, 3, 4, 5].map((n) => intervention(n)),
      { N2: false }
    );
    const resultat = await calculerPrisesDeParole("PA1", s);

    expect(resultat?.incomplet).toBe(false);
    expect(resultat?.prises.map((p) => p.compteRenduUid)).toEqual([
      "CRSANR5L17S2026O1N1",
      "CRSANR5L17S2026O1N3",
      "CRSANR5L17S2026O1N4",
    ]);
    expect(resultat?.prises[0]).toMatchObject({
      seconde: 101,
      dossierUid: "DLR1",
      dossierTitre: "Titre DLR1",
      vignette: "https://page/RU-CRSANR5L17S2026O1N1.jpg",
    });
    // Vignette et titre seulement pour les retenues.
    expect(s.vignette).toHaveBeenCalledTimes(3);
    expect(s.titreDossier).toHaveBeenCalledTimes(3);
  });

  it("signale une vérification indéterminée sans retenir la vidéo", async () => {
    const resultat = await calculerPrisesDeParole(
      "PA1",
      sources([intervention(1), intervention(2)], { N1: null })
    );
    expect(resultat?.incomplet).toBe(true);
    expect(resultat?.prises.map((p) => p.compteRenduUid)).toEqual(["CRSANR5L17S2026O1N2"]);
  });

  it("ne marque pas incomplet une candidate au-delà des trois retenues", async () => {
    const resultat = await calculerPrisesDeParole(
      "PA1",
      sources([1, 2, 3, 4].map((n) => intervention(n)), { N4: null })
    );
    expect(resultat?.incomplet).toBe(false);
    expect(resultat?.prises).toHaveLength(3);
  });

  it("renvoie null si les interventions n'ont pas pu être lues", async () => {
    expect(await calculerPrisesDeParole("PA1", sources(null))).toBeNull();
  });

  it("ignore une candidate sans vidéo", async () => {
    const s = sources([intervention(1), intervention(2)]);
    s.videoReunion = vi.fn(async (reunion: string | null) =>
      reunion?.endsWith("N1") ? null : { flux: "https://flux/x", page: null, secondeDebut: null }
    );
    const resultat = await calculerPrisesDeParole("PA1", s);
    expect(resultat?.prises.map((p) => p.compteRenduUid)).toEqual(["CRSANR5L17S2026O1N2"]);
    expect(resultat?.prises[0].vignette).toBeNull();
  });
});
