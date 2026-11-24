/**
 * Proximité de vote : part des scrutins où un député, ou un groupe, a voté
 * comme la ligne d'un autre groupe. Calculée chaque nuit par
 * statistiques_activite.py (calculer_proximites). Module pur, importable
 * côté navigateur.
 *
 * Un groupe a une ligne sur un scrutin quand au moins deux tiers de ses
 * votants ont voté dans le même sens ; sinon, il n'entre pas dans le calcul.
 */

export const MESURE_PROXIMITE = "proximite-groupes";

/** Paire [accords, scrutins comparés]. */
export type Accords = [number, number];

export type Perimetre = "tous" | "solennels";

export type ProximiteGroupe = {
  groupe: string;
  couleur?: string | null;
  tous?: Accords;
  solennels?: Accords;
};

export type StatistiquesGroupes = {
  periode: "LEGISLATURE" | "LAST_YEAR" | "LAST_SIX_MONTHS";
  scrutins: Record<Perimetre, number>;
  /** Cohésion : [scrutins avec une ligne, scrutins où le groupe a voté]. */
  groupes: ({ groupe: string; couleur?: string | null; libelle?: string | null } & Partial<Record<Perimetre, Accords>>)[];
  /** De groupe à groupe : [même ligne, scrutins où les deux en avaient une]. */
  paires: ({ groupes: [string, string] } & Partial<Record<Perimetre, Accords>>)[];
};

/** Pourcentage, ou `null` sans scrutin comparé. */
export function taux(accords?: Accords): number | null {
  if (!accords || !accords[1]) return null;
  return (100 * accords[0]) / accords[1];
}

/** « 77 % » : arrondi à l'unité, comme sur les autres cartes en pourcentage. */
export function formaterTaux(valeur: number): string {
  return `${Math.round(valeur).toLocaleString("fr-FR")} %`;
}

/**
 * Ordre de l'hémicycle, de la gauche à la droite, pour la matrice des
 * groupes : les groupes voisins y sont côte à côte. Un groupe absent de cette
 * liste (nouveau groupe) vient à la fin.
 */
const ORDRE_HEMICYCLE = ["LFI-NFP", "GDR", "ECOS", "SOC", "LIOT", "DEM", "EPR", "HOR", "DR", "UDR", "RN"];

export function ordreHemicycle(a: string, b: string): number {
  const rang = (g: string) => {
    const i = ORDRE_HEMICYCLE.indexOf(g);
    return i === -1 ? ORDRE_HEMICYCLE.length : i;
  };
  return rang(a) - rang(b) || a.localeCompare(b);
}

/** Groupes classés par proximité décroissante sur un périmètre, son groupe à part. */
export function classerProximites(
  groupes: ProximiteGroupe[],
  perimetre: Perimetre,
  groupeDuDepute?: string | null
): { propre: (ProximiteGroupe & { taux: number }) | null; autres: (ProximiteGroupe & { taux: number })[] } {
  const avecTaux = groupes
    .map((g) => ({ ...g, taux: taux(g[perimetre]) }))
    .filter((g): g is ProximiteGroupe & { taux: number } => g.taux !== null)
    .sort((a, b) => b.taux - a.taux || ordreHemicycle(a.groupe, b.groupe));
  return {
    propre: avecTaux.find((g) => g.groupe === groupeDuDepute) ?? null,
    autres: avecTaux.filter((g) => g.groupe !== groupeDuDepute),
  };
}
