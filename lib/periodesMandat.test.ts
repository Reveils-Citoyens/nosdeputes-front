import { describe, expect, it } from "vitest";
import { fusionnerPeriodes, semaineEnMandat } from "./periodesMandat";

describe("fusionnerPeriodes", () => {
  it("fusionne les mandats superposés ou consécutifs", () => {
    expect(
      fusionnerPeriodes([
        { debut: "2024-07-07", fin: "2024-10-21" },
        { debut: "2024-07-07", fin: null },
      ])
    ).toEqual([{ debut: "2024-07-07", fin: null }]);
    expect(
      fusionnerPeriodes([
        { debut: "2025-01-01", fin: "2025-06-30" },
        { debut: "2024-07-07", fin: "2024-12-31" },
      ])
    ).toEqual([{ debut: "2024-07-07", fin: "2025-06-30" }]);
  });

  it("garde séparés deux mandats espacés", () => {
    expect(
      fusionnerPeriodes([
        { debut: "2024-07-07", fin: "2024-10-21" },
        { debut: "2025-02-01", fin: null },
      ])
    ).toHaveLength(2);
  });
});

describe("semaineEnMandat", () => {
  const periodes = [{ debut: "2024-07-07", fin: "2026-09-30" }];
  const lundi = (jour: string) => new Date(`${jour}T00:00:00Z`);

  it("une semaine qui recoupe le mandat, même en partie, en fait partie", () => {
    expect(semaineEnMandat(periodes, lundi("2026-09-28"))).toBe(true);
    expect(semaineEnMandat(periodes, lundi("2025-03-03"))).toBe(true);
  });

  it("les semaines après le départ n'en font pas partie", () => {
    expect(semaineEnMandat(periodes, lundi("2026-10-05"))).toBe(false);
  });
});
