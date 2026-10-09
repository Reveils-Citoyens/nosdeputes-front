import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

const requete = (qs: string) => GET(new NextRequest(`http://localhost/api/liseuse/scrutins?${qs}`));

describe("résumés des scrutins de la liseuse", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("parcourt toutes les pages d'un document et normalise les décomptes", async () => {
    process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL = "https://tricoteuses.test";
    const page1 = Array.from({ length: 500 }, (_, i) => ({ uid: `VTANR5L17V${i}`, pour: "1", contre: 2, abstentions: 0 }));
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: page1 }))
      .mockResolvedValueOnce(Response.json({ data: [{ uid: "VTANR5L17V9999", pour: 14, contre: 85, abstentions: 1 }] }));
    vi.stubGlobal("fetch", mock);
    const res = await requete("documentRefUid=PIONANR5L17BTC3190");
    const { scrutins } = await res.json();
    expect(scrutins).toHaveLength(501);
    expect(scrutins[0]).toMatchObject({ pour: 1, contre: 2 });
    expect(new URL(mock.mock.calls[1][0]).searchParams.get("page")).toBe("2");
    expect(new URL(mock.mock.calls[0][0]).searchParams.get("select")).toContain("libelleTypeVote");
  });

  it("lit des scrutins un par un et ignore ceux qui n'existent pas", async () => {
    const mock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ data: { uid: "VTANR5L17V302", pour: 3, contre: 4, abstentions: 0 } }))
      .mockResolvedValueOnce(new Response("", { status: 404 }));
    vi.stubGlobal("fetch", mock);
    const { scrutins } = await (await requete("uids=VTANR5L17V302,VTANR5L17V303")).json();
    expect(scrutins.map((s: { uid: string }) => s.uid)).toEqual(["VTANR5L17V302"]);
  });

  it("refuse les paramètres invalides sans appel amont", async () => {
    const mock = vi.fn();
    vi.stubGlobal("fetch", mock);
    expect((await requete("")).status).toBe(400);
    expect((await requete("uids=../../etc")).status).toBe(400);
    expect((await requete(`uids=${Array.from({ length: 51 }, (_, i) => `VTANR5L17V${i}`).join(",")}`)).status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });

  it("ne met pas en cache une panne amont", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    const res = await requete("documentRefUid=PIONANR5L17BTC3190");
    expect(res.status).toBe(502);
    expect(res.headers.get("Cache-Control")).toBeNull();
  });
});
