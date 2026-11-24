import type { DeputeListItem } from "./deputeListItem";

const sansAccents = (texte: string) => texte.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Nom tel qu'il se classe : à partir de sa première majuscule, sans accents.
 * « de Courson » se range à C, « Élise Leboucher » à L, « Émilie Bonnivard »
 * à B et « Bérangère Couillard » avant « Bertrand ».
 */
export function cleDeTri(nom: string): string {
  const debut = nom.search(/\p{Lu}/u);
  return sansAccents(debut > 0 ? nom.slice(debut) : nom).toLocaleLowerCase("fr");
}

/** Lettre de la section alphabétique : « É » rejoint « E ». */
export function initiale(nom: string): string {
  return cleDeTri(nom).charAt(0).toLocaleUpperCase("fr") || "#";
}

/** Ordre alphabétique d'une liste de députés : nom sans particule, puis prénom. */
export function comparerDeputes(a: Pick<DeputeListItem, "nom" | "prenom">, b: Pick<DeputeListItem, "nom" | "prenom">): number {
  return (
    cleDeTri(a.nom).localeCompare(cleDeTri(b.nom), "fr") ||
    a.prenom.localeCompare(b.prenom, "fr")
  );
}

/**
 * Index de la page /deputes. Les députés sans groupe sont les membres du
 * Gouvernement, dont le mandat est suspendu (leur suppléant siège) : ils ne
 * sont rangés que sous la clé "" de `uidPerGroup`, affichée à part.
 */
export function groupDeputes(deputes: Record<string, DeputeListItem>) {
  const uidPerNom: Record<string, string[]> = {};
  const uidPerGroup: Record<string, string[]> = {};
  const uidPerCirco: Record<string, string[]> = {};

  Object.entries(deputes).forEach(([deputeUid, depute]) => {
    const { nom, mandatPrincipal, groupeParlementaireUid } = depute;
    const numDepartement = mandatPrincipal?.numDepartement ?? "";
    const groupe = groupeParlementaireUid ?? "";

    (uidPerGroup[groupe] ??= []).push(deputeUid);
    (uidPerCirco[numDepartement] ??= []).push(deputeUid);
    if (groupe) (uidPerNom[initiale(nom)] ??= []).push(deputeUid);
  });

  return { uidPerNom, uidPerGroup, uidPerCirco };
}
