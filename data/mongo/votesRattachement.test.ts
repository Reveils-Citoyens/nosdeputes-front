import { describe, expect, it } from "vitest";
import { dossierDuScrutin, texteVise } from "./votesActeurAN";
import { rattacherVotesOrphelins, texteDuDossier } from "./votesDossierAN";

describe("texteVise", () => {
  it("extrait le titre du texte cité par un scrutin", () => {
    expect(
      texteVise("l'amendement n° 33 de M. Alfandari à l'article premier de la proposition de loi pour retrouver la confiance et l'équilibre dans les rapports locatifs (deuxième lecture).")
    ).toBe("pour retrouver la confiance et l'equilibre dans les rapports");
    expect(texteVise("l'ensemble du projet de loi constitutionnelle pour une Corse autonome au sein de la République (première lecture).")).toBe(
      "pour une corse autonome au sein de la republique"
    );
    expect(texteVise("la déclaration du Gouvernement")).toBeNull();
  });
});

describe("dossierDuScrutin", () => {
  const points = [
    { objet: "Suite de la discussion, en 2e lecture, de la proposition de loi pour retrouver la confiance et l'équilibre dans les rapports locatifs", dossierRef: "D2" },
    { objet: "Discussion, en 2e lecture, de la proposition de loi visant à pérenniser l'expérimentation « territoires zéro chômeur »", dossierRef: "D1" },
  ];

  it("prend le dossier renseigné par l'Assemblée", () => {
    expect(dossierDuScrutin({ objet: { dossierLegislatif: { dossierRef: "D9" } } }, points)).toBe("D9");
  });

  it("à défaut, le point de l'ordre du jour qui cite le même texte", () => {
    const scrutin = { objet: { libelle: "l'article 2 de la proposition de loi pour retrouver la confiance et l'équilibre dans les rapports locatifs (deuxième lecture).", dossierLegislatif: null } };
    expect(dossierDuScrutin(scrutin, points)).toBe("D2");
  });

  it("sans correspondance, seulement s'il n'y a qu'un texte à l'ordre du jour", () => {
    const scrutin = { objet: { libelle: "l'amendement n° 4 de M. X." } };
    expect(dossierDuScrutin(scrutin, points)).toBeNull();
    expect(dossierDuScrutin(scrutin, [points[0]])).toBe("D2");
  });
});

describe("rattacherVotesOrphelins", () => {
  const actes = [
    { codeActe: "AN1-DEBATS-SEANCE", dateActe: "2026-06-17T00:00:00.000Z" },
    { codeActe: "AN1-DEBATS-SEANCE", dateActe: "2026-06-23T00:00:00.000Z" },
    { codeActe: "AN1-DEBATS-DEC", dateActe: "2026-06-23T00:00:00.000Z" },
    { codeActe: "SN1-DEBATS-DEC", dateActe: "2026-07-01T00:00:00.000Z" },
  ];
  const titre = "Projet de loi constitutionnelle pour une Corse autonome au sein de la République";
  const vote = (uid: string, numero: number, dateScrutin: string, libelle: string, seanceCiteLeDossier = false) => ({
    uid,
    numero,
    dateScrutin,
    libelle,
    seanceCiteLeDossier,
  });

  it("vote sur l'ensemble → décision de l'Assemblée du même jour ; amendements ignorés", () => {
    const parActe: string[][] = [[], [], [], []];
    rattacherVotesOrphelins(titre, actes, parActe, [
      vote("V2", 7454, "2026-06-23", "l'ensemble du projet de loi constitutionnelle pour une Corse autonome au sein de la République (première lecture)."),
      vote("V1", 7419, "2026-06-18", "l'amendement n° 84 de M. Ceccoli à l'article unique du projet de loi constitutionnelle pour une Corse autonome"),
    ]);
    expect(parActe).toEqual([[], [], ["V2"], []]);
  });

  it("motion de rejet sans décision ce jour-là → séance du même jour", () => {
    const parActe: string[][] = [[], [], [], []];
    rattacherVotesOrphelins(titre, actes, parActe, [
      vote("M", 7400, "2026-06-17", "la motion de rejet préalable, déposée par M. X, du projet de loi constitutionnelle pour une Corse autonome (première lecture)."),
    ]);
    expect(parActe).toEqual([["M"], [], [], []]);
  });

  it("écarte un scrutin portant sur un autre texte, sauf si la séance avait le dossier à l'ordre du jour", () => {
    const autre = "l'ensemble de la proposition de loi visant à lutter contre la vie chère outre-mer (première lecture).";
    const parActe: string[][] = [[], [], [], []];
    rattacherVotesOrphelins(titre, actes, parActe, [vote("X", 7455, "2026-06-23", autre)]);
    expect(parActe).toEqual([[], [], [], []]);
    expect(texteDuDossier(autre, titre)).toBe(false);
    // « Fin de vie » / « aide à mourir » : titres différents, mais la séance confirme.
    rattacherVotesOrphelins("Fin de vie", actes, parActe, [
      vote("F", 7432, "2026-06-23", "la motion de rejet péalable de la proposition de loi relative au droit à l'aide à mourir (nouvelle lecture).", true),
    ]);
    expect(parActe[2]).toEqual(["F"]);
  });
});
