import type { Paragraphe } from "@prisma/client";
import { SUMMARY_CODES } from "@/components/const";

/**
 * Formules de la présidence (ouverture, suspension, levée de séance, résultats
 * de scrutin…) : elles portent l'identifiant du président mais se lisent comme
 * des didascalies.
 */
const FORMULES = /^(OUV_SEAN|SUSP_SEANCE|FIN_SEAN|SCRUT_|ANN_SCR|VOTE_|ART_SORT|SORT_|VERIF_QUORUM)/;

/** Titres rendus à part dans le fil. */
const TITRES = new Set(["TITRE_TEXTE_DISCUSSION", "SOUS_TITRE_TEXTE_DISCUSSION", "ODJ_APPEL_DISCUSSION"]);

/**
 * Paragraphe prononcé par un orateur, à afficher avec sa photo et son groupe.
 *
 * Le compte rendu ne code pas toutes les prises de parole en
 * `PAROLE_GENERIQUE` : la défense d'un amendement (`DISC_ARTICLES_4_20`), un
 * rappel au règlement (`RAP_REGLEMENT_2_2`) ou la suite d'une intervention
 * après une interruption gardent le code de leur rubrique, avec l'orateur.
 */
export function estPriseDeParole(
  p: Pick<Paragraphe, "codeGrammaire" | "acteurRefUid" | "orateur" | "texte">
): boolean {
  const code = p.codeGrammaire ?? "";
  if (code === "PAROLE_GENERIQUE" || code === "INTERRUPTION_1_10") return true;
  if (!p.texte?.trim() || SUMMARY_CODES.has(code) || TITRES.has(code) || FORMULES.test(code)) return false;
  return !!p.acteurRefUid || !!p.orateur?.trim();
}
