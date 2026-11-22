import type { ActeLegislatif } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getCurrentStatus } from "./dataFunctions";

const actes = (...codes: string[]) =>
  codes.map((codeActe) => ({ codeActe, adoption: null, nomCanonique: null }) as unknown as ActeLegislatif);

describe("getCurrentStatus", () => {
  it("retient l'étape la plus avancée de la navette", () => {
    expect(getCurrentStatus(actes("AN1", "AN1-DEPOT", "SN1", "SN1-DEPOT"))).toBe("SN1");
    expect(getCurrentStatus(actes("AN1-DEPOT", "CMP-SAISIE"))).toBe("CMP");
  });

  it("ne confond pas une mission d'information (AN20) avec une 2e lecture", () => {
    expect(getCurrentStatus(actes("AN20", "AN20-MISINF", "AN20-MISINF-CREA"))).toBeUndefined();
  });
});
