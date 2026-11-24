import { describe, expect, it } from "vitest";
import { cleDeTri, comparerDeputes, groupDeputes, initiale } from "./groupDeputes";
import type { DeputeListItem } from "./deputeListItem";

const depute = (uid: string, prenom: string, nom: string, groupe: string | null = "G"): DeputeListItem =>
  ({ uid, prenom, nom, slug: uid, urlImage: null, groupeParlementaireUid: groupe, auGouvernement: !groupe }) as DeputeListItem;

describe("ordre alphabétique des députés", () => {
  it("classe sans particule ni accent", () => {
    expect(initiale("de Courson")).toBe("C");
    expect(initiale("Élise")).toBe("E");
    expect(cleDeTri("Le Pen")).toBe("le pen");
    const noms = [depute("1", "Bertrand", "Bertrand"), depute("2", "Charles", "de Courson"), depute("3", "Bérangère", "Couillard"), depute("4", "Jean", "Bérard")]
      .sort(comparerDeputes)
      .map((d) => d.nom);
    expect(noms).toEqual(["Bérard", "Bertrand", "Couillard", "de Courson"]);
  });

  it("range les membres du Gouvernement à part, hors des lettres", () => {
    const { uidPerNom, uidPerGroup } = groupDeputes({
      PA1: depute("PA1", "Charles", "de Courson"),
      PA2: depute("PA2", "Gérald", "Darmanin", null),
    });
    expect(uidPerNom).toEqual({ C: ["PA1"] });
    expect(uidPerGroup[""]).toEqual(["PA2"]);
  });
});
