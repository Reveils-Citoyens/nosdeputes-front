import type { Paragraphe } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  extraire,
  numeroTexte,
  regrouperConjointes,
  resumerDebat,
  type DebatActeur,
} from "./interventionsActeurAN";

const p = (ordre: number, champs: Partial<Paragraphe>) =>
  ({ ordreAbsoluSeance: ordre, codeGrammaire: null, codeStyle: null, valeur: null, texte: null, ...champs }) as Paragraphe;

describe("resumerDebat", () => {
  it("séance : sujet = titre de discussion qui précède la première intervention de fond", () => {
    const paragraphes = [
      p(5, { codeGrammaire: "TITRE_TEXTE_DISCUSSION", texte: "Parcours de soins des victimes", valeur: "(n[[o]] 3379)" }),
      p(9, { codeGrammaire: "PAROLE_GENERIQUE", texte: "La parole est à Mme Panot." }),
      p(12, { codeGrammaire: "PAROLE_GENERIQUE", texte: "<p>Monsieur le ministre,&nbsp;cet amendement…</p>" }),
      p(40, { codeGrammaire: "TITRE_TEXTE_DISCUSSION", texte: "Autre texte", valeur: "(n° 1200)" }),
    ];
    // Le 9 est une intervention en présidant : l'extrait part du 12.
    const resume = resumerDebat(paragraphes, [{ ordre: 9, presidence: true }, { ordre: 12, presidence: false }]);
    expect(resume).toEqual({
      sujet: "Parcours de soins des victimes",
      numeroTexte: "3379",
      extrait: "Monsieur le ministre, cet amendement…",
      premierOrdre: 12,
    });
  });

  it("projet de loi de finances : titre propre aux textes budgétaires", () => {
    const paragraphes = [
      p(5, { codeGrammaire: "APPEL_PLF_1_20", texte: "Projet de loi de finances pour 2027", valeur: "(n[[o]] 3210)" }),
      p(6, { codeGrammaire: "APPEL_PLF_1_30", texte: "Première partie (suite)" }),
      p(234, { codeGrammaire: "PAROLE_GENERIQUE", texte: "Il est un peu léger…" }),
    ];
    const resume = resumerDebat(paragraphes, [{ ordre: 234, presidence: false }]);
    expect(resume).toMatchObject({ sujet: "Projet de loi de finances pour 2027", numeroTexte: "3210" });
  });

  it("questions au Gouvernement : sujet = titre de la question", () => {
    const paragraphes = [
      p(5, { codeGrammaire: "TITRE_TEXTE_DISCUSSION", texte: "Questions au gouvernement" }),
      p(7, { codeGrammaire: "QG_1_1", texte: "Événements du 16 octobre" }),
      p(474, { codeGrammaire: "QG_1_1", texte: "Événements du 17 octobre" }),
      p(476, { codeGrammaire: "PAROLE_GENERIQUE", texte: "Monsieur le premier ministre…" }),
    ];
    const resume = resumerDebat(paragraphes, [{ ordre: 476, presidence: false }]);
    expect(resume.sujet).toBe("Questions au Gouvernement : Événements du 17 octobre");
    expect(resume.numeroTexte).toBeNull();
  });

  it("commission : la ligne « Présidence de… » n'est pas un sujet", () => {
    const paragraphes = [
      p(1, { codeStyle: "Info Italiques", texte: "Table ronde sur la guerre en Ukraine, quatre ans après" }),
      p(2, { codeStyle: "Info Italiques", texte: "Présidence de M. Jean-Noël Barrot, président." }),
      p(3, { codeGrammaire: "PAROLE_GENERIQUE", texte: "Mes chers collègues…" }),
    ];
    expect(resumerDebat(paragraphes, [{ ordre: 3, presidence: false }]).sujet).toBe(
      "Table ronde sur la guerre en Ukraine, quatre ans après"
    );
  });

  it("commission : sujet = didascalie en italiques, sans numérotation", () => {
    const paragraphes = [
      p(1, { codeStyle: "Info Italiques", texte: "<i>II. Examen de la proposition de loi (n° 3172) visant à…</i>" }),
      p(3, { codeGrammaire: "PAROLE_GENERIQUE", texte: "En 2016, la représentation nationale…" }),
    ];
    const resume = resumerDebat(paragraphes, [{ ordre: 3, presidence: false }]);
    expect(resume.sujet).toBe("Examen de la proposition de loi (n° 3172) visant à…");
    expect(resume.numeroTexte).toBe("3172");
  });
});

describe("outils", () => {
  it("numeroTexte reconnaît les graphies de l'Assemblée", () => {
    expect(numeroTexte("(n[[o]] 3379)")).toBe("3379");
    expect(numeroTexte("proposition de loi (n° 3172)")).toBe("3172");
    expect(numeroTexte("(n[[os]] 3210, 3291)")).toBe("3210");
    expect(numeroTexte("Questions au Gouvernement")).toBeNull();
  });

  it("extraire coupe au dernier mot entier", () => {
    expect(extraire("court")).toBe("court");
    expect(extraire("un deux trois quatre cinq", 15)).toBe("un deux trois…");
  });
});

describe("regrouperConjointes", () => {
  const debat = (uid: string, lieu: string, extrait: string, lien: string | null = null): DebatActeur => ({
    compteRenduUid: uid,
    date: "2026-09-30",
    type: "commission",
    lieu,
    sujet: "Audition de la ministre",
    interventions: 1,
    aPreside: false,
    extrait,
    lien: lien ?? `https://www.assemblee-nationale.fr/${uid}`,
    lienExterne: !lien,
    dossierUid: null,
    dossierTitre: null,
    dossierLegislature: null,
  });

  it("une audition publiée par chaque commission devient une seule ligne", () => {
    const lignes = regrouperConjointes([
      debat("A", "Commission des affaires étrangères", "Depuis le début…"),
      debat("B", "Commission de la défense", "Depuis le début…", "/17/dossier/D/commission/B#p-3"),
      debat("C", "Commission des affaires européennes", "Chers collègues…"),
    ]);
    expect(lignes).toHaveLength(2);
    expect(lignes[0].lieu).toBe("Commission des affaires étrangères · Commission de la défense");
    // Le lien vers le site prime sur le compte rendu officiel.
    expect(lignes[0]).toMatchObject({ lien: "/17/dossier/D/commission/B#p-3", lienExterne: false });
  });
});
