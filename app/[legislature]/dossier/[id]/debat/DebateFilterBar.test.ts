import { describe, expect, it } from "vitest";
import { debutsDeSectionLecture, formatDebateOptionLabel } from "./DebateFilterBar";

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

describe("debutsDeSectionLecture", () => {
  it("n'ouvre pas deux fois la même lecture autour d'une réunion sans lecture", () => {
    expect(
      debutsDeSectionLecture([
        { lectureLabel: "1re lecture" },
        { lectureLabel: "1re lecture" },
        { lectureLabel: null },
        { lectureLabel: "1re lecture" },
        { lectureLabel: "2e lecture" },
        { lectureLabel: "1re lecture" },
      ])
    ).toEqual([true, false, false, false, true, true]);
  });
});
