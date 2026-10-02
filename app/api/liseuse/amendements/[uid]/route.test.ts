import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
const uid = "AMANR5L17PO883517B2841P0D1N000014";
const request = new Request(`http://localhost/api/liseuse/amendements/${uid}`);
describe("texte d'amendement à la demande", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("conserve le HTML intégral des deux textes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: {
      uid, dispositif: "<p>Dispositif &amp; texte</p>", exposeSommaire: "<p>Exposé</p>",
    } })));
    const result = await GET(request, { params: Promise.resolve({ uid }) });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ dispositif: "<p>Dispositif &amp; texte</p>", exposeSommaire: "<p>Exposé</p>" });
  });
  it("conserve les textes absents sans les confondre avec une erreur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: { uid, dispositif: null, exposeSommaire: null } })));
    expect((await GET(request, { params: Promise.resolve({ uid }) })).status).toBe(200);
  });
  it("refuse une réponse correspondant à un autre amendement", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: { uid: "OTHER" } })));
    expect((await GET(request, { params: Promise.resolve({ uid }) })).status).toBe(502);
  });
  it("refuse les chemins arbitraires", async () => {
    const mock = vi.fn(); vi.stubGlobal("fetch", mock);
    expect((await GET(request, { params: Promise.resolve({ uid: "../secret" }) })).status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });
});
