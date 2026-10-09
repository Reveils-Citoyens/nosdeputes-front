import { describe, expect, it } from "vitest";
import { elementsDecisions, elementsNouveauxTextes } from "./fluxDecisions";

describe("elementsDecisions", () => {
  it("titre le vote par son objet exact, y compris une motion", () => {
    const [ensemble, motion] = elementsDecisions([
      {
        dossierUid: "DLR5L17N54372",
        legislature: 17,
        dossierTitre: "Projet de loi relatif à la protection des enfants",
        scrutin: {
          uid: "VTANR5L17V8430",
          numero: "8430",
          objet: "l'ensemble du projet de loi relatif à la protection des enfants (première lecture).",
          sort: "adopté",
          date: "2026-07-21",
          pour: "378",
          contre: "7",
          abstentions: "173",
          libelleTypeVote: "scrutin public solennel",
        },
      },
      {
        dossierUid: "D2",
        legislature: 17,
        dossierTitre: "Autre texte",
        scrutin: { uid: "V2", objet: "la motion de rejet préalable", sort: "rejeté", date: "2026-06-01" },
      },
    ]);
    expect(ensemble).toMatchObject({
      guid: "vote-VTANR5L17V8430",
      titre: "Adopté : l'ensemble du projet de loi relatif à la protection des enfants (première lecture)",
      description:
        "Scrutin public solennel n° 8430 : 378 pour, 7 contre, 173 abstentions. Dossier : « Projet de loi relatif à la protection des enfants ».",
      lien: "/17/dossier/DLR5L17N54372/votes",
    });
    // Ne doit pas laisser croire que le texte a été rejeté.
    expect(motion.titre).toBe("Rejeté : la motion de rejet préalable");
  });
});

describe("elementsNouveauxTextes", () => {
  it("annonce le dépôt sans accord en genre", () => {
    const [texte] = elementsNouveauxTextes([
      {
        uid: "DLR5L17N54940",
        legislature: 17,
        titre: "Conditionner toute dépense publique",
        typeInitiative: "Proposition de loi",
        dateDepot: new Date("2026-10-01T00:00:00Z"),
      },
    ]);
    expect(texte).toMatchObject({
      guid: "depot-DLR5L17N54940",
      titre: "Nouveau texte : Conditionner toute dépense publique",
      description: "Proposition de loi — dépôt le 1er octobre 2026.",
      lien: "/17/dossier/DLR5L17N54940",
    });
  });
});
