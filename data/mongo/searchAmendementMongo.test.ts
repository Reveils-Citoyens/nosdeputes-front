import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ aggregate: vi.fn(), countDocuments: vi.fn(), toArray: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({ getParlementDb: async () => ({
  collection: () => ({ aggregate: mocks.aggregate, countDocuments: mocks.countDocuments }),
}) }));
import { searchAmendementMongo } from "./searchAmendementMongo";

describe("recherche d'amendements avec un seul scan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.aggregate.mockReturnValue({ toArray: mocks.toArray });
    mocks.toArray.mockResolvedValue([{ items: [], count: [{ total: 3973 }] }]);
  });
  it("compte tous les résultats avant pagination et conserve le tri de pertinence", async () => {
    const result = await searchAmendementMongo("logement", { limit: 5, skip: 10 });
    expect(result.total).toBe(3973);
    expect(mocks.countDocuments).not.toHaveBeenCalled();
    expect(mocks.aggregate).toHaveBeenCalledTimes(1);
    const pipeline = mocks.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.legislature).toEqual({ $in: [17, "17"] });
    expect(pipeline[1].$facet.count).toEqual([{ $count: "total" }]);
    expect(pipeline[1].$facet.items).toContainEqual({ $skip: 10 });
    expect(pipeline[1].$facet.items).toContainEqual({ $limit: 5 });
    expect(pipeline[1].$facet.items).toContainEqual({ $sort: { _relevance: -1, "cycleDeVie.dateSort": -1 } });
  });
  it("conserve les filtres de législature, de date et les entités HTML", async () => {
    await searchAmendementMongo("sécurité", { legislature: "16", sort: "date" });
    const [match, facet] = mocks.aggregate.mock.calls[0][0];
    expect(match.$match.legislature).toEqual({ $in: [16, "16"] });
    expect(match.$match.$or[0]["corps.contenuAuteur.exposeSommaire"].test("s&#x00E9;curité")).toBe(true);
    expect(facet.$facet.items).toContainEqual({ $sort: { "cycleDeVie.dateSort": -1, "cycleDeVie.dateDepot": -1 } });
  });
  it("conserve les champs des cartes et les dates", async () => {
    mocks.toArray.mockResolvedValue([{ count: [{ total: 1 }], items: [{
      uid: "AMD", identification: { numeroLong: "12" }, cycleDeVie: { sort: "Adopté", dateDepot: "2026-10-01" },
      corps: { contenuAuteur: { dispositif: "texte", exposeSommaire: "exposé" } },
      signataires: { auteur: { acteurRef: "PA1", typeAuteur: "Député" }, cosignataires: { acteurRef: ["PA2", "PA3"] } },
      _dossierInfo: { uid: "DOSSIER", titre: "Titre", legislature: 17 },
    }] }]);
    const result = await searchAmendementMongo("logement");
    expect(result.items[0]).toMatchObject({ uid: "AMD", nombreCoSignataires: 2, dossierRefUid: "DOSSIER", dispositif: "texte", sortAmendement: "Adopté" });
    expect(result.items[0].dateDepot).toBeInstanceOf(Date);
  });
  it("ne transforme pas une date xsi:nil en « Invalid Date »", async () => {
    mocks.toArray.mockResolvedValue([{ count: [{ total: 1 }], items: [{
      uid: "AMD", cycleDeVie: { dateDepot: "2026-10-01", dateSort: { "@xsi:nil": "true" } },
    }] }]);
    const [item] = (await searchAmendementMongo("logement")).items;
    expect(item.dateSort).toBeNull();
    expect(item.dateDepot).toBeInstanceOf(Date);
  });
  it("gère zéro résultat", async () => {
    mocks.toArray.mockResolvedValue([{ items: [], count: [] }]);
    await expect(searchAmendementMongo("logement")).resolves.toEqual({ items: [], total: 0 });
  });
  it("rattache le texte à son dossier via la collection documents", async () => {
    await searchAmendementMongo("logement");
    const items = mocks.aggregate.mock.calls[0][0][1].$facet.items as Record<string, any>[];
    const lookups = items.filter((stage) => stage.$lookup).map((stage) => [stage.$lookup.from, stage.$lookup.localField]);
    expect(lookups).toContainEqual(["documents", "texteLegislatifRef"]);
    expect(lookups).toContainEqual(["dossiers", "_texteInfo.dossierRef"]);
  });
});
