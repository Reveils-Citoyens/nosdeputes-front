import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";
import { getVideoReunion, type Video } from "@/data/getVideoReunion";

/**
 * Détail d'une journée d'activité d'un député : chaque ligne qui a produit un
 * chiffre, et chaque ligne qui a été écartée, avec la raison.
 *
 * C'est la page qu'un député conteste. Elle est donc lue depuis
 * `statistiques_quotidiennes` — la collection dont sont dérivés les agrégats
 * affichés ailleurs — pour qu'aucune requalification ne soit possible entre le
 * chiffre et sa justification.
 *
 * Les interventions écartées ne sont pas stockées : on les reconstruit ici en
 * relisant le compte rendu, avec la règle qui les a exclues. Montrer seulement
 * ce qui compte serait une vitrine, pas une justification.
 */

/** Seuil de longueur en deçà duquel une prise de parole n'établit pas une présence. */
const SEUIL_CARACTERES = 50;

const ROLES_PRESIDENCE = ["president", "président", "presidente", "présidente"];

export type MotifExclusion = "trop_courte" | "presidence" | "procedure";

export type Intervention = {
  /** Rang dans le débat, pour restituer l'ordre réel des prises de parole. */
  ordre: number;
  texte: string;
  longueur: number;
  retenue: boolean;
  motif: MotifExclusion | null;
  /** Position en secondes dans la vidéo de la séance, si elle existe. */
  seconde: number | null;
};

export type { Video };

export type Seance = {
  compteRenduUid: string;
  /** Horodatage de la séance : matin, après-midi ou soir. */
  debut: string;
  interventions: Intervention[];
  video: Video | null;
};

export type Reunion = {
  reunionUid: string;
  debut: string;
  organe: string | null;
  etat: string;
  objet: string[];
  compteRenduRef: string | null;
};

export type DetailJournee = {
  date: string;
  seances: Seance[];
  reunions: Reunion[];
  amendements: string[];
  documents: string[];
  questions: string[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */

const texteDuParagraphe = (noeud: any): string => {
  const texte = noeud?.texte;
  const valeur = typeof texte === "object" ? texte?._ : texte;
  return typeof valeur === "string" ? valeur : "";
};

const secondeDuParagraphe = (noeud: any): number | null => {
  const brut = typeof noeud?.texte === "object" ? noeud.texte?.stime : null;
  const seconde = Number(brut);
  return Number.isFinite(seconde) ? seconde : null;
};

/** Parcourt le contenu d'un compte rendu, dont l'arborescence est irrégulière. */
function* iterParagraphes(noeud: any): Generator<any> {
  if (Array.isArray(noeud)) {
    for (const valeur of noeud) yield* iterParagraphes(valeur);
  } else if (noeud && typeof noeud === "object") {
    if (noeud.id_acteur && "texte" in noeud) yield noeud;
    for (const valeur of Object.values(noeud)) yield* iterParagraphes(valeur);
  }
}

function motifExclusion(paragraphe: any, texte: string): MotifExclusion | null {
  const role = String(paragraphe?.roledebat ?? "").toLowerCase();
  const orateur = paragraphe?.orateurs?.orateur;
  const nom = String((Array.isArray(orateur) ? orateur[0] : orateur)?.nom ?? "");
  // `roledebat` n'est renseigné que sur les paragraphes procéduraux ; sur une
  // prise de parole de fond, seul le libellé de l'orateur porte la fonction.
  if (ROLES_PRESIDENCE.includes(role) || /présidente?\b/i.test(nom)) {
    return "presidence";
  }
  if (paragraphe?.code_grammaire !== "PAROLE_GENERIQUE") return "procedure";
  if (texte.length <= SEUIL_CARACTERES) return "trop_courte";
  return null;
}

export const getDetailJournee = cache(
  async (
    acteurUid: string,
    date: string,
    legislature = 17
  ): Promise<DetailJournee | null> => {
    if (!acteurUid || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;

    try {
      const db = await getParlementDb();
      const lignes = await db
        .collection("statistiques_quotidiennes")
        .find({ legislature, acteurUid, date }, { projection: { _id: 0 } })
        .toArray();

      if (lignes.length === 0) return null;

      const parType = (type: string) => lignes.find((l) => l.type === type);
      const uids = (type: string): string[] =>
        (parType(type)?.details ?? []).map((d: any) => d.uid).filter(Boolean);

      return {
        date,
        seances: await chargerSeances(db, acteurUid, parType("presenceSeancePublique")),
        reunions: await chargerReunions(db, parType("presenceCommission")),
        amendements: uids("amendementDepose"),
        documents: uids("documentPublie"),
        questions: [...uids("questionEcrite"), ...uids("questionOrale")],
      };
    } catch (error) {
      console.error("Error fetching detail journée:", error);
      return null;
    }
  }
);

async function chargerSeances(
  db: any,
  acteurUid: string,
  ligne: any
): Promise<Seance[]> {
  const details = ligne?.details ?? [];
  if (details.length === 0) return [];

  const comptesRendus = await db
    .collection("comptes_rendus")
    .find(
      { uid: { $in: details.map((d: any) => d.compteRenduUid) } },
      { projection: { _id: 0, uid: 1, seanceRef: 1, contenu: 1 } }
    )
    .toArray();

  const seances = await Promise.all(
    details.map(async (detail: any) => {
      const compteRendu = comptesRendus.find(
        (cr: any) => cr.uid === detail.compteRenduUid
      );

      const interventions: Intervention[] = [];
      for (const paragraphe of iterParagraphes(compteRendu?.contenu)) {
        if (paragraphe.id_acteur !== acteurUid) continue;
        const texte = texteDuParagraphe(paragraphe);
        const motif = motifExclusion(paragraphe, texte);
        interventions.push({
          ordre: Number(paragraphe.ordre_absolu_seance) || 0,
          texte,
          longueur: texte.length,
          retenue: motif === null,
          motif,
          seconde: secondeDuParagraphe(paragraphe),
        });
      }
      interventions.sort((a, b) => a.ordre - b.ordre);

      return {
        compteRenduUid: detail.compteRenduUid,
        debut: detail.seance,
        interventions,
        video: await getVideoReunion(compteRendu?.seanceRef ?? null),
      };
    })
  );

  return seances.sort((a, b) => a.debut.localeCompare(b.debut));
}

async function chargerReunions(db: any, ligne: any): Promise<Reunion[]> {
  const details = ligne?.details ?? [];
  if (details.length === 0) return [];

  const organes = await db
    .collection("organes")
    .find(
      { uid: { $in: details.map((d: any) => d.organeRef).filter(Boolean) } },
      { projection: { _id: 0, uid: 1, libelle: 1 } }
    )
    .toArray();

  return details
    .map((detail: any) => ({
      reunionUid: detail.reunionUid,
      debut: detail.debut,
      organe:
        organes.find((o: any) => o.uid === detail.organeRef)?.libelle ?? null,
      etat: detail.etat ?? "absent",
      objet: Array.isArray(detail.objet)
        ? detail.objet
        : detail.objet
          ? [detail.objet]
          : [],
      compteRenduRef: detail.compteRenduRef ?? null,
    }))
    .sort((a: Reunion, b: Reunion) => a.debut.localeCompare(b.debut));
}
