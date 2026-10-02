import { describe, expect, it, vi } from "vitest";
import { loadRemainingAmendments } from "./loadRemainingAmendments";
describe("pagination exhaustive des métadonnées de la liseuse", () => {
  it("charge toutes les pages du total officiel, y compris la dernière page partielle", async () => {
    const load = vi.fn(async (page: number) => ({ items: page === 2 ? [3, 4] : [5], total: 5 }));
    await expect(loadRemainingAmendments({ items: [1, 2], total: 5, totalIsKnown: true }, 2, load)).resolves.toEqual([3, 4, 5]);
    expect(load.mock.calls).toEqual([[2], [3]]);
  });
  it("sans total officiel, continue jusqu'à la première page partielle", async () => {
    const load = vi.fn(async (page: number) => ({ items: page < 4 ? [page, page] : [4], total: 3, totalIsKnown: false }));
    await expect(loadRemainingAmendments({ items: [1, 1], total: 3, totalIsKnown: false }, 2, load)).resolves.toEqual([2, 2, 3, 3, 4]);
    expect(load.mock.calls).toEqual([[2], [3], [4]]);
  });
  it("ne masque pas une page manquante", async () => {
    const load = vi.fn().mockRejectedValue(new Error("HTTP 503"));
    await expect(loadRemainingAmendments({ items: [1, 2], total: 4 }, 2, load)).rejects.toThrow("HTTP 503");
  });
  it("ne fait aucun appel lorsque tous les résultats sont déjà chargés", async () => {
    const load = vi.fn();
    await expect(loadRemainingAmendments({ items: [1], total: 1 }, 2, load)).resolves.toEqual([]);
    expect(load).not.toHaveBeenCalled();
  });
  it("ne boucle pas si l'API ignore le numéro de page", async () => {
    const load = vi.fn().mockResolvedValue({ items: [1, 2], total: 3, totalIsKnown: false });
    await expect(loadRemainingAmendments({ items: [1, 2], total: 3, totalIsKnown: false }, 2, load)).rejects.toThrow("did not advance");
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("ne présente pas une pagination tronquée comme complète", async () => {
    const load = vi.fn().mockResolvedValue({ items: [], total: 4 });
    await expect(loadRemainingAmendments({ items: [1, 2], total: 4 }, 2, load)).rejects.toThrow("Incomplete");
  });
});
