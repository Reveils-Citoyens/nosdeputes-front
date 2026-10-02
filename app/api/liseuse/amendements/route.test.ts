import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
describe("métadonnées des amendements de la liseuse", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("utilise le total officiel et le mode compact sans modifier le tri ni le filtre AN", async () => {
    process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL = "https://tricoteuses.test";
    const mock = vi.fn().mockResolvedValue(Response.json({ data: [{ uid: "AMD" }] }, { headers: { total: "1238" } }));
    vi.stubGlobal("fetch", mock);
    const result = await GET(new NextRequest("http://localhost/api/liseuse/amendements?documentRefUid=DOC&perPage=500&page=2&compact=1"));
    expect(await result.json()).toEqual({ items: [{ uid: "AMD" }], total: 1238, totalIsKnown: true });
    const url = new URL(mock.mock.calls[0][0]);
    expect(url.searchParams.get("chambre")).toBe("AN");
    expect(url.searchParams.get("sort")).toBe("numeroOrdreDepot.asc");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("select")).toContain("identifiantDivision");
    expect(url.searchParams.get("select")).not.toContain("dispositif");
  });
  it("conserve le format complet pour les consommateurs sans compact=1", async () => {
    const mock = vi.fn().mockResolvedValue(Response.json({ data: [] }, { headers: { "x-total": "42" } }));
    vi.stubGlobal("fetch", mock);
    const response = await GET(new NextRequest("http://localhost/api/liseuse/amendements?documentRefUid=DOC"));
    expect(new URL(mock.mock.calls[0][0]).searchParams.has("select")).toBe(false);
    expect((await response.json()).total).toBe(42);
  });
  it("signale un total inconnu pour permettre une pagination exhaustive", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: [{}, {}] })));
    const response = await GET(new NextRequest("http://localhost/api/liseuse/amendements?documentRefUid=DOC&perPage=2"));
    expect(await response.json()).toMatchObject({ total: 3, totalIsKnown: false });
  });
  it("ne transforme pas une erreur amont en succès mis en cache", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    const response = await GET(new NextRequest("http://localhost/api/liseuse/amendements?documentRefUid=DOC"));
    expect(response.status).toBe(500);
    expect(response.headers.get("Cache-Control")).toBeNull();
    vi.restoreAllMocks();
  });
  it.each(["0", "-1", "NaN", "1.5"])("refuse une pagination invalide %s", async (perPage) => {
    const mock = vi.fn(); vi.stubGlobal("fetch", mock);
    const response = await GET(new NextRequest(`http://localhost/api/liseuse/amendements?documentRefUid=DOC&perPage=${perPage}`));
    expect(response.status).toBe(400); expect(mock).not.toHaveBeenCalled();
  });
});
