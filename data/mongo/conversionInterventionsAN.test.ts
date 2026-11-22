import { describe, expect, it } from "vitest";
import { interventionsDepuisAN } from "./conversionInterventionsAN";
import { construireIndex, decomposer, ResolveurOrateurs } from "./resolutionOrateurs";

describe("decomposer (même règle que resolution_orateurs.py)", () => {
  it("sépare le nom et la fonction", () => {
    expect(decomposer("M. le président Éric Coquerel")).toEqual(["eric coquerel", "president"]);
    expect(decomposer("M. Charles Alloncle, rapporteur")).toEqual(["charles alloncle", "rapporteur"]);
    expect(decomposer("M. le rapporteur")).toEqual(["", "rapporteur"]);
    expect(decomposer("M. Thibault Bazin (DR)")).toEqual(["thibault bazin", null]);
  });
});

const ACTEURS = [
  { uid: "PA1", etatCivil: { ident: { prenom: "Éric", nom: "Coquerel" } }, mandats: { mandat: { typeOrgane: "ASSEMBLEE", legislature: "17" } } },
  { uid: "PA2", etatCivil: { ident: { prenom: "Charles", nom: "Alloncle" } }, mandats: { mandat: [{ typeOrgane: "ASSEMBLEE", legislature: "17" }] } },
  { uid: "PA3", etatCivil: { ident: { prenom: "Édouard", nom: "Geffray" } }, mandats: { mandat: { typeOrgane: "GOUVERNEMENT" } } },
];

describe("ResolveurOrateurs", () => {
  it("rattache par le nom, puis « le rapporteur » à la personne nommée plus haut", () => {
    const r = new ResolveurOrateurs(construireIndex(ACTEURS, 17));
    expect(r.resoudre("M. Charles Alloncle, rapporteur")).toBe("PA2");
    expect(r.resoudre("M. le rapporteur")).toBe("PA2");
    expect(r.resoudre("M. Édouard Geffray, ministre")).toBeNull(); // statistiques : députés seulement
  });

  it("pour l'affichage, rattache aussi les membres du Gouvernement", () => {
    const r = new ResolveurOrateurs(construireIndex(ACTEURS, 17, { gouvernement: true }));
    expect(r.resoudre("M. Édouard Geffray, ministre")).toBe("PA3");
  });
});

describe("interventionsDepuisAN", () => {
  it("séance : identifiants fournis, bloc d'amendements dédoublonné, groupe sans identifiant", () => {
    const cr = {
      uid: "CRSANR5L17S2025O1N226",
      seanceRef: "RUANR5L17S2025IDS29502",
      contenu: {
        point: {
          code_grammaire: "TITRE_TEXTE_DISCUSSION",
          ordre_absolu_seance: "5",
          texte: "Collectes de sang",
          point: {
            // Bloc portant le numéro d'ordre de son premier paragraphe.
            code_grammaire: "DISC_ARTICLES_3_1",
            ordre_absolu_seance: "11",
            interExtraction: {
              paragraphe: [
                {
                  code_grammaire: "PAROLE_GENERIQUE",
                  ordre_absolu_seance: "11",
                  id_acteur: "PA721134",
                  roledebat: "president",
                  orateurs: { orateur: { nom: "M. le président", id: "721134" } },
                  texte: { _: "Je suis saisi de deux amendements.", stime: "935.96" },
                },
                {
                  code_grammaire: "INTERRUPTION_1_10",
                  ordre_absolu_seance: "39",
                  orateurs: { orateur: [{ nom: "Mme Claire Marais-Beuil", id: "841563" }, { nom: "M. Théo Bernhardt", id: "841645" }] },
                  texte: { _: "Notre amendement dit tout le contraire !", stime: "1351.00" },
                },
                {
                  code_grammaire: "INTERRUPTION_1_10",
                  ordre_absolu_seance: "40",
                  orateurs: { orateur: { nom: "Plusieurs députés du groupe RN", id: "0" } },
                  texte: "Très bien !",
                },
                {
                  code_grammaire: "INTERRUPTION_1_10",
                  ordre_absolu_seance: "41",
                  id_acteur: "PA0",
                  orateurs: { orateur: { nom: "Plusieurs députés du groupe LFI-NFP", id: "0" } },
                  texte: "Bravo !",
                },
              ],
            },
          },
        },
      },
    };
    const paragraphes = interventionsDepuisAN(cr, "2025-06-04T21:30:00.000Z", null);
    expect(paragraphes.map((p) => [p.ordreAbsoluSeance, p.codeGrammaire, p.acteurRefUid])).toEqual([
      [5, "TITRE_TEXTE_DISCUSSION", null],
      [11, "PAROLE_GENERIQUE", "PA721134"],
      [39, "INTERRUPTION_1_10", "PA841563"],
      [40, "INTERRUPTION_1_10", null],
      [41, "INTERRUPTION_1_10", null],
    ]);
    const presidence = paragraphes[1];
    expect(presidence.texte).toBe("Je suis saisi de deux amendements.");
    expect(presidence.stime).toBe("935.96");
    expect(presidence.roleDebat).toBe("president");
    expect(presidence.reunionRefUid).toBe("RUANR5L17S2025IDS29502");
    expect(presidence.uid).toBe("CRSANR5L17S2025O1N226-11");
  });

  it("commission : orateurs rattachés par le nom", () => {
    const cr = {
      uid: "CRCANR5L17S2027PO59048N037",
      contenu: {
        point: [
          { code_style: "Info Italiques", ordre_absolu_seance: "1", texte: { _: "<i>La commission entend…</i>" } },
          {
            code_grammaire: "PAROLE_GENERIQUE",
            roledebat: "président",
            ordre_absolu_seance: "2",
            orateurs: { orateur: [{ nom: "M. le président Éric Coquerel", id: "" }] },
            texte: { _: "Messieurs les ministres…" },
          },
          {
            code_grammaire: "PAROLE_GENERIQUE",
            ordre_absolu_seance: "3",
            orateurs: { orateur: { nom: "M. le président", id: "" } },
            texte: { _: "Merci." },
          },
        ],
      },
    };
    const paragraphes = interventionsDepuisAN(cr, null, new ResolveurOrateurs(construireIndex(ACTEURS, 17)));
    expect(paragraphes.map((p) => p.acteurRefUid)).toEqual([null, "PA1", "PA1"]);
    expect(paragraphes[1].orateur).toBe("M. le président Éric Coquerel");
  });
});
