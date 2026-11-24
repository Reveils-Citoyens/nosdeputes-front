import { describe, expect, it } from "vitest";
import { fonctionGouvernement, horsAssemblee, mandatInterrompu, situationActeur } from "./situationActeur";

const gouvernement = { typeOrgane: "GOUVERNEMENT", libQualite: "membre" };
const ministere = (libQualiteSex: string, libelle: string) => ({
  typeOrgane: "MINISTERE",
  libQualite: libQualiteSex,
  libQualiteSex,
  organeRef: { libelle },
});

describe("fonctionGouvernement", () => {
  it("garde les qualités complètes", () => {
    expect(fonctionGouvernement([gouvernement, ministere("Premier ministre", "Premier ministre")])).toEqual({
      court: "Premier ministre",
      intitule: "Premier ministre",
    });
    expect(
      fonctionGouvernement([ministere("Garde des sceaux, ministre de la justice", "Ministère de la justice")])
    ).toEqual({ court: "Garde des sceaux", intitule: "Garde des sceaux, ministre de la justice" });
  });

  it("complète une qualité générique par le ministère", () => {
    expect(fonctionGouvernement([ministere("Ministre", "Ministère de l'intérieur")])?.intitule).toBe(
      "Ministre de l'intérieur"
    );
    expect(
      fonctionGouvernement([ministere("Ministre déléguée", "Ministère délégué auprès du ministre de l'intérieur")])
    ).toEqual({ court: "Ministre déléguée", intitule: "Ministre déléguée auprès du ministre de l'intérieur" });
  });

  it("membre du Gouvernement sans ministère connu", () => {
    expect(fonctionGouvernement([gouvernement])?.intitule).toBe("Membre du Gouvernement");
    expect(fonctionGouvernement([{ typeOrgane: "ASSEMBLEE" }])).toBeNull();
  });
});

describe("situationActeur", () => {
  it("Premier ministre venu du Sénat : hors de l'Assemblée", () => {
    const s = situationActeur([gouvernement, ministere("Premier ministre", "Premier ministre")], []);
    expect(horsAssemblee(s)).toBe(true);
    expect(mandatInterrompu(s)).toBe(false);
  });

  it("député devenu ministre : mandat interrompu", () => {
    const s = situationActeur([gouvernement], [{ debut: "2024-07-07", fin: "2025-11-12" }]);
    expect(mandatInterrompu(s)).toBe(true);
    expect(s.gouvernement).not.toBeNull();
  });

  it("député en exercice", () => {
    const s = situationActeur([{ typeOrgane: "ASSEMBLEE" }, { typeOrgane: "GP" }], []);
    expect(s.enExercice).toBe(true);
    expect(horsAssemblee(s) || mandatInterrompu(s)).toBe(false);
  });

  it("périodes inconnues : on garde l'affichage habituel", () => {
    expect(horsAssemblee(situationActeur([], null))).toBe(false);
  });
});
