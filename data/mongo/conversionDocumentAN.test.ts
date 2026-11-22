import { describe, expect, it } from "vitest";
import { documentDepuisAN, identifiantSenat, urlPdfCandidate } from "./conversionDocumentAN";

const BRUT = {
  uid: "PIONANR5L17B3140",
  "@xsi:type": "texteLoi_Type",
  legislature: "17",
  auteurs: { auteur: { acteur: { acteurRef: "PA793980", qualite: "auteur" } } },
  coSignataires: {
    coSignataire: [
      { acteur: { acteurRef: "PA795362" }, dateCosignature: "2026-11-03+01:00", dateRetraitCosignature: null, edite: "false" },
      { acteur: { acteurRef: "PA793664" }, dateCosignature: "2026-11-03+01:00", dateRetraitCosignature: "2026-11-10+01:00", edite: "true" },
    ],
  },
  classification: {
    famille: { depot: { code: "INITDEP", libelle: "Initiative en 1er Dépôt" }, classe: { code: "PIONLOI", libelle: "Proposition de loi" } },
    type: { code: "PION", libelle: "Proposition de loi" },
    sousType: null,
    statutAdoption: null,
  },
  cycleDeVie: { chrono: { dateCreation: "2026-09-15T00:00:00.000+02:00", dateDepot: "2026-09-15T00:00:00.000+02:00" } },
  denominationStructurelle: "Proposition de loi",
  dossierRef: "DLR5L17N54870",
  notice: { numNotice: "3140", formule: "visant à renforcer…", adoptionConforme: "false" },
  titres: { titrePrincipal: "proposition de loi visant à renforcer…", titrePrincipalCourt: "renforcer…" },
};

describe("urlPdfCandidate", () => {
  it("reproduit le chemin des copies PDF de Tricoteuses", () => {
    expect(urlPdfCandidate("PIONANR5L17B3140")).toBe(
      "https://tricoteuses-assets.s3.fr-par.scw.cloud/documents/AN/PION/AN/R5/17/B/003/PIONANR5L17B3140/dyn-docs.pdf"
    );
    expect(urlPdfCandidate("PIONANR5L17BTC0367")).toBe(
      "https://tricoteuses-assets.s3.fr-par.scw.cloud/documents/AN/PION/AN/R5/17/BTC/000/PIONANR5L17BTC0367/dyn-docs.pdf"
    );
    expect(urlPdfCandidate("pjl26-172")).toBeNull();
  });
});

describe("documentDepuisAN", () => {
  const document = documentDepuisAN(BRUT, 12, null);

  it("champs affichés, au format de l'API", () => {
    expect(document.chambre).toBe("AN");
    expect(document.legislature).toBe(17);
    expect(document.titrePrincipal).toBe("Proposition de loi visant à renforcer…");
    expect(document.titrePrincipalCourt).toBe("Renforcer…");
    expect(document.typeLibelle).toBe("Proposition de loi");
    expect(document.depotLibelle).toBe("Initiative en 1er Dépôt");
    expect(document.dateCreation).toBe("2026-09-15T00:00:00.000Z");
    expect(document._count.amendements).toBe(12);
    expect(document.pdfUrl).toBeNull();
  });

  it("auteurs et cosignataires", () => {
    expect(document.auteurs.map((a) => a.acteurRefUid)).toEqual(["PA793980"]);
    expect(document.auteurPrincipalUid).toBe("PA793980");
    expect(document.coSignataires.map((c) => [c.acteurRefUid, c.edite, c.dateRetraitCosignature])).toEqual([
      ["PA795362", false, null],
      ["PA793664", true, "2026-11-10T00:00:00.000Z"],
    ]);
  });

  it("auteur qui est un organe (avis d'une commission)", () => {
    const avis = documentDepuisAN({ uid: "AVISANR5L17B3279", auteurs: { auteur: { organe: { organeRef: "PO838901" } } } }, 0, null);
    expect(avis.auteurs.map((a) => [a.acteurRefUid, a.organeRefUid])).toEqual([[null, "PO838901"]]);
    expect(avis.auteurPrincipalUid).toBeNull();
  });
});

describe("identifiantSenat", () => {
  it("traduit les identifiants AN des textes du Sénat", () => {
    expect(identifiantSenat("PIONSNR5S479B0311")).toBe("ppl25-311");
    expect(identifiantSenat("PIONSNR5S479BTA0130")).toBe("tas25-130");
    expect(identifiantSenat("RAPPSNR5S479B0700")).toBe("l25-700");
    expect(identifiantSenat("PRJLSNR5S499B0172")).toBe("pjl26-172");
    expect(identifiantSenat("PIONSNR5S479BTC0701")).toBeNull();
    expect(identifiantSenat("PIONANR5L17B3140")).toBeNull();
    expect(identifiantSenat("PRJLSNR5S499B1024")).toBe("pjl26-1024");
  });
});
