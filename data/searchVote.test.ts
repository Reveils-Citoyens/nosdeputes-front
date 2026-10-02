import { afterEach, describe, expect, it, vi } from "vitest";

async function charger() {
  vi.stubEnv("NEXT_PUBLIC_TRICOTEUSES_API_URL", "https://api.test");
  vi.resetModules();
  return import("./searchVote");
}

/** 30 votes du député (VT0 le plus récent), un solennel sur cinq ; « enfants » touche VT0, VT3, VT6… */
function api({ echec = false } = {}) {
  const votes = Array.from({ length: 30 }, (_, i) => ({
    scrutinRefUid: `VT${i}`,
    dateVote: `2026-06-${String(30 - i).padStart(2, "0")}T00:00:00.000Z`,
    positionVote: i % 2 ? "contre" : "pour",
    codeTypeVote: i % 5 === 0 ? "SPS" : "SPO",
  }));
  const fetchMock = vi.fn(async (input: string, _init?: RequestInit) => {
    const url = new URL(input);
    if (echec) return new Response("<!DOCTYPE html>", { status: 500 });
    if (url.pathname === "/scrutins") {
      const data = Array.from({ length: 2000 }, (_, i) => ({ uid: `VT${i * 3}` }));
      return new Response(JSON.stringify({ data }), { headers: { total: "2000" } });
    }
    if (url.searchParams.has("select")) {
      const position = url.searchParams.get("positionVote");
      const data = votes.filter((v) => !position || v.positionVote === position);
      return new Response(JSON.stringify({ data }), { headers: { total: String(data.length) } });
    }
    // Détails : volontairement dans le désordre.
    const uids = (url.searchParams.get("scrutinRefUid") ?? "").split(",").reverse();
    const data = uids.map((uid) => ({ ...votes.find((v) => v.scrutinRefUid === uid), uid: `V-${uid}`, scrutinRef: { titre: uid } }));
    return new Response(JSON.stringify({ data }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const chemins = (fetchMock: ReturnType<typeof api>) => fetchMock.mock.calls.map(([u]) => new URL(u));

describe("searchVote filtré", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("croise les scrutins correspondants avec tous les votes du député, sans limite", async () => {
    const fetchMock = api();
    const { searchVote } = await charger();

    const r = await searchVote({ search: " enfants ", acteurRefUid: "PA1", include: "scrutinRef.dossierRef", perPage: 4 });

    const urls = chemins(fetchMock);
    expect(urls.every((u) => u.pathname !== "/votes" || !u.searchParams.has("search"))).toBe(true);
    expect(urls.find((u) => u.pathname === "/scrutins")?.searchParams.get("search")).toBe("enfants");
    // VT0, VT3 … VT27 : 10 votes correspondants, du plus récent au plus ancien.
    expect(r?.pagination).toEqual({ total: 10, totalPage: 3, perPage: 4, currentPage: 1 });
    expect(r?.data.map((v) => v.scrutinRefUid)).toEqual(["VT0", "VT3", "VT6", "VT9"]);
    const details = urls.at(-1)!;
    expect(details.searchParams.get("scrutinRefUid")).toBe("VT0,VT3,VT6,VT9");
    expect(details.searchParams.get("include")).toBe("scrutinRef.dossierRef");
    expect(r?.data[0].dateVote).toBeInstanceOf(Date);
  });

  it("filtre les votes solennels localement (l'API ignore codeTypeVote)", async () => {
    const fetchMock = api();
    const { searchVote } = await charger();

    const r = await searchVote({ acteurRefUid: "PA1", codeTypeVote: "SPS", perPage: 10 });

    expect(r?.data.map((v) => v.scrutinRefUid)).toEqual(["VT0", "VT5", "VT10", "VT15", "VT20", "VT25"]);
    expect(chemins(fetchMock).some((u) => u.pathname === "/scrutins")).toBe(false);
  });

  it("combine recherche, position et type", async () => {
    api();
    const { searchVote } = await charger();
    const r = await searchVote({ search: "enfants", acteurRefUid: "PA1", positionVote: "pour", codeTypeVote: "SPS" });
    // pairs, multiples de 3 et de 5 : VT0 seulement.
    expect(r?.data.map((v) => v.scrutinRefUid)).toEqual(["VT0"]);
  });

  it("ne relit que les détails de la page demandée", async () => {
    const fetchMock = api();
    const { searchVote } = await charger();

    await searchVote({ search: "enfants", acteurRefUid: "PA1", perPage: 4, page: 1 });
    const avant = fetchMock.mock.calls.length;
    const page3 = await searchVote({ search: "enfants", acteurRefUid: "PA1", perPage: 4, page: 3 });

    expect(fetchMock.mock.calls.length).toBe(avant + 1);
    expect(page3?.data.map((v) => v.scrutinRefUid)).toEqual(["VT24", "VT27"]);
  });

  it("renvoie null sur une page d'erreur HTML sans garder l'échec", async () => {
    const fetchMock = api({ echec: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { searchVote } = await charger();

    expect(await searchVote({ search: "enfants", acteurRefUid: "PA1" })).toBeNull();
    const avant = fetchMock.mock.calls.length;
    await searchVote({ search: "enfants", acteurRefUid: "PA1" });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(avant);
  });
});

describe("searchVote sans filtre", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("garde la pagination de l'API et ne plante pas sur une page d'erreur HTML", async () => {
    const fetchMock = vi.fn(async (_input: string, _init?: RequestInit) => new Response("<!DOCTYPE html>", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { searchVote } = await charger();

    expect(await searchVote({ acteurRefUid: "PA1", positionVote: "pour", page: 2 })).toBeNull();
    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("positionVote")).toBe("pour");
    expect(url.searchParams.has("search")).toBe(false);
  });
});
