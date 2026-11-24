/**
 * Situation d'une personne dont on affiche la fiche « député ».
 *
 * Toutes ne sont pas députés : l'Assemblée compte parmi ses acteurs les membres
 * du Gouvernement, qui y prennent la parole sans y siéger — un Premier ministre
 * venu du Sénat, par exemple. Leur appliquer les statistiques des députés les
 * ferait passer pour les moins actifs de l'hémicycle.
 */

export type FonctionGouvernement = {
  /** Libellé bref, pour un badge : « Premier ministre », « Ministre déléguée ». */
  court: string;
  /** Intitulé complet : « Ministre de l'intérieur ». */
  intitule: string;
};

export type SituationActeur = {
  /** Mandat de député en cours. */
  enExercice: boolean;
  /** A siégé comme député pendant la législature en cours. */
  aSiege: boolean;
  /** Membre du Gouvernement en exercice. */
  gouvernement: FonctionGouvernement | null;
};

type MandatActif = {
  typeOrgane: string | null;
  libQualite?: string | null;
  libQualiteSex?: string | null;
  organeRef?: { libelle?: string | null } | null;
};

/** Qualités génériques, que le libellé du ministère complète. */
const QUALITE_GENERIQUE = /^(ministre( délégué(e)?)?|secrétaire d['’]état)$/i;

export function fonctionGouvernement(mandats: MandatActif[]): FonctionGouvernement | null {
  const ministere = mandats.find((m) => m.typeOrgane === "MINISTERE");
  if (!ministere) {
    return mandats.some((m) => m.typeOrgane === "GOUVERNEMENT")
      ? { court: "Gouvernement", intitule: "Membre du Gouvernement" }
      : null;
  }

  const qualite = (ministere.libQualiteSex || ministere.libQualite || "").trim();
  const libelle = (ministere.organeRef?.libelle ?? "").trim();
  if (!qualite) {
    return { court: "Gouvernement", intitule: libelle || "Membre du Gouvernement" };
  }

  // « Ministère de l'intérieur » + « Ministre » → « Ministre de l'intérieur ».
  // Les qualités déjà complètes (« Premier ministre », « Garde des sceaux,
  // ministre de la justice ») se suffisent.
  const intitule =
    QUALITE_GENERIQUE.test(qualite) && /^(ministère|secrétariat d['’]état)/i.test(libelle)
      ? libelle.replace(/^(ministère( délégué)?|secrétariat d['’]état)/i, qualite)
      : qualite;

  return { court: qualite.split(",")[0].trim(), intitule };
}

export function situationActeur(
  mandatsActifs: MandatActif[],
  /** Périodes de mandat de député dans la législature ; `null` si inconnues. */
  periodes: unknown[] | null
): SituationActeur {
  const enExercice = mandatsActifs.some((m) => m.typeOrgane === "ASSEMBLEE");
  return {
    enExercice,
    // Périodes inconnues (base indisponible) : on suppose qu'il a siégé, ce
    // qui laisse l'affichage tel qu'il était plutôt que d'effacer ses chiffres.
    aSiege: enExercice || periodes === null || periodes.length > 0,
    gouvernement: fonctionGouvernement(mandatsActifs),
  };
}

/** Plus de mandat en cours, mais un mandat dans la législature : ses totaux. */
export const mandatInterrompu = (s: SituationActeur) => !s.enExercice && s.aSiege;

/** Jamais député de la législature : pas de statistiques de député. */
export const horsAssemblee = (s: SituationActeur) => !s.enExercice && !s.aSiege;
