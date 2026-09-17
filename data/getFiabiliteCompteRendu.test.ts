import { describe, expect, it } from "vitest";
import { estCertifieDepuisUid } from "./getFiabiliteCompteRendu";

describe("estCertifieDepuisUid", () => {
  it("reconnaît un compte rendu officiel par son préfixe CR", () => {
    expect(estCertifieDepuisUid("CRANR5L17S2026IDS12345")).toBe(true);
  });

  it("reconnaît une transcription par son préfixe TR", () => {
    expect(estCertifieDepuisUid("TR-ANR5L17S2026IDC458098")).toBe(false);
  });

  it("normalise les espaces et la casse", () => {
    expect(estCertifieDepuisUid("  tranr5l17  ")).toBe(false);
    expect(estCertifieDepuisUid("  cranr5l17  ")).toBe(true);
  });

  it("laisse les formats inconnus au repli par validite", () => {
    expect(estCertifieDepuisUid("ANCIEN_FORMAT_123")).toBeNull();
  });
});
