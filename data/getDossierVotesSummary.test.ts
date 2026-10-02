import { afterEach, describe, expect, it, vi } from "vitest";
import { getDossierVotesSummaryUnCached } from "./getDossierVotesSummary";
describe("résumés des votes", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("préserve actes, scrutins, totaux, dates et références nulles sans envoyer de votes individuels", async () => {
    const mock = vi.fn().mockResolvedValue(Response.json({ data: { actesLegislatifs: [{
      uid: "ACTE", codeActe: "AN2-DEBATS-DEC", nomCanonique: "Vote", dateActe: "2026-10-01",
      voteRefs: [{ voteRef: { uid: "VTANR5L17V8430", numero: "8430", titre: "Titre", dateScrutin: "2026-10-01", code: "adopté", pour: 100, contre: 20, abstentions: 3, votes: [{ secret: "unused" }] } }, { voteRef: null }],
    }] } }));
    vi.stubGlobal("fetch", mock);
    const data = await getDossierVotesSummaryUnCached("DOSSIER");
    expect(String(mock.mock.calls[0][0])).toContain("include=actesLegislatifs.voteRefs.voteRef");
    expect(String(mock.mock.calls[0][0])).not.toContain("votes.acteurRef");
    const acte = data!.actesLegislatifs[0];
    expect(acte.dateActe).toBeInstanceOf(Date);
    expect(acte.voteRefs[0].voteRef).toMatchObject({ pour: 100, contre: 20, abstentions: 3 });
    expect(acte.voteRefs[0].voteRef).not.toHaveProperty("votes");
    expect(acte.voteRefs[1].voteRef).toBeNull();
  });
  it("ne fait pas passer une panne pour un dossier sans votes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(getDossierVotesSummaryUnCached("DOSSIER")).resolves.toBeNull();
  });
});
