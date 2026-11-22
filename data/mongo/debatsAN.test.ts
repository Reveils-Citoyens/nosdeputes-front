import { describe, expect, it } from "vitest";
import { pourTests } from "./debatsAN";

const { dateSeance, debatDepuisAN, agendaDepuisAN } = pourTests;

describe("dateSeance", () => {
  it("garde l'heure de Paris telle quelle, comme l'API", () => {
    expect(dateSeance("20261112090000000")).toBe("2026-11-12T09:00:00.000Z");
    expect(dateSeance(null)).toBeNull();
  });
});

describe("debatDepuisAN", () => {
  const cr = {
    uid: "CRSANR5L17S2027O1N060",
    seanceRef: "RUANR5L17S2027IDS30992",
    sessionRef: "SCR5A2027O1",
    metadonnees: {
      dateSeance: "20261112090000000",
      dateSeanceJour: "jeudi 12 novembre 2026",
      numSeance: "60",
      legislature: "17",
      sommaire: { presidentSeance: { _: "Présidence de M. Sébastien Chenu" } },
    },
  };

  it("reproduit les champs lus par les onglets", () => {
    const debat = debatDepuisAN(cr, 250_000);
    expect(debat.uid).toBe("CRSANR5L17S2027O1N060");
    expect(debat.chambre).toBe("AN");
    expect(debat.reunionRefUid).toBe("RUANR5L17S2027IDS30992");
    expect(debat.dateSeanceJour).toBe("jeudi 12 novembre 2026");
    expect(debat.presidentSeance).toBe("Présidence de M. Sébastien Chenu");
    expect(debat._count.paragraphes).toBeGreaterThan(0);
  });

  it("un compte rendu sans contenu compte zéro paragraphe (débat masqué)", () => {
    expect(debatDepuisAN(cr, 5)._count.paragraphes).toBe(0);
  });
});

describe("agendaDepuisAN", () => {
  it("convertit la réunion et son heure réelle", () => {
    const agenda = agendaDepuisAN(
      {
        uid: "RUANR5L17S2025IDC456360",
        "@xsi:type": "reunionCommission_type",
        cycleDeVie: { etat: "Confirmé" },
        timeStampDebut: "2025-05-27T21:30:00.000+02:00",
        organeReuniRef: "PO420120",
        compteRenduRef: "CRCANR5L17S2025PO420120N088",
      },
      []
    );
    expect(agenda.xsiType).toBe("reunionCommission_type");
    expect(agenda.etat).toBe("Confirmé");
    expect(agenda.timestampDebut).toBe("2025-05-27T19:30:00.000Z");
    expect(agenda.organeReunionRefUid).toBe("PO420120");
    expect(agenda.compteRenduRefUid).toBe("CRCANR5L17S2025PO420120N088");
  });
});
