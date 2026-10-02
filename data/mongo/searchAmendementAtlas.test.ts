import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ aggregate: vi.fn(), listSearchIndexes: vi.fn() }));
vi.mock("@/lib/mongodb", () => ({
  getParlementDb: async () => ({
    collection: () => ({ aggregate: mocks.aggregate, listSearchIndexes: mocks.listSearchIndexes }),
  }),
}));

const index = (queryable: boolean) => ({
  toArray: async () => [{ name: "amendements_search", status: queryable ? "READY" : "BUILDING", queryable }],
});
const resultat = (valeur: unknown) => ({ toArray: async () => valeur });

/** L'état de l'index est mémorisé au niveau du module : un module neuf par test. */
async function charger() {
  vi.resetModules();
  return import("./searchAmendementMongo");
}

describe("recherche d'amendements via Atlas Search", () => {
  beforeEach(() => vi.clearAllMocks());

  it("interroge l'index quand il est interrogeable, total via $searchMeta", async () => {
    mocks.listSearchIndexes.mockReturnValue(index(true));
    mocks.aggregate.mockImplementation((pipeline: Record<string, unknown>[]) =>
      "$searchMeta" in pipeline[0]
        ? resultat([{ count: { total: 4211 } }])
        : resultat([{ uid: "AMD1", cycleDeVie: { sort: "Rejeté" } }])
    );
    const { searchAmendementMongo } = await charger();

    const r = await searchAmendementMongo("logement", { limit: 5, skip: 10, sort: "date" });
    expect(r.total).toBe(4211);
    expect(r.items[0]).toMatchObject({ uid: "AMD1", sortAmendement: "Rejeté" });

    const recherche = mocks.aggregate.mock.calls.map((c) => c[0]).find((p) => "$search" in p[0]);
    expect(recherche[0].$search.index).toBe("amendements_search");
    expect(recherche[0].$search.compound.filter).toContainEqual({ equals: { path: "legislature", value: "17" } });
    expect(recherche[0].$search.sort).toEqual({
      "cycleDeVie.dateSort": { order: -1, noData: "highest" },
      "cycleDeVie.dateDepot": { order: -1, noData: "highest" },
    });
    expect(recherche).toContainEqual({ $skip: 10 });
    expect(recherche).toContainEqual({ $limit: 5 });
  });

  it("garde le parcours regex tant que l'index n'est pas interrogeable", async () => {
    mocks.listSearchIndexes.mockReturnValue(index(false));
    mocks.aggregate.mockReturnValue(resultat([{ items: [], count: [{ total: 7 }] }]));
    const { searchAmendementMongo } = await charger();

    expect((await searchAmendementMongo("logement")).total).toBe(7);
    expect(mocks.aggregate.mock.calls[0][0][0]).toHaveProperty("$match");
  });

  it("se replie sur le regex si Atlas Search échoue", async () => {
    mocks.listSearchIndexes.mockReturnValue(index(true));
    mocks.aggregate.mockImplementation((pipeline: Record<string, unknown>[]) => {
      if ("$search" in pipeline[0] || "$searchMeta" in pipeline[0]) {
        return { toArray: async () => Promise.reject(new Error("mongot indisponible")) };
      }
      return resultat([{ items: [], count: [{ total: 2 }] }]);
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { searchAmendementMongo } = await charger();

    expect((await searchAmendementMongo("logement")).total).toBe(2);
  });
});

describe("operateurRecherche", () => {
  it("ajoute le début de mot pour un mot seul, normalisé comme l'index", async () => {
    const { operateurRecherche } = await charger();
    const should = operateurRecherche("L’Énergie", "17").compound.should;
    expect(should).toContainEqual(expect.objectContaining({ wildcard: expect.objectContaining({ query: "energie*" }) }));
  });

  it("s'en tient aux phrases pour plusieurs mots", async () => {
    const { operateurRecherche } = await charger();
    const should = operateurRecherche("réforme des retraites", "17").compound.should;
    expect(should.every((clause) => "phrase" in clause)).toBe(true);
  });
});
