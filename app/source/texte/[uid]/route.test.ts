import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/mongodb", () => ({
  getParlementDb: async () => ({
    collection: () => ({ findOne: async ({ uid }: { uid: string }) => (uid.includes("B3340") ? { dossierRef: "DLR5L17N54629" } : null) }),
  }),
}));


const AN = "https://www.assemblee-nationale.fr";
const appel = (uid: string) => GET(new Request("http://localhost"), { params: Promise.resolve({ uid }) });

describe("redirection vers le texte officiel", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("redirige vers le HTML quand il existe", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const res = await appel("PRJLANR5L17B2841");
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(`${AN}/dyn/opendata/PRJLANR5L17B2841.html`);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("essaie l'autre format si le premier n'existe pas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(new Response(null, { status: 404 })).mockResolvedValueOnce(new Response(null, { status: 200 })),
    );
    const res = await appel("ACINANR5L17B0567");
    expect(res.headers.get("location")).toBe(`${AN}/dyn/opendata/ACINANR5L17B0567.html`);
  });

  it("se replie sur le dossier quand aucun format n'est publié", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    const res = await appel("AVISANR5L17B3340");
    expect(res.headers.get("location")).toBe(`${AN}/dyn/17/dossiers/DLR5L17N54629`);
  });

  it("répond 404 sans dossier connu, et refuse un identifiant invalide", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    expect((await appel("ALCNANR5L17B0002")).status).toBe(404);
    expect((await appel("../../etc")).status).toBe(400);
  });

  it("site injoignable : tente le format probable sans mettre en cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const res = await appel("RAPPANR5L17B1276");
    expect(res.headers.get("location")).toBe(`${AN}/dyn/opendata/RAPPANR5L17B1276.html`);
    expect(res.headers.get("cache-control")).toBe("public, max-age=0");
  });
});
