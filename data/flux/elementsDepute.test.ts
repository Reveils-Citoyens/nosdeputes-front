import { describe, expect, it } from "vitest";
import { elementsAmendementsDepute, elementsInterventions, elementsQuestions, type QuestionBrute } from "./elementsDepute";
import type { DebatActeur } from "@/data/mongo/interventionsActeurAN";

const question = (extra: Partial<QuestionBrute>): QuestionBrute => ({
  uid: "QANR5L17QE17785",
  type: "QE",
  indexationAN: { rubrique: "entreprises", analyses: { analyse: "Facturation électronique" } },
  minInt: { developpe: "Ministère de l’économie" },
  textesQuestion: { texteQuestion: { infoJO: { dateJO: "2026-08-25" }, texte: "<p>M. Ruffin interroge&#x00A0;M. le ministre</p>" } },
  textesReponse: null,
  ...extra,
});

describe("elementsQuestions", () => {
  it("décrit la question, son ministère et un extrait sans HTML", () => {
    const [q] = elementsQuestions([question({})], { slug: "francois-ruffin" });
    expect(q).toMatchObject({
      guid: "QANR5L17QE17785",
      titre: "Question écrite : Facturation électronique",
      lien: "/depute/francois-ruffin/questions-ecrites",
    });
    expect(q.description).toBe("Adressée au ministère de l’économie. M. Ruffin interroge M. le ministre");
  });

  it("ajoute la réponse d'une question écrite comme élément distinct, à sa date", () => {
    const elements = elementsQuestions(
      [question({ textesReponse: { texteReponse: { infoJO: { dateJO: "2026-09-22" }, texte: "La circulaire…" } } })],
      { slug: "s" },
    );
    expect(elements.map((e) => e.guid)).toEqual(["QANR5L17QE17785", "QANR5L17QE17785-reponse"]);
    expect(elements[1].titre).toBe("Réponse du Gouvernement : Facturation électronique");
    expect(elements[1].date.toISOString()).toBe("2026-09-22T10:00:00.000Z");
  });

  it("pas d'élément de réponse pour une question au Gouvernement (même séance)", () => {
    const elements = elementsQuestions(
      [question({ type: "QG", textesReponse: { texteReponse: { infoJO: { dateJO: "2026-01-14" } } } })],
      { slug: "s" },
    );
    expect(elements).toHaveLength(1);
    // Question orale : lien vers l'onglet des questions orales.
    expect(elements[0].lien).toBe("/depute/s/questions-orales");
    expect(elements[0].titre).toBe("Question au Gouvernement : Facturation électronique");
  });

  it("lit une question renouvelée (textes multiples) et ignore une question sans date", () => {
    const renouvelee = question({
      textesQuestion: { texteQuestion: [{ infoJO: { dateJO: "2026-03-03" } }, { infoJO: { dateJO: "2026-06-03" } }] },
    });
    const sansDate = question({ uid: "QX", textesQuestion: null });
    const elements = elementsQuestions([renouvelee, sansDate], { slug: "s" });
    expect(elements).toHaveLength(1);
    expect(elements[0].date.toISOString().slice(0, 10)).toBe("2026-03-03");
  });
});

describe("elementsAmendementsDepute", () => {
  it("regroupe par texte et par jour, avec repli vers la fiche sans dossier", () => {
    const [avecDossier, sansDossier] = elementsAmendementsDepute(
      [
        {
          jour: "2026-02-20",
          texteUid: "PRJLANR5L17BTC2250",
          nombre: 4,
          articles: ["APRÈS ART. 19 BIS", "APRÈS ART. 19", "APRÈS ART. 19"],
          dossierUid: "DLR5L17N52985",
          dossierTitre: "Projet de loi relatif à la lutte contre les fraudes",
          legislature: 17,
        },
        { jour: "2026-01-06", texteUid: "T2", nombre: 1, articles: [], dossierUid: null, dossierTitre: null, legislature: null },
      ],
      { slug: "francois-ruffin", acteurUid: "PA722142" },
    );
    expect(avecDossier).toMatchObject({
      guid: "amendements-PA722142-PRJLANR5L17BTC2250-2026-02-20",
      titre: "4 amendements déposés sur « Projet de loi relatif à la lutte contre les fraudes »",
      description: "Déposés le 20 février 2026. Articles visés : APRÈS ART. 19 BIS, APRÈS ART. 19.",
      lien: "/17/dossier/DLR5L17N52985/amendement",
    });
    expect(sansDossier).toMatchObject({
      titre: "1 amendement déposé",
      description: "Déposé le 6 janvier 2026.",
      lien: "/depute/francois-ruffin/amendements",
    });
  });
});

describe("elementsInterventions", () => {
  const debat = (extra: Partial<DebatActeur>): DebatActeur => ({
    compteRenduUid: "CRSANR5L17S2027O1N069",
    date: "2026-11-18",
    type: "seance",
    lieu: "Séance publique",
    sujet: "Rapports locatifs",
    interventions: 1,
    aPreside: false,
    extrait: "Que prévoit l’article 1er bis A ?",
    lien: "/17/dossier/D1/debat/CRSANR5L17S2027O1N069#p-675",
    lienExterne: false,
    dossierUid: "D1",
    dossierTitre: "Rapports locatifs",
    dossierLegislature: "17",
    ...extra,
  });

  it("mène à l'intervention elle-même, par l'ancre du compte rendu", () => {
    const [e] = elementsInterventions([debat({})], { slug: "s" });
    expect(e).toMatchObject({
      guid: "intervention-CRSANR5L17S2027O1N069",
      titre: "Intervention en séance : Rapports locatifs",
      description: "« Que prévoit l’article 1er bis A ? »",
      lien: "/17/dossier/D1/debat/CRSANR5L17S2027O1N069#p-675",
    });
    expect(e.date.toISOString()).toBe("2026-11-18T10:00:00.000Z");
  });

  it("compte les interventions, nomme la commission, garde le lien externe", () => {
    const [e] = elementsInterventions(
      [
        debat({
          type: "commission",
          lieu: "Commission des finances",
          interventions: 3,
          lien: "https://www.assemblee-nationale.fr/dyn/opendata/CRC.html",
          lienExterne: true,
        }),
      ],
      { slug: "s" },
    );
    expect(e.titre).toBe("3 interventions en commission : Rapports locatifs");
    expect(e.description).toBe("Commission des finances. « Que prévoit l’article 1er bis A ? »");
    expect(e.lien).toBe("https://www.assemblee-nationale.fr/dyn/opendata/CRC.html");
  });

  it("signale une présidence sans intervention de fond", () => {
    const [e] = elementsInterventions([debat({ interventions: 0, aPreside: true, extrait: null, sujet: null })], {
      slug: "s",
    });
    expect(e).toMatchObject({ titre: "Présidence de la séance", description: undefined });
  });
});
