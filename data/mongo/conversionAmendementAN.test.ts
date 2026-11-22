import { describe, expect, it } from "vitest";
import {
  amendementLiseuseDepuisAN,
  identifiantDivision,
  lierScrutins,
  numerosDuScrutin,
  texteAmendementDepuisAN,
} from "./conversionAmendementAN";

const NIL = { "@xsi:nil": "true" };

describe("identifiantDivision (sommaire de la liseuse)", () => {
  it("reproduit les identifiants de l'API", () => {
    expect(identifiantDivision("Article 12 octies")).toBe("article-12-octies");
    expect(identifiantDivision("Article PREMIER")).toBe("article-1");
    expect(identifiantDivision("Article unique")).toBe("article-1");
    expect(identifiantDivision("Article liminaire")).toBe("article-0");
    expect(identifiantDivision("ÉTAT B")).toBe("etat-b");
    expect(identifiantDivision("A. - Crédits des missions")).toBe("a---credits-des-missions");
    expect(identifiantDivision("D. – Autres dispositions")).toBe("d--autres-dispositions");
    expect(identifiantDivision(null)).toBeNull();
  });
});

const BRUT = {
  uid: "AMANR5L17PO420120B3309P0D1N000001",
  identification: { numeroLong: "AS1", numeroOrdreDepot: "1" },
  cycleDeVie: { dateDepot: "2026-11-12", dateSort: "2026-11-18T11:19:42+01:00", sort: "Rejeté" },
  signataires: {
    auteur: { typeAuteur: "Député", acteurRef: "PA794678" },
    cosignataires: { acteurRef: ["PA1", "PA2"] },
  },
  pointeurFragmentTexte: { division: { titre: "Article unique", articleAdditionnel: "true" } },
  discussionIdentique: NIL,
};

describe("amendementLiseuseDepuisAN", () => {
  it("convertit les champs de la liseuse", () => {
    expect(amendementLiseuseDepuisAN(BRUT)).toEqual({
      uid: "AMANR5L17PO420120B3309P0D1N000001",
      numeroLong: "AS1",
      sortAmendement: "Rejeté",
      typeAuteur: "Député",
      identifiantDivision: "article-1",
      divisionArticleAdditionnel: "true",
      acteurRefUid: "PA794678",
      nombreCoSignataires: 2,
      dateDepot: "2026-11-12T00:00:00.000Z",
      dateSort: "2026-11-18T10:19:42.000Z",
      idDiscussionIdentique: null,
    });
  });

  it("sans sort, prend l'état de traitement", () => {
    const brut = { ...BRUT, cycleDeVie: { sort: NIL, etatDesTraitements: { etat: { libelle: "Irrecevable 40" }, sousEtat: { libelle: "Crédits" } } } };
    expect(amendementLiseuseDepuisAN(brut).sortAmendement).toBe("Irrecevable 40");
  });
});

describe("liens amendement → scrutin", () => {
  it("lit les numéros cités par un libellé", () => {
    expect(numerosDuScrutin("l'amendement n° 1 de M. Wauquiez et les amendements identiques suivants de suppression de l'article 3")).toEqual(["1"]);
    expect(numerosDuScrutin("l'amendement n° 2420 (rect.) de M. Le Coq à l'article 36")).toEqual(["2420"]);
    expect(numerosDuScrutin("l'ensemble du projet de loi")).toEqual([]);
  });

  const seance = "RUANR5L17S2027IDS30944";
  const amendement = (uid: string, numero: string, extra = {}) => ({
    uid,
    identification: { numeroLong: numero },
    seanceDiscussionRef: seance,
    ...extra,
  });
  const scrutin = { uid: "VTANR5L17V8738", numero: "8738", seanceRef: seance, objet: { libelle: "l'amendement n° 1 de M. Wauquiez et les amendements identiques suivants" } };

  it("relie l'amendement cité et ses identiques de la même séance", () => {
    const liens = lierScrutins(
      [
        amendement("A1", "I-1", { discussionIdentique: { idDiscussion: "93403" } }),
        amendement("A2", "I-35 (Rect)", { discussionIdentique: { idDiscussion: "93403" } }),
        amendement("A3", "I-2", { discussionCommune: { idDiscussion: "1" } }),
        // Amendement de commission : voté en commission, pas par ce scrutin.
        { uid: "C1", identification: { numeroLong: "I-CF1" }, discussionIdentique: { idDiscussion: "93119" } },
      ],
      [scrutin]
    );
    expect(Object.fromEntries(liens)).toEqual({ A1: "VTANR5L17V8738", A2: "VTANR5L17V8738" });
  });

  it("ne relie pas un amendement de même numéro discuté dans une autre séance", () => {
    const liens = lierScrutins([{ ...amendement("A1", "I-1"), seanceDiscussionRef: "RUAUTRE" }], [scrutin]);
    expect(liens.size).toBe(0);
  });
});

describe("texteAmendementDepuisAN", () => {
  it("garde le HTML de l'Assemblée sans ses attributs de mise en forme", () => {
    const texte = texteAmendementDepuisAN({
      corps: {
        contenuAuteur: {
          dispositif: '<p style="text-align: justify;">Supprimer cet article.</p>',
          exposeSommaire: '<p style="text-align: justify;" data-pm-slice="1 1 []"><b>Cet amendement</b> vise…</p>',
        },
      },
    });
    expect(texte).toEqual({
      dispositif: "<p>Supprimer cet article.</p>",
      exposeSommaire: "<p><b>Cet amendement</b> vise…</p>",
    });
  });
});
