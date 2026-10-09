/**
 * Rattachement des amendements aux scrutins publics de la séance.
 *
 * L'API Tricoteuses relie chaque amendement mis aux voix par scrutin public à
 * ce scrutin (`scrutinRefUid`), y compris les amendements identiques votés
 * ensemble. Les commissions ne votent pas par scrutin public : seuls des
 * amendements examinés en séance sont concernés.
 */

/** Seuls ces sorts résultent d'un vote. Un amendement « Non soutenu » peut
 * porter le scrutin de ses identiques sans avoir été mis aux voix. */
const SORTS_VOTES = new Set(["Adopté", "Rejeté"]);

export type AmendementAvecScrutin = {
  uid: string;
  sortAmendement: string | null;
  scrutinRefUid?: string | null;
  idDiscussionIdentique?: number | string | null;
};

/** uid d'amendement → uid du scrutin public qui l'a tranché. */
export function rattacherScrutins(amendements: AmendementAvecScrutin[]): Map<string, string> {
  // Un identique peut manquer le lien alors que son groupe l'a : on le
  // propage, à sort égal (des identiques sont votés ensemble).
  const parGroupe = new Map<string, string>();
  for (const a of amendements) {
    if (a.scrutinRefUid && a.idDiscussionIdentique != null && SORTS_VOTES.has(a.sortAmendement ?? "")) {
      parGroupe.set(`${a.idDiscussionIdentique}|${a.sortAmendement}`, a.scrutinRefUid);
    }
  }

  const resultat = new Map<string, string>();
  for (const a of amendements) {
    if (!SORTS_VOTES.has(a.sortAmendement ?? "")) continue;
    const scrutin =
      a.scrutinRefUid ??
      (a.idDiscussionIdentique != null ? parGroupe.get(`${a.idDiscussionIdentique}|${a.sortAmendement}`) : undefined);
    if (scrutin) resultat.set(a.uid, scrutin);
  }
  return resultat;
}

/** Résumé d'un scrutin, tel que renvoyé par /api/liseuse/scrutins. */
export type ScrutinResume = {
  uid: string;
  numero: string | null;
  titre: string | null;
  dateScrutin: string | null;
  code: string | null;
  pour: number;
  contre: number;
  abstentions: number;
  libelleTypeVote: string | null;
};

const UID_SCRUTIN = /^VT[A-Z0-9]{3,40}$/;

export function estUidScrutin(uid: string): boolean {
  return UID_SCRUTIN.test(uid);
}

function entier(v: unknown): number {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

/** Normalise un scrutin de l'API (nombres parfois en chaînes). */
export function versResume(brut: Record<string, unknown>): ScrutinResume | null {
  if (typeof brut.uid !== "string") return null;
  const texte = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return {
    uid: brut.uid,
    numero: texte(brut.numero),
    titre: texte(brut.titre),
    dateScrutin: texte(brut.dateScrutin),
    code: texte(brut.code),
    pour: entier(brut.pour),
    contre: entier(brut.contre),
    abstentions: entier(brut.abstentions),
    libelleTypeVote: texte(brut.libelleTypeVote),
  };
}

/** « Scrutin public n° 8562 : 14 pour, 85 contre, 2 abstentions » */
export function libelleScrutin(s: ScrutinResume): string {
  const type = s.libelleTypeVote ? s.libelleTypeVote.charAt(0).toUpperCase() + s.libelleTypeVote.slice(1) : "Scrutin public";
  return `${type}${s.numero ? ` n° ${s.numero}` : ""} : ${s.pour} pour, ${s.contre} contre, ${s.abstentions} abstention${s.abstentions > 1 ? "s" : ""}`;
}
