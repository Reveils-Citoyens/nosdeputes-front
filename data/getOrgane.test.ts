import { afterEach, describe, expect, it, vi } from "vitest";

const organe = (uid: string) => ({ uid, libelle: `Organe ${uid}` });

/** Le cache mémoire est au niveau du module : un module neuf par test. */
async function charger() {
  vi.stubEnv("NEXT_PUBLIC_TRICOTEUSES_API_URL", "https://api.test");
  vi.resetModules();
  return import("./getOrgane");
}

function repondre(handler: (url: URL) => unknown | null) {
  const fetchMock = vi.fn(async (input: string, _init?: RequestInit) => {
    const corps = handler(new URL(input));
    return corps === null
      ? new Response("erreur", { status: 500 })
      : new Response(JSON.stringify(corps), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("getOrganes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("groupe les demandes par lots de 40, sans doublon ni uid vide", async () => {
    const fetchMock = repondre((url) => ({
      data: (url.searchParams.get("uid") ?? "").split(",").map(organe),
    }));
    const { getOrganes } = await charger();
    const uids = Array.from({ length: 45 }, (_, i) => `PO${i}`);

    const resultat = await getOrganes([...uids, "PO1", null, undefined]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1]).toEqual({ next: { revalidate: 86400 } });
    expect(resultat.size).toBe(45);
    expect(resultat.get("PO44")).toMatchObject({ uid: "PO44" });
  });

  it("redemande individuellement un organe absent de la réponse groupée", async () => {
    const fetchMock = repondre((url) =>
      url.pathname.endsWith("/organes/") ? { data: [organe("PO1")] } : { data: organe("PO2") }
    );
    const { getOrganes } = await charger();

    const resultat = await getOrganes(["PO1", "PO2"]);

    expect(resultat.get("PO2")).toMatchObject({ uid: "PO2" });
    expect(fetchMock.mock.calls.map(([u]) => new URL(u).pathname)).toContain("/organes/PO2");
  });

  it("se replie sur les appels individuels si le lot échoue", async () => {
    repondre((url) => (url.pathname.endsWith("/organes/") ? null : { data: organe(url.pathname.split("/").pop()!) }));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getOrganes } = await charger();

    const resultat = await getOrganes(["PO1", "PO2"]);

    expect([...resultat.values()].map((o) => o?.uid)).toEqual(["PO1", "PO2"]);
  });

  it("réutilise le cache de getOrgane et l'alimente", async () => {
    const fetchMock = repondre((url) =>
      url.pathname.endsWith("/organes/")
        ? { data: (url.searchParams.get("uid") ?? "").split(",").map(organe) }
        : { data: organe("PO1") }
    );
    const { getOrgane, getOrganes } = await charger();

    await getOrgane("PO1");
    await getOrganes(["PO1", "PO2"]);
    await getOrgane("PO2");

    // PO1 individuel, puis un lot pour PO2 seul ; aucun appel pour la relecture de PO2.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("uid")).toBe("PO2");
  });
});
