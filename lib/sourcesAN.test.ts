import { describe, expect, it } from "vitest";
import {
  formatsTexte,
  urlAmendement,
  urlCompteRendu,
  urlDepute,
  urlDossier,
  urlQuestion,
  urlScrutin,
  urlSource,
  urlTexte,
} from "./sourcesAN";

// Exemples réels, dont l'URL a été ouverte avec succès sur le site de
// l'Assemblée (réponse 200 et titre de page attendu).
const AN = "https://www.assemblee-nationale.fr";

describe("liens vers le site de l'Assemblée nationale", () => {
  it.each([
    [urlDepute("PA722142"), `${AN}/dyn/deputes/PA722142`],
    [urlDossier("DLR5L17N54372"), `${AN}/dyn/17/dossiers/DLR5L17N54372`],
    [urlScrutin("VTANR5L17V8430"), `${AN}/dyn/17/scrutins/8430`],
    [
      urlAmendement("AMANR5L17PO838901BTC3190P0D1N000433"),
      `${AN}/dyn/17/amendements/AMANR5L17PO838901BTC3190P0D1N000433`,
    ],
    [urlAmendement("AMANR5L17PO59048B3210P1D1N000196"), `${AN}/dyn/17/amendements/AMANR5L17PO59048B3210P1D1N000196`],
    [urlTexte("PRJLANR5L17B3210"), "/source/texte/PRJLANR5L17B3210"],
    [urlTexte("AVISANR5L17B3279-tIII"), "/source/texte/AVISANR5L17B3279-tIII"],
    [urlCompteRendu("CRSANR5L17S2026O1N149"), `${AN}/dyn/17/comptes-rendus/seance/CRSANR5L17S2026O1N149`],
    [urlCompteRendu("CRCANR5L17S2026PO59048N131"), `${AN}/dyn/opendata/CRCANR5L17S2026PO59048N131.html`],
    [urlQuestion("QANR5L17QE17785"), `${AN}/dyn/17/questions/QANR5L17QE17785`],
    [urlQuestion("QANR5L17QG1171"), `${AN}/dyn/17/questions/QANR5L17QG1171`],
  ])("%s", (obtenu, attendu) => {
    expect(obtenu).toBe(attendu);
  });

  it("lit la législature dans l'identifiant", () => {
    expect(urlDossier("DLR5L16N47000")).toBe(`${AN}/dyn/16/dossiers/DLR5L16N47000`);
    expect(urlScrutin("VTANR5L16V12")).toBe(`${AN}/dyn/16/scrutins/12`);
  });

  it("renvoie null plutôt qu'un lien vers une page d'erreur", () => {
    expect(urlDepute(null)).toBeNull();
    expect(urlDepute("../admin")).toBeNull();
    expect(urlDossier("DLR5L17N54372-PAP 2027.pdf")).toBeNull();
    expect(urlScrutin("8430")).toBeNull();
    expect(urlTexte("DLR5L17N54629-PAP 2027 - Justice.pdf")).toBeNull();
    // Réunion de l'agenda : aucune page du site ne l'accepte par identifiant.
    expect(urlCompteRendu("RUANR5L17S2026IDS30880")).toBeNull();
    expect(urlQuestion("QANR5L17")).toBeNull();
  });

  it("aiguille un identifiant quelconque vers le bon type de page", () => {
    expect(urlSource("AMANR5L17PO59048B3210P1D1N000196")).toContain("/amendements/");
    expect(urlSource("QANR5L17QE17785")).toContain("/questions/");
    expect(urlSource("PIONANR5L17B3271")).toBe("/source/texte/PIONANR5L17B3271");
    expect(urlSource("CRSANR5L17S2026O1N149")).toContain("/comptes-rendus/seance/");
    expect(urlSource(undefined)).toBeNull();
  });

  it("essaie d'abord le format publié pour chaque type de texte", () => {
    expect(formatsTexte("PRJLANR5L17B2841")[0]).toBe(`${AN}/dyn/opendata/PRJLANR5L17B2841.html`);
    expect(formatsTexte("ETDIANR5L17B2841")[0]).toBe(`${AN}/dyn/opendata/ETDIANR5L17B2841.pdf`);
    expect(formatsTexte("PIONANR5L17TAP0140")[0]).toBe(`${AN}/dyn/opendata/PIONANR5L17TAP0140.pdf`);
    expect(formatsTexte("LETTANR5L17B3000")).toHaveLength(2);
  });
});
