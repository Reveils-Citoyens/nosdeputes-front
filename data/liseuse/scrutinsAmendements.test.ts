import { describe, expect, it } from "vitest";
import { libelleScrutin, rattacherScrutins, versResume } from "./scrutinsAmendements";

describe("rattacherScrutins", () => {
  it("rattache un amendement adopté ou rejeté à son scrutin", () => {
    const m = rattacherScrutins([
      { uid: "A1", sortAmendement: "Rejeté", scrutinRefUid: "VT1" },
      { uid: "A2", sortAmendement: "Adopté", scrutinRefUid: "VT2" },
      { uid: "A3", sortAmendement: "Rejeté", scrutinRefUid: null },
    ]);
    expect([...m]).toEqual([
      ["A1", "VT1"],
      ["A2", "VT2"],
    ]);
  });

  it("ignore un amendement non mis aux voix qui porte le scrutin de ses identiques", () => {
    // Cas réel, PLF 2025 : I-1402 « Non soutenu », identique à I-562 (scrutin 103).
    const m = rattacherScrutins([
      { uid: "I-562", sortAmendement: "Rejeté", scrutinRefUid: "VT103", idDiscussionIdentique: 72656 },
      { uid: "I-1402", sortAmendement: "Non soutenu", scrutinRefUid: "VT103", idDiscussionIdentique: 72656 },
      { uid: "X", sortAmendement: "Tombé", scrutinRefUid: "VT9" },
    ]);
    expect([...m.keys()]).toEqual(["I-562"]);
  });

  it("propage le scrutin à un identique sans lien, à sort égal seulement", () => {
    const m = rattacherScrutins([
      { uid: "A", sortAmendement: "Rejeté", scrutinRefUid: "VT5", idDiscussionIdentique: 7 },
      { uid: "B", sortAmendement: "Rejeté", scrutinRefUid: null, idDiscussionIdentique: 7 },
      { uid: "C", sortAmendement: "Adopté", scrutinRefUid: null, idDiscussionIdentique: 7 },
      { uid: "D", sortAmendement: "Rejeté", scrutinRefUid: null, idDiscussionIdentique: 8 },
    ]);
    expect(m.get("B")).toBe("VT5");
    expect(m.has("C")).toBe(false);
    expect(m.has("D")).toBe(false);
  });
});

describe("résumé de scrutin", () => {
  it("normalise les nombres et accorde « abstention »", () => {
    const r = versResume({
      uid: "VTANR5L17V8562",
      numero: "8562",
      titre: "l'amendement n° 433 de Mme Legrain à l'article 23",
      dateScrutin: "2026-10-07T00:00:00.000Z",
      code: "rejeté",
      pour: "14",
      contre: 85,
      abstentions: 1,
      libelleTypeVote: "scrutin public ordinaire",
    })!;
    expect(r).toMatchObject({ pour: 14, contre: 85, abstentions: 1, code: "rejeté" });
    expect(libelleScrutin(r)).toBe("Scrutin public ordinaire n° 8562 : 14 pour, 85 contre, 1 abstention");
    expect(versResume({ numero: "1" })).toBeNull();
  });
});
