import type { Paragraphe } from "@prisma/client";
import { liste, valeur } from "./conversionAN";
import { ResolveurOrateurs } from "./resolutionOrateurs";

/**
 * Paragraphes d'un compte rendu brut (collection `comptes_rendus`) au format
 * que renvoyait l'API Tricoteuses pour `/interventions/?debatRefUid=…` : titres,
 * prises de parole, interruptions, dans l'ordre de la séance.
 *
 * - Séance publique : l'orateur est identifié par l'Assemblée (`id_acteur`).
 * - Commission : il ne l'est pas ; il est rattaché par son nom
 *   (resolutionOrateurs.ts, même règle que les statistiques).
 *
 * L'identifiant d'un paragraphe (`uid`) est le nôtre : « {compte rendu}-{ordre} ».
 * L'API utilisait une empreinte interne ; il ne sert qu'à l'affichage (clé,
 * ancre du sommaire).
 */

type Brut = Record<string, unknown>;

const objet = (brut: unknown): Brut =>
  brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Brut) : {};

const entier = (brut: unknown): number | null => {
  const n = Number.parseInt(valeur(brut) ?? "", 10);
  return Number.isFinite(n) ? n : null;
};

/** Le texte est soit une chaîne, soit `{"_": "…", "stime": "…"}`. */
function texteEtHorodatage(brut: unknown): { texte: string | null; stime: string | null } {
  if (typeof brut === "string") return { texte: brut, stime: null };
  const o = objet(brut);
  return { texte: typeof o._ === "string" ? o._ : null, stime: valeur(o.stime) };
}

/** Nœuds porteurs de texte ou de code, dans l'ordre du document. */
function* noeuds(noeud: unknown): Generator<Brut> {
  if (Array.isArray(noeud)) {
    for (const n of noeud) yield* noeuds(n);
  } else if (noeud && typeof noeud === "object") {
    const o = noeud as Brut;
    if ("texte" in o || "code_grammaire" in o) yield o;
    for (const [cle, valeurFille] of Object.entries(o)) {
      if (cle !== "texte" && cle !== "orateurs") yield* noeuds(valeurFille);
    }
  }
}

export function interventionsDepuisAN(
  cr: Brut & { uid: string },
  dateSeanceISO: string | null,
  resolveur: ResolveurOrateurs | null
): Paragraphe[] {
  const resultat: Paragraphe[] = [];

  for (const n of noeuds(cr.contenu)) {
    const { texte, stime } = texteEtHorodatage(n.texte);
    const premierOrateur = objet(liste(objet(n.orateurs).orateur as unknown[])[0]);
    const orateur = valeur(premierOrateur.nom);
    const codeGrammaire = valeur(n.code_grammaire);
    const ordre = entier(n.ordre_absolu_seance);

    // Séance : identifiant fourni, sur le paragraphe ou à défaut sur l'orateur
    // (interruptions ; « 0 » désigne un groupe : « Plusieurs députés… »). Commission : rattachement par le nom, pour les seules
    // prises de parole (pas les titres ni les didascalies).
    const idOrateur = valeur(premierOrateur.id);
    // « PA0 » / « 0 » : intervention collective, sans orateur identifiable.
    const idParagraphe = valeur(n.id_acteur);
    let acteurRefUid =
      (idParagraphe && /^PA[1-9]\d*$/.test(idParagraphe) ? idParagraphe : null) ??
      (idOrateur && /^[1-9]\d*$/.test(idOrateur) ? `PA${idOrateur}` : null);
    if (!acteurRefUid && resolveur && orateur && codeGrammaire === "PAROLE_GENERIQUE") {
      acteurRefUid = resolveur.resoudre(orateur);
    }

    resultat.push({
      // Unique après dédoublonnage par numéro d'ordre (plus bas).
      uid: ordre !== null ? `${cr.uid}-${ordre}` : `${cr.uid}-x${resultat.length}`,
      dataset: 17,
      chambre: "AN",
      dateSeance: dateSeanceISO,
      codeGrammaire,
      codeStyle: valeur(n.code_style),
      codeParole: valeur(n.code_parole),
      acteurRefUid,
      mandatRefUid: valeur(n.id_mandat),
      idNominationOe: valeur(n.id_nomination_oe),
      idNominationOp: valeur(n.id_nomination_op),
      idPreparation: valeur(n.id_preparation),
      idSyceron: valeur(n.id_syceron),
      nivPoint: valeur(n.nivpoint),
      orateur,
      ordinalPrise: entier(n.ordinal_prise),
      ordreAbsoluSeance: ordre,
      roleDebat: valeur(n.roledebat),
      estPresident: false,
      sommaire: valeur(n.sommaire),
      valeur: valeur(n.valeur),
      valeurPtsOdj: valeur(n.valeur_ptsodj),
      texte,
      stime,
      debatRefUid: cr.uid,
      reunionRefUid: valeur(cr.seanceRef),
    } as unknown as Paragraphe);
  }

  // Un bloc de discussion d'amendements porte le numéro d'ordre de son premier
  // paragraphe : comme l'API, on ne garde que le paragraphe, qui vient après
  // son bloc dans le document.
  const dernierParOrdre = new Map<number, Paragraphe>();
  const sansOrdre: Paragraphe[] = [];
  for (const p of resultat) {
    if (p.ordreAbsoluSeance === null) sansOrdre.push(p);
    else dernierParOrdre.set(p.ordreAbsoluSeance, p);
  }
  return [...dernierParOrdre.values(), ...sansOrdre].sort(
    (a, b) => (a.ordreAbsoluSeance ?? 0) - (b.ordreAbsoluSeance ?? 0)
  );
}
