import { describe, expect, it } from "vitest";
import { flattenRaw } from "./getDocumentSommaire";
import { couperApresExposeDesMotifs, flattenSeg, parseAlineas } from "./getArticleContent";

// Formats de Documents_enrichis : `articles` / `divisions` (documents enrichis
// avant fin septembre 2026) et arbre `items` (depuis, ex. PLF et PLFSS 2027).

describe("sommaire", () => {
  it("lit l'ancien format articles / divisions", () => {
    const entrees = flattenRaw({
      articles: [{ line: "Article liminaire", type: "article" }],
      divisions: [{ line: "TITRE Ier", type: "titre", articles: [{ line: "Article 1er", type: "article" }] }],
    });
    expect(entrees.map((e) => [e.label, e.key, e.isDivisionHeader])).toEqual([
      ["Article liminaire", "article liminaire", false],
      ["TITRE Ier", "titre ier", true],
      ["Article 1er", "article 1", false],
    ]);
  });

  it("lit l'arbre items, divisions imbriquées comprises", () => {
    const entrees = flattenRaw({
      items: [
        { line: "ARTICLE 1 :", type: "article" },
        {
          line: "PREMIÈRE PARTIE",
          type: "partie",
          items: [{ line: "TITRE Ier", type: "titre", items: [{ line: "Article 4", type: "article" }] }],
        },
      ],
    });
    expect(entrees.map((e) => [e.label, e.key, e.isDivisionHeader])).toEqual([
      ["Article 1", "article 1", false],
      ["PREMIÈRE PARTIE", "première partie", true],
      ["TITRE Ier", "titre ier", true],
      ["Article 4", "article 4", false],
    ]);
  });
});

describe("segmentation", () => {
  const pos = (start: number) => ({ originalTransformation: { position: { start, stop: start + 5 } } });

  it("lit l'arbre items et trie par position dans le HTML", () => {
    const items = flattenSeg({
      items: [
        { line: "ARTICLE 2 :", type: "article", ...pos(200) },
        { line: "TITRE Ier", type: "titre", ...pos(50), items: [{ line: "ARTICLE 1 :", type: "article", ...pos(100) }] },
      ],
    });
    expect(items.map((i) => [i.line, i.start])).toEqual([
      ["TITRE Ier", 50],
      ["ARTICLE 1 :", 100],
      ["ARTICLE 2 :", 200],
    ]);
  });

  it("lit toujours l'ancien format divisions / articles", () => {
    const items = flattenSeg({
      divisions: [{ line: "TITRE Ier", type: "titre", ...pos(10), articles: [{ line: "Article 1er", type: "article", ...pos(20) }] }],
    });
    expect(items.map((i) => i.line)).toEqual(["TITRE Ier", "Article 1er"]);
  });
});

describe("alinéas d'un projet de loi de finances", () => {
  const p = (classe: string, texte: string) => `<p class="${classe}">${texte}</p>`;
  const article = [
    p("assnatPastille", "(1)"),
    p("assnatFPFprojetloiartexte", "I. – Le tableau est ainsi rédigé :"),
    p("assnatPastille", "(2)"),
    p("assnatligneTableauC", "3 bis"),
    p("assnatFPFprojetloiartexte", "» ;"),
    p("assnatPastille", "(3)"),
    p("assnatFPFprojetloiartexte", "II. – Le présent article s'applique en 2027."),
    p("assnatFPFexpogentitre1", "Exposé des motifs"),
    p("assnatFPFexpogentexte", "Le présent article vise à…"),
    p("assnatFARSautApres", "&#xa0;x"),
    p("assnatFARTT08Bleu", "Projet de loi de finances"),
    p("assnatFAR09Noir", "1"),
    // Article suivant non reconnu par la segmentation amont.
    p("assnatPastille", "(1)"),
    p("assnatFPFprojetloiartexte", "Le 2° de l'article L. 425-12 est remplacé…"),
    p("assnatFPFexpogentitre1", "Exposé des motifs"),
  ].join("\n");

  it("reprend les numéros officiels des pastilles, sans numéroter les suites", () => {
    const alineas = parseAlineas(article);
    expect(alineas.slice(0, 4).map((a) => [a.alineaNumber, a.cssClass])).toEqual([
      [1, "assnatFPFprojetloiartexte"],
      [null, "assnatligneTableauC"],
      [null, "assnatFPFprojetloiartexte"], // « » ; » : suite de l'alinéa 1
      [3, "assnatFPFprojetloiartexte"],
    ]);
    expect(alineas.some((a) => a.cssClass === "assnatPastille")).toBe(false);
  });

  it("retire l'en-tête courant mais garde le contenu des autres classes FAR", () => {
    const alineas = parseAlineas(
      [p("assnatFARTT08Bleu", "Projet de loi de finances"), p("assnatFAR09Noir", "12"), p("assnatFAR07Noir", "* Les fonds de concours")].join(""),
    );
    expect(alineas.map((a) => a.html)).toEqual(["* Les fonds de concours"]);
  });

  it("s'arrête après l'exposé des motifs de l'article, avant le texte suivant", () => {
    const alineas = couperApresExposeDesMotifs(parseAlineas(article));
    expect(alineas.at(-1)?.html).toBe("Le présent article vise à…");
    expect(alineas.some((a) => a.html.includes("L. 425-12"))).toBe(false);
  });

  it("ne change rien à un texte sans exposé par article", () => {
    const alineas = parseAlineas([p("assnatLoiTexte", "Premier alinéa."), p("assnatLoiTexte", "Second alinéa.")].join(""));
    expect(couperApresExposeDesMotifs(alineas)).toEqual(alineas);
    expect(alineas.map((a) => a.alineaNumber)).toEqual([1, 2]);
  });
});
