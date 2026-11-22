import { describe, expect, it } from "vitest";
import { questionDepuisAN } from "./conversionQuestionAN";
import { motifRechercheHtml, normaliserTexte } from "./rechercheTexte";

const JO = (dateJO: string) => ({ typeJO: "JO_QUESTION", dateJO, pageJO: "1" });

describe("questionDepuisAN", () => {
  it("question écrite republiée pour erratum : date de la 1re publication, texte et erratum de la dernière", () => {
    const q = questionDepuisAN({
      uid: "QANR5L17QE14334",
      type: "QE",
      identifiant: { numero: "14334", regime: "5eme Republique", legislature: "17" },
      auteur: { identite: { acteurRef: "PA1", mandatRef: "PM1" }, groupe: { organeRef: "PO1" } },
      indexationAN: { rubrique: "pollution", analyses: { analyse: "PFAS dans le Gard" } },
      minInt: { organeRef: "PO873673" },
      cloture: { codeCloture: "REP_PUB", libelleCloture: "Réponse publiée", dateCloture: "2026-08-25" },
      textesQuestion: {
        texteQuestion: [
          { infoJO: JO("2026-04-14"), texte: "Texte initial" },
          { infoJO: JO("2026-04-21"), erratum: "Au lieu de…", texte: "Texte corrigé" },
        ],
      },
      textesReponse: { texteReponse: { infoJO: JO("2026-08-25"), texte: "<p>Réponse</p>" } },
    });
    expect(q).toMatchObject({
      numero: "14334",
      type: "QE",
      titre: "PFAS dans le Gard",
      rubrique: "pollution",
      acteurRefUid: "PA1",
      minIntRefUid: "PO873673",
      dateDepot: "2026-04-14T00:00:00.000Z",
      texteQuestion: "Texte corrigé",
      erratumQuestion: "Au lieu de…",
      texteReponse: "<p>Réponse</p>",
      erratumReponse: null,
    });
  });

  it("question au Gouvernement, sans texte de question : date de l'attribution au ministre", () => {
    const q = questionDepuisAN({
      uid: "QANR5L17QG1873",
      type: "QG",
      identifiant: { numero: "1873", legislature: "17" },
      minAttribs: { minAttrib: { infoJO: { typeJO: "JO_DEBAT", dateJO: "2026-10-21" } } },
      textesQuestion: null,
      textesReponse: { texteReponse: { infoJO: { dateJO: "2026-10-21" }, texte: "Compte rendu" } },
    });
    expect(q.dateDepot).toBe("2026-10-21T00:00:00.000Z");
    expect(q.texteQuestion).toBeNull();
    expect(q.texteReponse).toBe("Compte rendu");
  });
});

describe("recherche dans les textes", () => {
  it("normalise accents, entités et balises", () => {
    expect(normaliserTexte("<p>Pr&#x00E9;vention de l&#x2019;État</p>")).toBe(" prevention de l'etat ");
  });

  it("retrouve un mot saisi sans accent dans le HTML de l'Assemblée", () => {
    const motif = new RegExp(motifRechercheHtml("prevention de l'Etat"), "i");
    expect(motif.test("<p>la pr&#x00E9;vention de l&#x2019;&#x00C9;tat</p>")).toBe(true);
    expect(motif.test("la prévention de l’État")).toBe(true);
    expect(motif.test("la protection de l'État")).toBe(false);
  });
});
