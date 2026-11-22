import { liste, valeur } from "./conversionAN";

/**
 * Amendements bruts de l'Assemblée (collection `amendements`, importée chaque
 * nuit par ND.py) au format que la liseuse recevait de l'API Tricoteuses
 * (mode « compact » de /api/liseuse/amendements).
 *
 * Règles établies en comparant les deux sources sur 20 177 amendements de cinq
 * textes, PLF 2027 compris ; elles sont fixées par conversionAmendementAN.test.ts.
 */

type Brut = Record<string, unknown>;

const objet = (brut: unknown): Brut =>
  brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Brut) : {};

export type AmendementLiseuse = {
  uid: string;
  numeroLong: string | null;
  sortAmendement: string | null;
  typeAuteur: string | null;
  identifiantDivision: string | null;
  divisionArticleAdditionnel: string | null;
  acteurRefUid: string | null;
  nombreCoSignataires: number;
  dateDepot: string | null;
  dateSort: string | null;
  scrutinRefUid: string | null;
  idDiscussionIdentique: number | null;
};

/**
 * Identifiant de la division visée, celui du sommaire de la liseuse :
 * « Article 12 octies » → article-12-octies, « ÉTAT B » → etat-b,
 * « A. - Crédits des missions » → a---credits-des-missions.
 */
export function identifiantDivision(titre: string | null): string | null {
  if (!titre) return null;
  const texte = titre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/^article (premier|unique|1er)$/.test(texte)) return "article-1";
  if (texte === "article liminaire") return "article-0";
  return texte.replace(/[^a-z0-9 -]/g, "").replace(/ /g, "-");
}

