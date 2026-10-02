import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  deputes: vi.fn(), dossiers: vi.fn(), amendements: vi.fn(), questions: vi.fn(), debats: vi.fn(),
}));
vi.mock("@/data/mongo/searchActeurParNom", () => ({ searchActeurParNom: mocks.deputes }));
vi.mock("@/data/mongo/searchDossierParTitre", () => ({ searchDossierParTitre: mocks.dossiers }));
vi.mock("@/data/mongo/searchAmendementMongo", () => ({ searchAmendementMongo: mocks.amendements }));
vi.mock("@/data/mongo/searchQuestion", () => ({ searchQuestion: mocks.questions }));
vi.mock("@/data/searchInterventions", () => ({ searchInterventions: mocks.debats }));
import { searchAll, searchAllSections } from "./searchAll";

describe("recherche progressive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.deputes.mockResolvedValue([]);
    for (const key of ["dossiers", "amendements", "questions", "debats"] as const) {
      mocks[key].mockResolvedValue({ items: [], total: 0 });
    }
  });
  it("ne lance aucune recherche en dessous de cinq caractères", async () => {
    await expect(searchAll(" abc ")).resolves.toMatchObject({ dossiersTotal: 0, amendementsTotal: 0 });
    Object.values(mocks).forEach((mock) => expect(mock).not.toHaveBeenCalled());
  });
  it("rend les dossiers disponibles avant les amendements, sans répéter les recherches", async () => {
    let resolve!: (value: unknown) => void;
    mocks.amendements.mockReturnValue(new Promise((done) => { resolve = done; }));
    mocks.dossiers.mockResolvedValue({ items: [{ uid: "dossier" }], total: 12 });
    const sections = searchAllSections(" logement ", { legislature: "16", sort: "date" });
    await expect(sections.dossiers).resolves.toEqual({ items: [{ uid: "dossier" }], total: 12 });
    expect(mocks.amendements).toHaveBeenCalledTimes(1);
    expect(mocks.amendements).toHaveBeenCalledWith("logement", { limit: 5, legislature: "16", sort: "date" });
    resolve({ items: [], total: 3 });
    await expect(sections.amendements).resolves.toEqual({ items: [], total: 3 });
  });
  it("conserve les totaux, résultats et valeurs par défaut de l'agrégateur", async () => {
    mocks.debats.mockResolvedValue({ items: [{ uid: "intervention" }], total: 42 });
    mocks.questions.mockResolvedValue({ items: [], total: 8 });
    const result = await searchAll("logement");
    expect(result.debatsTotal).toBe(42);
    expect(result.questionsTotal).toBe(8);
    expect(result.debats).toEqual([{ uid: "intervention" }]);
    expect(mocks.dossiers).toHaveBeenCalledWith("logement", { limit: 5, legislature: "17", sort: "relevance" });
    Object.values(mocks).forEach((mock) => expect(mock).toHaveBeenCalledTimes(1));
  });
});
