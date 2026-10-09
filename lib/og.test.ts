import { afterEach, describe, expect, it, vi } from "vitest";
import { chargerPhoto, tronquer } from "./og";

describe("tronquer", () => {
  it("laisse intact un texte court, espaces normalisés", () => {
    expect(tronquer("  Projet de loi\n relatif  ", 50)).toBe("Projet de loi relatif");
  });
  it("coupe au dernier mot entier, sans ponctuation pendante", () => {
    const texte = "Proposition de loi visant à pérenniser, généraliser et améliorer le dispositif";
    const resultat = tronquer(texte, 45);
    expect(resultat.length).toBeLessThanOrEqual(45);
    expect(resultat).toBe("Proposition de loi visant à pérenniser…");
  });
});

describe("chargerPhoto", () => {
  afterEach(() => vi.unstubAllGlobals());

  const reponse = (octets: number[], ok = true) =>
    vi.fn().mockResolvedValue({ ok, arrayBuffer: async () => new Uint8Array(octets).buffer });

  it("ignore une URL absente ou non HTTPS sans appel réseau", async () => {
    const fetch = reponse([0xff, 0xd8]);
    vi.stubGlobal("fetch", fetch);
    expect(await chargerPhoto(null)).toBeNull();
    expect(await chargerPhoto("http://exemple.fr/photo.jpg")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("détecte JPEG et PNG sur les octets, pas sur le Content-Type", async () => {
    vi.stubGlobal("fetch", reponse([0xff, 0xd8, 0xff]));
    expect(await chargerPhoto("https://exemple.fr/a")).toMatch(/^data:image\/jpeg;base64,/);
    vi.stubGlobal("fetch", reponse([0x89, 0x50, 0x4e, 0x47]));
    expect(await chargerPhoto("https://exemple.fr/b")).toMatch(/^data:image\/png;base64,/);
  });
  it("renvoie null sur un format non géré, une erreur HTTP ou réseau", async () => {
    vi.stubGlobal("fetch", reponse([0x3c, 0x68, 0x74])); // « <ht », page HTML
    expect(await chargerPhoto("https://exemple.fr/c")).toBeNull();
    vi.stubGlobal("fetch", reponse([0xff, 0xd8], false));
    expect(await chargerPhoto("https://exemple.fr/d")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    expect(await chargerPhoto("https://exemple.fr/e")).toBeNull();
  });
});
