import { describe, expect, it } from "vitest";
import {
  acteurDepuisAN,
  adressesElectroniquesDepuisAN,
  adressesPostalesDepuisAN,
  dateISO,
  organeDepuisAN,
  scrutinsDuDossier,
  slugActeur,
} from "./conversionAN";

const NIL = { "@xsi:nil": "true" };

function mandat(uid: string, typeOrgane: string, organe: string, debut: string, fin: string | null, extra = {}) {
  return {
    "@xsi:type": "MandatParlementaire_type",
    uid,
    acteurRef: "PA1",
    legislature: "17",
    typeOrgane,
    dateDebut: debut,
    dateFin: fin,
    nominPrincipale: "1",
    infosQualite: { codeQualite: "membre", libQualite: "membre", libQualiteSex: "Membre" },
    organes: { organeRef: organe },
    ...extra,
  };
}

const DEPUTE = mandat("PM1", "ASSEMBLEE", "PO838901", "2024-07-07", null, {
  election: {
    lieu: { region: "Corse", regionType: "Métropolitain", departement: "Corse-du-Sud", numDepartement: "2A", numCirco: "1" },
    causeMandat: "élections générales",
    refCirconscription: "PO1",
  },
  mandature: { datePriseFonction: "2024-07-08", causeFin: null, premiereElection: "1", placeHemicycle: "427" },
});

function acteur(...mandats: object[]) {
  return {
    uid: "PA1",
    etatCivil: {
      ident: { civ: "M.", prenom: "Loïc", nom: "Prud'homme" },
      infoNaissance: { dateNais: "1975-07-25", villeNais: "Beyrouth", depNais: NIL, paysNais: "Liban" },
      dateDeces: NIL,
    },
    profession: { libelleCourant: "Fonctionnaire", socProcINSEE: { catSocPro: "Cadres", famSocPro: "Cadres sup." } },
    mandats: { mandat: mandats.length === 1 ? mandats[0] : mandats },
    adresses: {
      adresse: [
        { "@xsi:type": "AdressePostale_Type", uid: "AD1", type: "0", typeLibelle: "Adresse officielle", codePostal: "75355", ville: "Paris" },
        { "@xsi:type": "AdresseSiteWeb_Type", uid: "AD2", type: "24", typeLibelle: "Twitter", valElec: "@loic" },
        { "@xsi:type": "AdresseMail_Type", uid: "AD3", type: "15", typeLibelle: "Mèl", valElec: "loic@an.fr" },
      ],
    },
  };
}

describe("slugActeur", () => {
  it("reproduit les slugs de Tricoteuses", () => {
    expect(slugActeur("Boris", "Vallaud")).toBe("boris-vallaud");
    expect(slugActeur("Loïc", "Prud'homme")).toBe("loic-prudhomme");
    expect(slugActeur("Christelle", "D’Intorni")).toBe("christelle-dintorni");
    expect(slugActeur("Émeline", "K/Bidi")).toBe("emeline-kbidi");
    expect(slugActeur("Jean-Luc", "Mélenchon")).toBe("jean-luc-melenchon");
  });
});

describe("dateISO", () => {
  it("garde le jour exact de l'open data, au format de l'API", () => {
    expect(dateISO("1975-07-25")).toBe("1975-07-25T00:00:00.000Z");
    expect(dateISO(NIL)).toBeNull();
  });
});

describe("acteurDepuisAN", () => {
  it("député en exercice : mandat principal, groupe, commission, réseaux", () => {
    const a = acteurDepuisAN(
      acteur(
        DEPUTE,
        mandat("PM2", "GP", "PO845419", "2024-07-18", null),
        mandat("PM3", "COMPER", "PO59046", "2024-07-19", null)
      )
    );
    expect(a.slug).toBe("loic-prudhomme");
    expect(a.actif).toBe(true);
    expect(a.auGouvernement).toBe(false);
    expect(a.mandatPrincipal?.uid).toBe("PM1");
    expect(a.mandatPrincipal?.numDepartement).toBe(2); // « 2A », comme l'API
    expect(a.groupeParlementaireUid).toBe("PO845419");
    expect(a.commissionPermanenteRefUid).toBe("PO59046");
    expect(a.compteTwitter).toBe("@loic");
    expect(a.dateNais).toBe("1975-07-25T00:00:00.000Z");
    expect(a.depNais).toBeNull();
  });

  it("ancien député : ni mandat principal ni groupe, comme l'API", () => {
    const a = acteurDepuisAN(
      acteur({ ...DEPUTE, dateFin: "2025-03-30" }, mandat("PM2", "GP", "PO845419", "2024-07-18", "2025-03-30"))
    );
    expect(a.actif).toBe(false);
    expect(a.mandatPrincipal).toBeNull();
    expect(a.groupeParlementaireUid).toBeNull();
  });

  it("ministre : actif, au Gouvernement, mandat au Gouvernement si le siège est cédé", () => {
    const a = acteurDepuisAN(
      acteur({ ...DEPUTE, dateFin: "2024-10-21" }, mandat("PM9", "GOUVERNEMENT", "PO873634", "2025-10-13", null))
    );
    expect(a.actif).toBe(true);
    expect(a.auGouvernement).toBe(true);
    expect(a.mandatPrincipal?.uid).toBe("PM9");
  });

  it("un mandat ouvert dans un organe clos n'est plus en cours", () => {
    // Doublon de l'open data : le gouvernement Bayrou est clos, le mandat non.
    const a = acteurDepuisAN(
      acteur(mandat("PM9", "GOUVERNEMENT", "PO855052", "2024-12-14", null)),
      new Set(["PO855052"])
    );
    expect(a.actif).toBe(false);
    expect(a.auGouvernement).toBe(false);
  });
});

describe("adresses", () => {
  it("sépare adresses postales et électroniques", () => {
    const brut = acteur(DEPUTE);
    expect(adressesPostalesDepuisAN(brut).map((a) => a.uid)).toEqual(["AD1"]);
    expect(adressesElectroniquesDepuisAN(brut).map((a) => a.uid)).toEqual(["AD2", "AD3"]);
  });
});

describe("organeDepuisAN", () => {
  it("garde les couleurs affichées par le site", () => {
    const brut = { uid: "PO845419", codeType: "GP", libelle: "Socialistes", libelleAbrev: "SOC", libelleAbrege: "SOC", couleurAssociee: "#F5B4CE", viMoDe: { dateDebut: "2024-07-18", dateFin: null } };
    expect(organeDepuisAN(brut, { PO845419: "#EC407A" }).couleurAssociee).toBe("#EC407A");
    expect(organeDepuisAN(brut).couleurAssociee).toBe("#F5B4CE");
  });
});

describe("scrutinsDuDossier", () => {
  it("collecte les scrutins des actes, sans doublon", () => {
    const actes = {
      acteLegislatif: {
        codeActe: "AN1",
        actesLegislatifs: {
          acteLegislatif: [
            { codeActe: "AN1-DEBATS-DEC", voteRefs: { voteRef: "VTANR5L17V1" } },
            { codeActe: "AN1-DEBATS-DEC", voteRefs: { voteRef: ["VTANR5L17V1", "VTANR5L17V2"] } },
          ],
        },
      },
    };
    expect(scrutinsDuDossier(actes)).toEqual(["VTANR5L17V1", "VTANR5L17V2"]);
  });
});
