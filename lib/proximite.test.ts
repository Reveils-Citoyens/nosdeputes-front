import { describe, expect, it } from "vitest";
import { classerProximites, formaterTaux, ordreHemicycle, taux } from "./proximite";

describe("proximité de vote", () => {
  it("calcule un taux, indéfini sans scrutin comparé", () => {
    expect(taux([363 * 0.884, 363])).toBeCloseTo(88.4);
    expect(taux([0, 0])).toBeNull();
    expect(taux(undefined)).toBeNull();
    expect(formaterTaux(76.74)).toBe("77 %");
  });

  it("met son groupe à part et classe les autres du plus proche au plus éloigné", () => {
    const { propre, autres } = classerProximites(
      [
        { groupe: "RN", tous: [38, 100] },
        { groupe: "LIOT", tous: [88, 100] },
        { groupe: "SOC", tous: [77, 100] },
        // Pas de scrutin solennel en commun : absent sur ce périmètre.
        { groupe: "HOR", solennels: [6, 10] },
      ],
      "tous",
      "LIOT"
    );
    expect(propre?.groupe).toBe("LIOT");
    expect(autres.map((g) => g.groupe)).toEqual(["SOC", "RN"]);
  });

  it("range les groupes dans l'ordre de l'hémicycle, les inconnus à la fin", () => {
    expect(["RN", "NOUVEAU", "LFI-NFP", "SOC"].sort(ordreHemicycle)).toEqual(["LFI-NFP", "SOC", "RN", "NOUVEAU"]);
  });
});
