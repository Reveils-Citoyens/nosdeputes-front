import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getActeur: vi.fn(), enrich: vi.fn() }));
vi.mock("./getActeur", () => ({ getActeur: mocks.getActeur }));
vi.mock("./helpers/resolveAuGouvernement", () => ({ resolveAuGouvernementBatch: mocks.enrich }));
import { getDebateActeurs } from "./getDebateActeurs";
const acteur = (uid: string) => ({ uid, prenom: "A", nom: "B", slug: "a-b", urlImage: "photo", auGouvernement: false,
  mandatPrincipal: { chambre: "AN", typeOrgane: "ASSEMBLEE" },
  groupeParlementaire: { uid: "G", libelle: "Groupe", libelleAbrev: "G", libelleAbrege: "G", couleurAssociee: "#aaa" },
  unused: "large payload",
});
describe("lecture groupée des orateurs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enrich.mockImplementation(async (items) => items);
    mocks.getActeur.mockImplementation(async (uid) => acteur(uid));
  });
  afterEach(() => vi.unstubAllGlobals());
  it("déduplique les orateurs et partage noms, liens, photos et groupes", async () => {
    const mock = vi.fn().mockResolvedValue(Response.json({ data: [acteur("PA1"), acteur("PA2")] }));
    vi.stubGlobal("fetch", mock);
    const data = await getDebateActeurs(["PA1", "PA1", "PA2"]);
    expect(mock).toHaveBeenCalledTimes(1);
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ uid: "PA1", mandatPrincipal: { chambre: "AN" }, groupeParlementaire: { libelle: "Groupe" } });
    expect(data[0]).not.toHaveProperty("unused");
    expect(mocks.enrich).toHaveBeenCalledTimes(1);
    expect(mocks.getActeur).not.toHaveBeenCalled();
  });
  it("retrouve individuellement les orateurs omis par un batch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [acteur("PA1")] })));
    const result = await getDebateActeurs(["PA1", "PA2"]);
    expect(result.map((a) => a.uid)).toEqual(["PA1", "PA2"]);
    expect(mocks.getActeur).toHaveBeenCalledWith("PA2");
  });
  it("conserve un repli si le batch échoue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network")));
    expect(await getDebateActeurs(["PA1"])).toHaveLength(1);
    expect(mocks.getActeur).toHaveBeenCalledWith("PA1");
  });
  it("borne les lots à cinquante acteurs sans en perdre", async () => {
    const mock = vi.fn(async (url: string) => Response.json({ data: new URL(url).searchParams.get("uid")!.split(",").map(acteur) }));
    vi.stubGlobal("fetch", mock);
    process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL = "https://tricoteuses.test";
    expect(await getDebateActeurs(Array.from({ length: 91 }, (_, i) => `PA${i}`))).toHaveLength(91);
    expect(mock).toHaveBeenCalledTimes(2);
  });
});
