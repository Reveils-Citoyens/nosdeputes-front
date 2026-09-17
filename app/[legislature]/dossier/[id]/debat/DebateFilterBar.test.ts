import { describe, expect, it } from "vitest";
import { formatDebateOptionLabel } from "./DebateFilterBar";

describe("formatDebateOptionLabel", () => {
  it("affiche l'heure réelle de la réunion sans répéter la lecture", () => {
    expect(
      formatDebateOptionLabel({
        uid: "CRC-1",
        lectureLabel: "2e lecture",
        reunionDate: "2026-07-01T07:40:00.000Z",
      })
    ).toBe("Mercredi 1 juillet 2026 à 09:40");
  });

  it("conserve la date lisible historique en l'absence d'horodatage", () => {
    expect(
      formatDebateOptionLabel({
        uid: "CRC-1",
        dateSeanceJour: "Mercredi 1er juillet 2026",
      })
    ).toBe("Mercredi 1er juillet 2026");
  });
});
