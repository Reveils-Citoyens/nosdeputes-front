import type { Question } from "@prisma/client";
import { dateISO, liste, valeur } from "./conversionAN";

/**
 * Question brute de l'Assemblée (collection `questions`, importée chaque nuit
 * par ND.py) vers la forme que renvoyait l'API Tricoteuses (`/questions`).
 *
 * Règles établies en comparant les deux sources (cf. conversionQuestionAN.test.ts) :
 * - date de dépôt : première publication de la question au JO ; à défaut
 *   (questions au Gouvernement, sans texte de question), celle de
 *   l'attribution au ministre. L'API la décale d'un jour en arrière ; on garde
 *   le jour publié, comme ailleurs sur le site.
 * - texte et erratum : ceux de la dernière publication (une question ou une
 *   réponse republiée pour erratum apparaît deux fois).
 * - titre : l'analyse de l'indexation.
 */

type Brut = Record<string, unknown>;

const objet = (brut: unknown): Brut =>
  brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Brut) : {};

/** Publications successives d'un texte (question ou réponse). */
const publications = (conteneur: unknown, cle: string): Brut[] =>
  liste(objet(conteneur)[cle] as unknown[]).map(objet);

export function questionDepuisAN(brut: Brut & { uid: string }): Question {
  const identifiant = objet(brut.identifiant);
  const indexation = objet(brut.indexationAN);
  const auteur = objet(brut.auteur);
  const cloture = objet(brut.cloture);
  const questions = publications(brut.textesQuestion, "texteQuestion");
  const reponses = publications(brut.textesReponse, "texteReponse");
  const derniereQuestion = questions.at(-1) ?? {};
  const derniereReponse = reponses.at(-1) ?? {};
  const attribution = objet(liste(objet(brut.minAttribs).minAttrib as unknown[])[0]);
  const legislature = Number.parseInt(valeur(identifiant.legislature) ?? "", 10);
  const leg = Number.isFinite(legislature) ? legislature : null;
  const analyse = liste(objet(indexation.analyses).analyse as unknown[])
    .map((a) => valeur(a))
    .filter((a): a is string => !!a)
    .join(" ; ");

  const question = {
    uid: brut.uid,
    dataset: leg,
    chambre: "AN",
    numero: valeur(identifiant.numero),
    regime: valeur(identifiant.regime),
    rubrique: valeur(indexation.rubrique),
    type: valeur(brut.type),
    acteurRefUid: valeur(objet(auteur.identite).acteurRef),
    mandatRefUid: valeur(objet(auteur.identite).mandatRef),
    groupeRefUid: valeur(objet(auteur.groupe).organeRef),
    minIntRefUid: valeur(objet(brut.minInt).organeRef),
    codeCloture: valeur(cloture.codeCloture),
    libelleCloture: valeur(cloture.libelleCloture),
    dateDepot:
      dateISO(objet(questions[0]?.infoJO).dateJO) ?? dateISO(objet(attribution.infoJO).dateJO),
    dateCloture: dateISO(cloture.dateCloture),
    dateDepotSignal: dateISO(objet(brut.signalement).dateDepotSignal),
    texteQuestion: valeur(derniereQuestion.texte),
    texteReponse: valeur(derniereReponse.texte),
    erratumQuestion: valeur(derniereQuestion.erratum),
    erratumReponse: valeur(derniereReponse.erratum),
    titre: analyse || null,
    legislature: leg,
  };
  return question as unknown as Question;
}
