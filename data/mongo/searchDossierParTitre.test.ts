import { describe, expect, it } from "vitest";
import { clauseRecherche, motsSignificatifs } from "./searchDossierParTitre";

describe("motsSignificatifs", () => {
  it("écarte les mots vides et les élisions", () => {
    expect(motsSignificatifs("Réforme des retraites")).toEqual(["réforme", "retraites"]);
    expect(motsSignificatifs("l'aide à mourir")).toEqual(["aide", "mourir"]);
    expect(motsSignificatifs("  fin   de vie ")).toEqual(["fin", "vie"]);
  });
});

describe("clauseRecherche", () => {
  it("garde la recherche approchée et par début de mot pour un seul mot", () => {
    const clause = clauseRecherche("Arcelor") as { compound: { should: object[] } };
    expect(clause.compound.should).toHaveLength(2);
    expect(JSON.stringify(clause)).toContain('"query":"arcelor*"');
  });

  it("exige chaque mot significatif et favorise l'expression exacte", () => {
    const clause = clauseRecherche("fin de vie");
    const texte = JSON.stringify(clause);
    // « fin » exigé tel quel, sans faute tolérée : « vie » ne doit pas trouver « vote ».
    expect(clause.compound.must?.[0]).toEqual({ text: { query: "fin", path: expect.any(Array) } });
    expect(texte).not.toContain("fuzzy");
    expect(clause.compound.should).toEqual([expect.objectContaining({ phrase: expect.objectContaining({ query: "fin de vie" }) })]);
    // Dernier mot : accepté aussi par son début, pour la recherche pendant la frappe.
    expect(JSON.stringify(clauseRecherche("intelligence art"))).toContain('"query":"art*"');
    expect(JSON.stringify(clauseRecherche("intelligence artificielle"))).toContain("fuzzy");
  });
});
