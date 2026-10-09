import { describe, expect, it } from "vitest";
import { elementsAmendementsDepute, elementsInterventions, elementsQuestions, type QuestionBrute } from "./elementsDepute";

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
      lien: "/depute/francois-ruffin/qag",
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
  it("lie au débat du dossier, sinon à la fiche, et garde l'heure de la séance", () => {
    const [avec, sans] = elementsInterventions(
      [
        {
          dateSeance: "2026-02-12T21:30:00.000Z",
          extrait: "Le contrôle de l’information",
          seconde: 120,
          compteRenduUid: "CR1",
          dossierUid: "D1",
          dossierTitre: "Médias",
        },
        { dateSeance: "2026-01-13T15:00:00.000Z", extrait: "", seconde: 5, compteRenduUid: "CR2", dossierUid: null, dossierTitre: null },
      ],
      { slug: "s", legislature: 17 },
    );
    expect(avec).toMatchObject({
      guid: "intervention-CR1-120",
      titre: "Intervention en séance : Médias",
      description: "« Le contrôle de l’information »",
      lien: "/17/dossier/D1/debat/CR1",
    });
    expect(avec.date.toISOString()).toBe("2026-02-12T21:30:00.000Z");
    expect(sans).toMatchObject({ titre: "Intervention en séance", lien: "/depute/s", description: undefined });
  });
});
