import { getParlementDb } from "@/lib/mongodb";
import { cacheTricoteuses } from "@/data/cacheTricoteuses";
import { COLLECTION_PRISES_DE_PAROLE } from "@/data/getDernieresPrisesDeParole";
import type { Flux } from "@/lib/rss";
import {
  elementsAmendementsDepute,
  elementsInterventions,
  elementsQuestions,
  type AmendementsGroupe,
  type InterventionVideo,
  type QuestionBrute,
} from "./elementsDepute";

const GROUPES_AMENDEMENTS = 30;
const QUESTIONS = 20;
const LEGISLATURE = 17;

/**
 * Amendements dont le député est l'auteur (pas les cosignatures), groupés par
 * texte et par jour de dépôt : un député en dépose parfois des centaines sur
 * un même texte, un élément par amendement noierait le flux.
 *
 * Requête accélérée par l'index de scripts/creer_index_flux_rss.mjs ; sans lui
 * elle parcourt la collection (quelques centaines de ms, mise en cache 1 h).
 */
async function lireAmendements(acteurUid: string): Promise<AmendementsGroupe[]> {
  const db = await getParlementDb();
  const groupes = await db
    .collection("amendements")
    .aggregate<{
      _id: { texte: string; jour: string };
      n: number;
      articles: (string | null)[];
      dossier: { uid?: string; legislature?: string; titreDossier?: { titre?: string } }[];
    }>([
      { $match: { "signataires.auteur.acteurRef": acteurUid, "cycleDeVie.dateDepot": { $type: "string" } } },
      {
        $group: {
          _id: { texte: "$texteLegislatifRef", jour: "$cycleDeVie.dateDepot" },
          n: { $sum: 1 },
          articles: { $addToSet: "$pointeurFragmentTexte.division.articleDesignationCourte" },
        },
      },
      { $sort: { "_id.jour": -1, "_id.texte": 1 } },
      { $limit: GROUPES_AMENDEMENTS },
      {
        $lookup: {
          from: "documents",
          localField: "_id.texte",
          foreignField: "uid",
          as: "texte",
          pipeline: [{ $project: { _id: 0, dossierRef: 1 } }],
        },
      },
      {
        $lookup: {
          from: "dossiers",
          localField: "texte.dossierRef",
          foreignField: "uid",
          as: "dossier",
          pipeline: [{ $project: { _id: 0, uid: 1, legislature: 1, "titreDossier.titre": 1 } }],
        },
      },
    ])
    .toArray();

  return groupes.map((g) => {
    const dossier = g.dossier[0];
    return {
      jour: g._id.jour.slice(0, 10),
      texteUid: g._id.texte,
      nombre: g.n,
      articles: g.articles.filter((a): a is string => typeof a === "string"),
      dossierUid: dossier?.uid ?? null,
      dossierTitre: dossier?.titreDossier?.titre?.trim() ?? null,
      legislature: dossier?.legislature ? Number(dossier.legislature) : null,
    };
  });
}

async function lireQuestions(acteurUid: string): Promise<QuestionBrute[]> {
  const db = await getParlementDb();
  return db
    .collection<QuestionBrute>("questions")
    .find(
      { "auteur.identite.acteurRef": acteurUid },
      {
        projection: {
          _id: 0,
          uid: 1,
          type: 1,
          indexationAN: 1,
          "minInt.developpe": 1,
          textesQuestion: 1,
          textesReponse: 1,
        },
      },
    )
    .sort({ "textesQuestion.texteQuestion.infoJO.dateJO": -1 })
    .limit(QUESTIONS)
    .toArray();
}

/**
 * Dernières interventions filmées, précalculées chaque nuit. Pas de calcul à
 * la demande ici (une quinzaine d'appels externes) : un député absent du
 * précalcul n'a simplement pas d'interventions dans le flux ce jour-là.
 */
async function lireInterventions(acteurUid: string): Promise<InterventionVideo[]> {
  const db = await getParlementDb();
  const entree = await db
    .collection<{ _id: string; prises?: InterventionVideo[] }>(COLLECTION_PRISES_DE_PAROLE)
    .findOne({ _id: acteurUid }, { projection: { prises: 1 } });
  return entree?.prises ?? [];
}

/**
 * getActeurBySlug renvoie null aussi quand l'API est en panne : le flux
 * répondrait 404, mis en cache une heure. Ici, une panne lève une erreur
 * (réponse 500, l'ancienne version reste servie) ; seul un slug inconnu
 * donne null.
 */
async function lireActeur(slug: string): Promise<{ uid: string; prenom: string; nom: string } | null> {
  const rep = await fetch(
    `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/acteurs/?slug=${encodeURIComponent(slug)}`,
    cacheTricoteuses("contenu"),
  );
  if (!rep.ok) throw new Error(`API acteurs : HTTP ${rep.status}`);
  const { data } = await rep.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export async function getFluxDepute(slug: string): Promise<Flux | null> {
  const acteur = await lireActeur(slug);
  if (!acteur) return null;

  const [amendements, questions, interventions] = await Promise.all([
    lireAmendements(acteur.uid),
    lireQuestions(acteur.uid),
    lireInterventions(acteur.uid),
  ]);

  const nom = `${acteur.prenom} ${acteur.nom}`;
  const lien = `/depute/${slug}`;
  return {
    titre: `${nom} — NosDéputés.fr`,
    lien,
    chemin: `${lien}/rss.xml`,
    description: `Activité parlementaire de ${nom} : amendements déposés, questions au Gouvernement et interventions en séance.`,
    elements: [
      ...elementsAmendementsDepute(amendements, { slug, acteurUid: acteur.uid }),
      ...elementsQuestions(questions, { slug }),
      ...elementsInterventions(interventions, { slug, legislature: LEGISLATURE }),
    ],
  };
}
