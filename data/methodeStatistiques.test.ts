import { describe, expect, it } from "vitest";
import { LIBELLES_TRANCHES } from "./methodeStatistiques";

describe("méthodologie des statistiques", () => {
  // Les cartes de la fiche député lisent ces phrases par index de tranche :
  // une liste absente fait planter toutes les cartes.
  it("fournit les phrases des cinq tranches", () => {
    expect(LIBELLES_TRANCHES).toHaveLength(5);
    expect(LIBELLES_TRANCHES[0]).toBe("Parmi les 20 % les moins actifs");
  });
});