/** Date avec fuseau → ISO UTC ; date seule → minuit UTC, comme l'API. */
function dateISO(brut: unknown, seulementJour = false): string | null {
  const texte = valeur(brut);
  if (!texte) return null;
  if (seulementJour) return /^\d{4}-\d{2}-\d{2}/.test(texte) ? `${texte.slice(0, 10)}T00:00:00.000Z` : null;
  const date = new Date(texte);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function amendementLiseuseDepuisAN(brut: Brut & { uid: string }): Omit<AmendementLiseuse, "scrutinRefUid"> {
  const division = objet(objet(brut.pointeurFragmentTexte).division);
  const signataires = objet(brut.signataires);
  const auteur = objet(signataires.auteur);
  const cycle = objet(brut.cycleDeVie);
  const idDiscussion = valeur(objet(brut.discussionIdentique).idDiscussion);
  return {
    uid: brut.uid,
    numeroLong: valeur(objet(brut.identification).numeroLong),
    // Sans sort (amendement non encore examiné, irrecevable, retiré…), l'état
    // de traitement en tient lieu : « Irrecevable 40 », « En traitement »…
    sortAmendement: valeur(cycle.sort) ?? valeur(objet(objet(cycle.etatDesTraitements).etat).libelle),
    typeAuteur: valeur(auteur.typeAuteur),
    identifiantDivision: identifiantDivision(valeur(division.titre)),
    divisionArticleAdditionnel: valeur(division.articleAdditionnel),
    acteurRefUid: valeur(auteur.acteurRef),
    nombreCoSignataires: liste(objet(signataires.cosignataires).acteurRef as unknown[]).length,
    dateDepot: dateISO(cycle.dateDepot, true),
    dateSort: dateISO(cycle.dateSort),
    idDiscussionIdentique: idDiscussion ? Number(idDiscussion) : null,
  };
}

/** Numéro de séance d'un amendement, sans préfixe de partie ni rectification : « I-35 (Rect) » → « 35 ». */
function numeroCourt(numeroLong: string | null): string {
  return (numeroLong ?? "").replace(/^[IVX]+-/, "").replace(/\s*\(.*\)$/, "").trim();
}

/** Numéros cités par un libellé de scrutin : « l'amendement n° 1 de M. … », « les amendements nos 12 et 34… ». */
export function numerosDuScrutin(libelle: string): string[] {
  const m = libelle.match(
    /\b(?:sous-)?amendements?\s+n\s?[°o]s?\s*([\d\s,et\-IVX]+?)(?:\s*\(rect\.?\))?(?:\s+de\s|\s+du\s|\s+des\s|\s+à\s|\s+au\s|\s+et l|\s+portant|\s+visant|\s+après|\s+avant|\s+tendant|\s*\(|,|$)/
  );
  if (!m) return [];
  return (m[1].match(/[IVX]+-\d+|\d+/g) ?? []).map((n) => n.replace(/^[IVX]+-/, ""));
}

/**
 * Scrutin public qui a tranché chaque amendement de séance.
 *
 * Un scrutin ne référence pas l'amendement : son libellé cite un numéro, dans
 * une séance donnée. On rattache l'amendement cité, discuté dans la même
 * séance, et ses amendements identiques (mis aux voix ensemble).
 *
 * Volontairement plus strict que l'API, qui rattachait aussi des amendements
 * de commission ou d'une même discussion commune (tombés, non soutenus) au
 * scrutin d'un autre amendement : aucun lien faux sur l'échantillon comparé.
 */
export function lierScrutins(
  amendements: Brut[],
  scrutins: { uid: string; numero?: unknown; seanceRef?: unknown; objet?: { libelle?: unknown } }[]
): Map<string, string> {
  const parSeanceEtNumero = new Map<string, string[]>();
  const parGroupe = new Map<string, string[]>();
  for (const a of amendements) {
    const seance = valeur(a.seanceDiscussionRef);
    if (!seance) continue;
    const uid = a.uid as string;
    const cle = `${seance}|${numeroCourt(valeur(objet(a.identification).numeroLong))}`;
    parSeanceEtNumero.set(cle, [...(parSeanceEtNumero.get(cle) ?? []), uid]);
    const groupe = valeur(objet(a.discussionIdentique).idDiscussion);
    if (groupe) parGroupe.set(`${seance}|${groupe}`, [...(parGroupe.get(`${seance}|${groupe}`) ?? []), uid]);
  }
  const groupeDe = new Map<string, string>();
  for (const a of amendements) {
    const groupe = valeur(objet(a.discussionIdentique).idDiscussion);
    const seance = valeur(a.seanceDiscussionRef);
    if (groupe && seance) groupeDe.set(a.uid as string, `${seance}|${groupe}`);
  }

  const liens = new Map<string, string>();
  const ordonnes = [...scrutins].sort((x, y) => Number(valeur(x.numero) ?? 0) - Number(valeur(y.numero) ?? 0));
  for (const scrutin of ordonnes) {
    const seance = valeur(scrutin.seanceRef);
    const libelle = valeur(scrutin.objet?.libelle);
    if (!seance || !libelle) continue;
    for (const numero of numerosDuScrutin(libelle)) {
      for (const uid of parSeanceEtNumero.get(`${seance}|${numero}`) ?? []) {
        const groupe = groupeDe.get(uid);
        for (const cible of [uid, ...(groupe ? parGroupe.get(groupe) ?? [] : [])]) {
          if (!liens.has(cible)) liens.set(cible, scrutin.uid);
        }
      }
    }
  }
  return liens;
}

/** Retire les attributs de mise en forme de l'Assemblée (style, data-*) : le site applique sa typographie. */
function nettoyerHtml(html: string | null): string | null {
  if (!html) return null;
  return html.replace(/\s(?:style|data-[\w-]+)="[^"]*"/g, "");
}

/** Dispositif et exposé sommaire, en HTML, lus à l'ouverture d'une carte. */
export function texteAmendementDepuisAN(brut: Brut): { dispositif: string | null; exposeSommaire: string | null } {
  const contenu = objet(objet(brut.corps).contenuAuteur);
  return {
    dispositif: nettoyerHtml(valeur(contenu.dispositif)),
    exposeSommaire: nettoyerHtml(valeur(contenu.exposeSommaire)),
  };
}
