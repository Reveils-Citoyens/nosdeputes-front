/**
 * Liens vers la source officielle, sur le site de l'Assemblée nationale.
 *
 * Toutes les URL sont construites à partir des identifiants de l'open data
 * (PA…, DLR…, VTANR…, AMANR…, CRSANR…, QANR…), que le site de l'Assemblée
 * accepte et redirige vers la page lisible. Formats vérifiés sur le site le
 * 20 novembre 2026. Si l'Assemblée en change un, c'est ici qu'il se corrige.
 *
 * Chaque fonction renvoie null pour un identifiant au format inattendu :
 * mieux vaut aucun lien qu'un lien vers une page d'erreur.
 */

const AN = "https://www.assemblee-nationale.fr";

/** Législature lue dans l'identifiant : « …R5L17… » → 17. */
function legislatureDe(uid: string): number | null {
  const m = uid.match(/R5L(\d{2})/);
  return m ? Number(m[1]) : null;
}

/** Fiche du député : PA722142. */
export function urlDepute(acteurUid: string | null | undefined): string | null {
  return acteurUid && /^PA\d+$/.test(acteurUid) ? `${AN}/dyn/deputes/${acteurUid}` : null;
}

/** Dossier législatif : DLR5L17N54372. */
export function urlDossier(dossierUid: string | null | undefined): string | null {
  if (!dossierUid || !/^DLR5L\d{2}N\d+$/.test(dossierUid)) return null;
  return `${AN}/dyn/${legislatureDe(dossierUid)}/dossiers/${dossierUid}`;
}

/** Analyse du scrutin, avec le vote de chaque député : VTANR5L17V8430. */
export function urlScrutin(scrutinUid: string | null | undefined): string | null {
  const m = scrutinUid?.match(/^VTANR5L(\d{2})V(\d+)$/);
  return m ? `${AN}/dyn/${Number(m[1])}/scrutins/${m[2]}` : null;
}

/** Amendement, en commission comme en séance : AMANR5L17PO838901BTC3190P0D1N000433. */
export function urlAmendement(amendementUid: string | null | undefined): string | null {
  if (!amendementUid || !/^AMANR5L\d{2}[A-Z0-9]+$/.test(amendementUid)) return null;
  return `${AN}/dyn/${legislatureDe(amendementUid)}/amendements/${amendementUid}`;
}

export const UID_TEXTE = /^[A-Z]{4}ANR5L\d{2}[A-Za-z0-9-]+$/;

/** Types publiés seulement en PDF : actes, avis du Conseil d'État, études
 * d'impact, lettres rectificatives. Idem pour les textes adoptés en séance
 * (« TAP »). Constaté sur un échantillon de chaque type, novembre 2026. */
const TYPES_PDF = new Set(["ACIN", "AVCE", "ETDI", "LETT"]);

/**
 * Adresses possibles du texte officiel, la plus probable d'abord. Le site
 * publie selon le type une version HTML, un PDF, ou les deux — et certains
 * avis en plusieurs tomes seulement : aucune règle fixe ne couvre tous les cas.
 */
export function formatsTexte(documentUid: string): string[] {
  const html = `${AN}/dyn/opendata/${documentUid}.html`;
  const pdf = `${AN}/dyn/opendata/${documentUid}.pdf`;
  return TYPES_PDF.has(documentUid.slice(0, 4)) || /TAP\d/.test(documentUid) ? [pdf, html] : [html, pdf];
}

/**
 * Texte officiel d'un document (projet ou proposition de loi, texte de
 * commission, rapport, étude d'impact…) : PRJLANR5L17B3210.
 *
 * Le lien passe par /source/texte/{uid}, qui vérifie lequel des formats
 * existe sur le site de l'Assemblée et y redirige (repli : la page du
 * dossier). Un lien direct mènerait parfois à une page d'erreur.
 */
export function urlTexte(documentUid: string | null | undefined): string | null {
  return documentUid && UID_TEXTE.test(documentUid) ? `/source/texte/${documentUid}` : null;
}

/**
 * Compte rendu officiel. Séance publique (CRSANR…) : page du site. Réunion de
 * commission (CRCANR…) : version open data, qui porte la liste des présents.
 */
export function urlCompteRendu(compteRenduUid: string | null | undefined): string | null {
  if (!compteRenduUid) return null;
  if (/^CRSANR5L\d{2}S[A-Z0-9]+$/.test(compteRenduUid)) {
    return `${AN}/dyn/${legislatureDe(compteRenduUid)}/comptes-rendus/seance/${compteRenduUid}`;
  }
  if (/^CRCANR5L\d{2}S[A-Z0-9]+$/.test(compteRenduUid)) {
    return `${AN}/dyn/opendata/${compteRenduUid}.html`;
  }
  return null;
}

/** Question écrite, au Gouvernement ou orale sans débat : QANR5L17QE17785. */
export function urlQuestion(questionUid: string | null | undefined): string | null {
  if (!questionUid || !/^QANR5L\d{2}Q[A-Z]+\d+$/.test(questionUid)) return null;
  return `${AN}/dyn/${legislatureDe(questionUid)}/questions/${questionUid}`;
}

/** Choisit le lien adapté à un identifiant de l'open data, quel qu'il soit. */
export function urlSource(uid: string | null | undefined): string | null {
  if (!uid) return null;
  if (uid.startsWith("AMANR")) return urlAmendement(uid);
  if (uid.startsWith("QANR")) return urlQuestion(uid);
  if (uid.startsWith("VTANR")) return urlScrutin(uid);
  if (uid.startsWith("DLR")) return urlDossier(uid);
  if (uid.startsWith("CR")) return urlCompteRendu(uid);
  if (uid.startsWith("PA")) return urlDepute(uid);
  return urlTexte(uid);
}
