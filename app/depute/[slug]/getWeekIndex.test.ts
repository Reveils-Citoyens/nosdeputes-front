import { describe, expect, it } from "vitest";
import { getWeekIndex, getWeekStartDate } from "./getWeekIndex";

describe("getWeekIndex", () => {
  // Les `semaineIndex` sont produits par statistiques_activite.py lors des
  // imports nocturnes. Le front doit utiliser exactement la même origine, sinon
  // les barres du graphe d'activité sont étiquetées avec un décalage.
  it("place l'origine de la XVIIe législature au lundi 15/07/2024", () => {
    // La législature s'ouvre le jeudi 18/07/2024 : la semaine 0 est celle qui
    // contient cette date, donc elle démarre le lundi précédent.
    expect(getWeekStartDate(17, 0).toISOString().slice(0, 10)).toBe(
      "2024-07-15"
    );
  });

  it("commence toutes les semaines un lundi", () => {
    for (const semaineIndex of [0, 1, 13, 50, 104]) {
      expect(getWeekStartDate(17, semaineIndex).getUTCDay()).toBe(1);
    }
  });

  it("range la semaine budgétaire du 21 au 26 octobre 2024 en semaine 14", () => {
    // Semaine du maximum d'activité d'Éric Coquerel en séance publique : elle
    // sert de témoin de non-régression, en accord avec la valeur calculée par
    // statistiques_activite.py.
    expect(getWeekIndex(17, new Date("2024-10-21T16:00:00Z"))).toBe(14);
    expect(getWeekIndex(17, new Date("2024-10-26T15:00:00Z"))).toBe(14);
    expect(getWeekStartDate(17, 14).toISOString().slice(0, 10)).toBe(
      "2024-10-21"
    );
  });

  it("est cohérent entre index et date de début", () => {
    for (const semaineIndex of [0, 1, 13, 50, 104]) {
      expect(getWeekIndex(17, getWeekStartDate(17, semaineIndex))).toBe(
        semaineIndex
      );
    }
  });

  it("refuse une législature inconnue", () => {
    expect(() => getWeekIndex(18, new Date())).toThrow();
  });
});
