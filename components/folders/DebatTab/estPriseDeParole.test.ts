import { describe, expect, it } from "vitest";
import { estPriseDeParole } from "./estPriseDeParole";

const p = (codeGrammaire: string, extra: { acteurRefUid?: string | null; orateur?: string | null; texte?: string | null } = {}) => ({
  codeGrammaire,
  acteurRefUid: "PA793696",
  orateur: "M. Serge Muller",
  texte: "Il vise à renforcer la sécurité juridique…",
  ...extra,
});

describe("estPriseDeParole", () => {
  it("garde les codes de prise de parole habituels", () => {
    expect(estPriseDeParole(p("PAROLE_GENERIQUE"))).toBe(true);
    expect(estPriseDeParole(p("INTERRUPTION_1_10", { acteurRefUid: null }))).toBe(true);
  });

  it("reconnaît la défense d'un amendement et le rappel au règlement", () => {
    expect(estPriseDeParole(p("DISC_ARTICLES_4_20"))).toBe(true);
    expect(estPriseDeParole(p("DISC_ARTICLES_4_50", { acteurRefUid: "PA719024", orateur: "M. le président" }))).toBe(true);
    expect(estPriseDeParole(p("RAP_REGLEMENT_2_2"))).toBe(true);
  });

  it("laisse en didascalie les formules de la présidence, les titres et les paragraphes sans orateur", () => {
    expect(estPriseDeParole(p("SUSP_SEANCE_2_1"))).toBe(false);
    expect(estPriseDeParole(p("SCRUT_ADTS_1_6"))).toBe(false);
    expect(estPriseDeParole(p("ODJ_APPEL_DISCUSSION"))).toBe(false);
    expect(estPriseDeParole(p("DISC_ARTICLES_2_4"))).toBe(false);
    expect(estPriseDeParole(p("DISC_ARTICLES_1_1", { acteurRefUid: null, orateur: null }))).toBe(false);
    expect(estPriseDeParole(p("DISC_ARTICLES_4_20", { texte: "" }))).toBe(false);
  });
});
