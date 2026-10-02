import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
import { GET } from "./route";
const request = new Request("http://localhost/api/scrutins/VTANR5L17V8430/votes");
describe("détail des votes à la demande", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("préserve toutes les positions, délégations et groupes sans les profils complets", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: { votes: [
      { uid: "V1", positionVote: "pour", parDelegation: true, acteurRef: { uid: "PA1", prenom: "A", nom: "B", slug: "a-b", urlImage: "photo", mandats: ["unused"] }, groupeVotantRef: { uid: "G1", organeRef: { libelle: "Groupe", libelleAbrev: "G", couleurAssociee: "#aaa", unused: true } } },
      { uid: "V2", positionVote: "nonVotant", parDelegation: false, acteurRef: null, groupeVotantRef: null },
    ] } })));
    const response = await GET(request, { params: Promise.resolve({ uid: "VTANR5L17V8430" }) });
    expect(response.status).toBe(200);
    const { votes } = await response.json();
    expect(votes).toHaveLength(2);
    expect(votes[0]).toMatchObject({ parDelegation: true, positionVote: "pour", groupeVotantRef: { uid: "G1" } });
    expect(votes[0].acteurRef).not.toHaveProperty("mandats");
    expect(votes[1]).toMatchObject({ positionVote: "nonVotant", acteurRef: null });
  });
  it("n'exclut pas les identifiants du Sénat", async () => {
    const mock = vi.fn().mockResolvedValue(Response.json({ data: { votes: [] } }));
    vi.stubGlobal("fetch", mock);
    expect((await GET(request, { params: Promise.resolve({ uid: "VTSENAT123" }) })).status).toBe(200);
  });
  it("une panne ou réponse invalide est réessayable, pas un détail vide", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ data: {} })));
    const response = await GET(request, { params: Promise.resolve({ uid: "VTANR5L17V8430" }) });
    expect(response.status).toBe(502);
    expect(await response.json()).toHaveProperty("error");
  });
  it("refuse les chemins arbitraires avant toute requête amont", async () => {
    const mock = vi.fn(); vi.stubGlobal("fetch", mock);
    expect((await GET(request, { params: Promise.resolve({ uid: "../secret" }) })).status).toBe(400);
    expect(mock).not.toHaveBeenCalled();
  });
});
