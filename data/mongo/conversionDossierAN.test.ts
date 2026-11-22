import { describe, expect, it } from "vitest";
import { dossierDepuisAN } from "./conversionDossierAN";

const BRUT = {
  uid: "DLR5L17N51962",
  "@xsi:type": "DossierLegislatif_Type",
  legislature: "17",
  procedureParlementaire: { code: "2", libelle: "Proposition de loi ordinaire" },
  titreDossier: {
    titre: "visant à exercer l’accès à l’emploi",
    titreChemin: "acces_emploi_17",
    senatChemin: "http://www.senat.fr/dossier-legislatif/ppl25-311.html",
  },
  initiateur: { acteurs: { acteur: { acteurRef: "PA721474", mandatRef: "PM1" } } },
  actesLegislatifs: {
    acteLegislatif: {
      "@xsi:type": "Etape_Type",
      uid: "L17-AN1-51962",
      codeActe: "AN1",
      libelleActe: { nomCanonique: "1ère lecture", libelleCourt: "1ère lecture" },
      organeRef: "PO838901",
      dateActe: null,
      actesLegislatifs: {
        acteLegislatif: [
          {
            "@xsi:type": "DepotInitiative_Type",
            uid: "L17-VD1DI",
            codeActe: "AN1-DEPOT",
            libelleActe: { nomCanonique: "Dépôt", libelleCourt: "Dépôt" },
            organeRef: "PO838901",
            dateActe: "2025-04-17T00:00:00.000+02:00",
            texteAssocie: "PIONANR5L17B1326",
          },
          {
            "@xsi:type": "ProcedureAccelere_Type",
            uid: "L17-VD1PA",
            codeActe: "AN1-PROCACC",
            libelleActe: { nomCanonique: "Procédure accélérée" },
            organeRef: "PO838901",
            dateActe: "2025-04-20T00:00:00.000+02:00",
          },
          {
            "@xsi:type": "Etape_Type",
            uid: "L17-AN1-COM-51962",
            codeActe: "AN1-COM-FOND",
            libelleActe: { nomCanonique: "Travaux de la commission saisie au fond" },
            organeRef: "PO420120",
            dateActe: null,
            actesLegislatifs: {
              acteLegislatif: [
                {
                  "@xsi:type": "NominRapporteurs_Type",
                  uid: "L17-VD2NR",
                  codeActe: "AN1-COM-FOND-NOMIN",
                  organeRef: "PO420120",
                  dateActe: "2025-05-14T00:00:00.000+02:00",
                  rapporteurs: { rapporteur: { acteurRef: "PA721474", typeRapporteur: "rapporteur" } },
                },
                {
                  "@xsi:type": "SaisieComFond_Type",
                  uid: "L17-VD2CFS",
                  codeActe: "AN1-COM-FOND-SAISIE",
                  organeRef: "PO420120",
                  dateActe: "2025-04-18T00:00:00.000+02:00",
                },
              ],
            },
          },
          {
            "@xsi:type": "Decision_Type",
            uid: "L17-VD3DEC",
            codeActe: "AN1-DEBATS-DEC",
            organeRef: "PO838901",
            dateActe: "2026-11-19T00:00:00.000+01:00",
            statutConclusion: { fam_code: "TSORTF03", libelle: "adoptée sans modification" },
            textesAssocies: {
              texteAssocie: [
                { typeTexte: "BTA", refTexteAssocie: "PIONANR5L17BTA0367" },
                { typeTexte: "TAP", refTexteAssocie: "PIONANR5L17TAP0367" },
              ],
            },
          },
        ],
      },
    },
  },
};

describe("dossierDepuisAN", () => {
  const dossier = dossierDepuisAN(BRUT);
  const acte = (code: string) => dossier.actesLegislatifs.find((a) => a.codeActe === code)!;

  it("reproduit les champs du dossier de l'API", () => {
    expect(dossier.titre).toBe("Visant à exercer l’accès à l’emploi");
    expect(dossier.numero).toBe("1962");
    expect(dossier.legislature).toBe(17);
    expect(dossier.codeProcedure).toBe("2");
    expect(dossier.procedureAcceleree).toBe(true);
    expect(dossier.dateDepot).toBe("2025-04-17T00:00:00.000Z");
    expect(dossier.documentDeposeRefUid).toBe("PIONANR5L17B1326");
    expect(dossier.acteurPrincipalRefUid).toBe("PA721474");
    expect(dossier.commissionANRefUid).toBe("PO420120");
    expect(dossier.senatSignet).toBe("ppl25-311");
  });

  it("met les actes à plat dans l'ordre, avec les identifiants de l'API", () => {
    expect(dossier.actesLegislatifs.map((a) => a.uid)).toEqual([
      "L17-AN1-51962-AN1-PO838901",
      "L17-VD1DI-AN1-DEPOT-PO838901",
      "L17-VD1PA-AN1-PROCACC-PO838901",
      "L17-AN1-COM-51962-AN1-COM-FOND-PO420120",
      "L17-VD2NR-AN1-COM-FOND-NOMIN-PO420120",
      "L17-VD2CFS-AN1-COM-FOND-SAISIE-PO420120",
      "L17-VD3DEC-AN1-DEBATS-DEC-PO838901",
    ]);
    expect(acte("AN1-COM-FOND-NOMIN").parentUid).toBe("L17-AN1-COM-51962-AN1-COM-FOND-PO420120");
    expect(acte("AN1").parentUid).toBeNull();
  });

  it("date d'un acte sans date : la plus ancienne de ses sous-actes directs", () => {
    expect(acte("AN1").dateActe).toBe("2025-04-17T00:00:00.000Z");
    expect(acte("AN1-COM-FOND").dateActe).toBe("2025-04-18T00:00:00.000Z");
  });

  it("décision : adoption, conclusion et dernier texte associé", () => {
    const decision = acte("AN1-DEBATS-DEC");
    expect(decision.adoption).toBe(true);
    expect(decision.libelleStatutConclusion).toBe("adoptée sans modification");
    expect(decision.texteAssocieRefUid).toBe("PIONANR5L17TAP0367");
    expect(acte("AN1-DEPOT").adoption).toBeNull();
  });

  it("rapporteurs rattachés à l'acte de nomination", () => {
    expect(dossier.rapporteurs).toEqual([
      expect.objectContaining({
        acteurRefUid: "PA721474",
        typeRapporteur: "rapporteur",
        acteLegislatifRefUid: "L17-VD2NR-AN1-COM-FOND-NOMIN-PO420120",
      }),
    ]);
  });
});
