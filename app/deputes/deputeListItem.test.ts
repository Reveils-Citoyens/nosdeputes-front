import { describe, expect, it } from "vitest";
import { toDeputeListItem } from "./deputeListItem";
import { groupDeputes } from "./groupDeputes";
import type { ActeurDepute } from "@/data/getDeputes";
describe("profils de liste allégés", () => {
  it("conserve noms, recherche, circonscription, mandat et statut gouvernemental", () => {
    const acteur = {
      uid: "PA1", nom: "de Courson", prenom: "Charles", slug: "charles-de-courson", urlImage: "photo",
      groupeParlementaireUid: "G", auGouvernement: true,
      mandatPrincipal: { numCirco: "5", departement: "Marne", numDepartement: "51", dateFin: null },
      mandats: ["unused"], profession: "unused",
    } as unknown as ActeurDepute;
    const item = toDeputeListItem(acteur);
    expect(item).toMatchObject({ nom: "de Courson", auGouvernement: true, mandatPrincipal: { dateFin: null, departement: "Marne", numCirco: "5" } });
    expect(item).not.toHaveProperty("profession");
    expect(groupDeputes({ PA1: item })).toEqual(groupDeputes({ PA1: acteur }));
  });
});
