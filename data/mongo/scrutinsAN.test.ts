import { describe, expect, it } from "vitest";
import { resumeScrutinDepuisAN } from "./scrutinsAN";

describe("resumeScrutinDepuisAN", () => {
  it("produit le résumé de la liseuse, au jour exact", () => {
    expect(
      resumeScrutinDepuisAN({
        uid: "VTANR5L17V8738",
        numero: "8738",
        titre: "l'amendement n° 1 de M. Wauquiez et les amendements identiques suivants",
        dateScrutin: "2026-10-15",
        sort: { code: "adopté", libelle: "l'Assemblée nationale a adopté" },
        syntheseVote: { decompte: { pour: "116", contre: "30", abstentions: "2", nonVotants: "2" } },
        typeVote: { codeTypeVote: "SPO", libelleTypeVote: "scrutin public ordinaire" },
      })
    ).toEqual({
      uid: "VTANR5L17V8738",
      numero: "8738",
      titre: "l'amendement n° 1 de M. Wauquiez et les amendements identiques suivants",
      dateScrutin: "2026-10-15T00:00:00.000Z",
      code: "adopté",
      pour: 116,
      contre: 30,
      abstentions: 2,
      libelleTypeVote: "scrutin public ordinaire",
    });
  });
});
