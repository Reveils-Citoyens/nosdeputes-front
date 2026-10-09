import { describe, expect, it } from "vitest";
import { elementsAmendements, elementsDesActes, organesACharger, resumeScrutin, type ActeDossier } from "./actesDossier";

const base = "/17/dossier/DLR5L17N53187";
const acte = (codeActe: string, dateActe: string, extra: Partial<ActeDossier> = {}): ActeDossier => ({
  uid: `${codeActe}-${dateActe}-${extra.organeRefUid ?? ""}`,
  codeActe,
  dateActe: `${dateActe}T00:00:00.000Z`,
  ...extra,
});
const titres = (actes: ActeDossier[], organes?: Map<string, string>) =>
  elementsDesActes(actes, { base, organes }).map((e) => e.titre);

describe("elementsDesActes", () => {
  it("distingue dépôt initial et transmission en navette, par chambre", () => {
    expect(
      titres([
        acte("AN1-DEPOT", "2025-11-18", { nomCanonique: "1er dépôt d'une initiative." }),
        acte("SN1-DEPOT", "2026-01-27", { nomCanonique: "Dépôt d'une initiative en navette" }),
      ]),
    ).toEqual(["Texte déposé à l'Assemblée nationale (1re lecture)", "Texte transmis au Sénat (1re lecture)"]);
  });

  it("garde le libellé source de la décision et ajoute le décompte du scrutin", () => {
    const [decision] = elementsDesActes(
      [
        acte("CMP-DEBATS-SN-DEC", "2026-07-21", {
          libelleStatutConclusion: "adoptée, dans les conditions prévues à l'article 45, alinéa 3, de la Constitution",
        }),
        acte("AN1-DEBATS-DEC", "2026-07-21", {
          libelleStatutConclusion: "adopté",
          voteRefs: [
            {
              voteRef: {
                uid: "VTANR5L17V8430",
                numero: "8430",
                pour: 378,
                contre: "7",
                abstentions: 173,
                libelleTypeVote: "scrutin public solennel",
              },
            },
          ],
        }),
      ],
      { base },
    ).filter((e) => e.titre.startsWith("Adopté par"));
    expect(decision.titre).toBe("Adopté par l'Assemblée nationale (1re lecture)");
    expect(decision.description).toBe("Scrutin public solennel n° 8430 : 378 pour, 7 contre, 173 abstentions.");
    expect(decision.lien).toBe(`${base}/votes`);

    const [cmp] = elementsDesActes(
      [acte("CMP-DEBATS-SN-DEC", "2026-07-21", { libelleStatutConclusion: "adoptée, dans les conditions prévues à l'article 45" })],
      { base },
    );
    expect(cmp.titre).toBe("Adoptée par le Sénat (texte de la commission mixte paritaire)");
    expect(cmp.description).toBe("Adoptée, dans les conditions prévues à l'article 45.");
  });

  it("place la décision après l'examen du même jour", () => {
    const [premier, second] = elementsDesActes(
      [acte("AN1-DEBATS-DEC", "2026-01-26", { libelleStatutConclusion: "adoptée" }), acte("AN1-DEBATS", "2026-01-26")],
      { base },
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
    expect(premier.titre).toMatch(/^Adoptée/);
    expect(second.titre).toMatch(/^Examen en séance publique/);
  });

  it("couvre CMP, Conseil constitutionnel et promulgation", () => {
    expect(
      titres([
        acte("CMP-DEC", "2026-07-21", { libelleStatutConclusion: "Accord" }),
        acte("CC-CONCLUSION", "2026-08-14", { libelleStatutConclusion: "Partiellement conforme" }),
        acte("PROM-PUB", "2026-08-18", { titreLoi: "visant à protéger les mineurs" }),
      ]),
    ).toEqual([
      "Commission mixte paritaire : accord",
      "Décision du Conseil constitutionnel : partiellement conforme",
      "Loi promulguée",
    ]);
  });

  it("nomme la commission et ne garde qu'une réunion par jour", () => {
    const organes = new Map([["PO419604", "Commission des affaires culturelles et de l'éducation"]]);
    const actes = [
      acte("AN1-COM-FOND-REUNION", "2026-01-13", { organeRefUid: "PO419604", uid: "r1" }),
      acte("AN1-COM-FOND-REUNION", "2026-01-13", { organeRefUid: "PO419604", uid: "r2" }),
    ];
    expect(organesACharger(actes)).toEqual(["PO419604"]);
    const elements = elementsDesActes(actes, { base, organes });
    expect(elements).toHaveLength(1);
    expect(elements[0]).toMatchObject({
      guid: "r1",
      description: "Commission des affaires culturelles et de l'éducation.",
      lien: `${base}/commission`,
    });
  });

  it("ignore les actes conteneurs, sans date ou inconnus", () => {
    expect(
      titres([
        acte("AN1", "2025-11-18"),
        acte("AN1-COM-FOND-SAISIE", "2025-11-18"),
        acte("AN1-COM-FOND-NOMIN", "2025-11-18"),
        { uid: "x", codeActe: "AN1-DEBATS", dateActe: null },
        acte("XYZ-INCONNU", "2025-11-18"),
      ]),
    ).toEqual([]);
  });
});

describe("resumeScrutin", () => {
  it("accorde abstention au singulier et omet un décompte absent", () => {
    expect(resumeScrutin({ uid: "v", numero: "1", pour: 462, contre: 0, abstentions: 1 })).toBe(
      "Scrutin public n° 1 : 462 pour, 0 contre, 1 abstention.",
    );
    expect(resumeScrutin({ uid: "v" })).toBe("Scrutin public.");
  });
});

describe("elementsAmendements", () => {
  it("un élément par jour, guid stable, auteurs et Gouvernement en description", () => {
    const [jour] = elementsAmendements(
      [{ jour: "2026-01-22", total: 85, gouvernement: 1, auteurs: [{ nom: "Lisa Belluco", nombre: 14 }] }],
      { base, dossierUid: "DLR5L17N53187" },
    );
    expect(jour).toMatchObject({
      guid: "amendements-DLR5L17N53187-2026-01-22",
      titre: "85 amendements déposés le 22 janvier 2026",
      description: "Principaux auteurs : Lisa Belluco (14). 1 amendement du Gouvernement.",
      lien: `${base}/amendement`,
    });
    expect(
      elementsAmendements([{ jour: "2026-01-23", total: 1, gouvernement: 0, auteurs: [] }], { base, dossierUid: "D" })[0].titre,
    ).toBe("1 amendement déposé le 23 janvier 2026");
  });
});
