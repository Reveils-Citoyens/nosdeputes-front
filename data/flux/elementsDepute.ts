import { htmlToPreview } from "@/lib/htmlPreview";
import { dateDuJour, formatJour, type ElementFlux } from "@/lib/rss";

/**
 * Activité d'un député convertie en éléments de flux. Fonctions pures.
 *
 * Pas de votes individuels : un député en émet des centaines par mois, le
 * flux en serait illisible. Ils restent consultables sur la fiche.
 */

export type AmendementsGroupe = {
  /** Jour de dépôt, « 2026-03-31 ». */
  jour: string;
  texteUid: string;
  nombre: number;
  /** Ex. « ART. 3 », « APRÈS ART. 19 BIS ». */
  articles: string[];
  dossierUid: string | null;
  dossierTitre: string | null;
  legislature: number | null;
};

export function elementsAmendementsDepute(
  groupes: AmendementsGroupe[],
  contexte: { slug: string; acteurUid: string },
): ElementFlux[] {
  return groupes.flatMap((g) => {
    const date = dateDuJour(g.jour);
    if (!date || g.nombre === 0) return [];
    const pluriel = g.nombre > 1 ? "s" : "";
    const sujet = g.dossierTitre ? ` sur « ${g.dossierTitre} »` : "";
    const articles = Array.from(new Set(g.articles.filter(Boolean)));
    const lien =
      g.dossierUid && g.legislature
        ? `/${g.legislature}/dossier/${g.dossierUid}/amendement`
        : `/depute/${contexte.slug}/amendements`;
    return [
      {
        guid: `amendements-${contexte.acteurUid}-${g.texteUid}-${g.jour}`,
        titre: `${g.nombre} amendement${pluriel} déposé${pluriel}${sujet}`,
        description: [
          `Déposé${pluriel} le ${formatJour(date)}.`,
          articles.length > 0
            ? `Articles visés : ${articles.slice(0, 6).join(", ")}${articles.length > 6 ? "…" : ""}.`
            : null,
        ]
          .filter(Boolean)
          .join(" "),
        lien,
        date,
      },
    ];
  });
}

const TYPES_QUESTION: Record<string, string> = {
  QE: "Question écrite",
  QG: "Question au Gouvernement",
  QOSD: "Question orale sans débat",
};

type TexteJo = { infoJO?: { dateJO?: string | null } | null; texte?: string | null };

/** Forme brute d'une question en base (collection `questions`). */
export type QuestionBrute = {
  uid: string;
  type?: string | null;
  indexationAN?: {
    rubrique?: string | null;
    analyses?: { analyse?: string | string[] | null } | null;
  } | null;
  minInt?: { developpe?: string | null } | null;
  textesQuestion?: { texteQuestion?: TexteJo | TexteJo[] | null } | null;
  textesReponse?: { texteReponse?: TexteJo | TexteJo[] | null } | null;
};

/** Premier texte publié (une question renouvelée en a plusieurs). */
function premier(t: TexteJo | TexteJo[] | null | undefined): TexteJo | null {
  if (!t) return null;
  return Array.isArray(t) ? (t[0] ?? null) : t;
}

function sujetQuestion(q: QuestionBrute): string {
  const analyse = q.indexationAN?.analyses?.analyse;
  const texte = Array.isArray(analyse) ? analyse[0] : analyse;
  return (texte || q.indexationAN?.rubrique || "sans titre").trim();
}

export function elementsQuestions(questions: QuestionBrute[], contexte: { slug: string }): ElementFlux[] {
  const lien = `/depute/${contexte.slug}/qag`;
  return questions.flatMap((q) => {
    const question = premier(q.textesQuestion?.texteQuestion);
    const date = dateDuJour(question?.infoJO?.dateJO);
    if (!date) return [];
    const type = TYPES_QUESTION[q.type ?? ""] ?? "Question";
    const sujet = sujetQuestion(q);
    const ministere = q.minInt?.developpe?.trim();
    const elements: ElementFlux[] = [
      {
        guid: q.uid,
        titre: `${type} : ${sujet}`,
        description: [
          ministere ? `Adressée au ${ministere.replace(/^Ministère/, "ministère")}.` : null,
          question?.texte ? htmlToPreview(question.texte, 400) : null,
        ]
          .filter(Boolean)
          .join(" "),
        lien,
        date,
      },
    ];

    // Une question écrite reçoit sa réponse des semaines plus tard : c'est
    // une nouveauté en soi. Les questions orales sont traitées en séance, le
    // jour même.
    const reponse = premier(q.textesReponse?.texteReponse);
    const dateReponse = q.type === "QE" ? dateDuJour(reponse?.infoJO?.dateJO) : null;
    if (dateReponse) {
      elements.push({
        guid: `${q.uid}-reponse`,
        titre: `Réponse du Gouvernement : ${sujet}`,
        description: [
          `Réponse publiée au Journal officiel le ${formatJour(dateReponse)}.`,
          reponse?.texte ? htmlToPreview(reponse.texte, 400) : null,
        ]
          .filter(Boolean)
          .join(" "),
        lien,
        date: dateReponse,
      });
    }
    return elements;
  });
}

export type InterventionVideo = {
  dateSeance: string;
  extrait: string;
  seconde: number;
  compteRenduUid: string;
  dossierUid: string | null;
  dossierTitre: string | null;
};

export function elementsInterventions(
  interventions: InterventionVideo[],
  contexte: { slug: string; legislature: number },
): ElementFlux[] {
  return interventions.flatMap((i) => {
    const date = new Date(i.dateSeance);
    if (Number.isNaN(date.getTime())) return [];
    return [
      {
        guid: `intervention-${i.compteRenduUid}-${i.seconde}`,
        titre: `Intervention en séance${i.dossierTitre ? ` : ${i.dossierTitre}` : ""}`,
        description: i.extrait ? `« ${htmlToPreview(i.extrait, 400)} »` : undefined,
        lien: i.dossierUid
          ? `/${contexte.legislature}/dossier/${i.dossierUid}/debat/${i.compteRenduUid}`
          : `/depute/${contexte.slug}`,
        date,
      },
    ];
  });
}
