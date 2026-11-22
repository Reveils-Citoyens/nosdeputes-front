import { decodeHtmlEntities } from "@/utils/decodeHtmlEntities";

/**
 * Recherche par mot-clé dans les textes de l'Assemblée, insensible à la casse
 * et aux accents (« prevention » trouve « prévention »).
 */

/** Texte brut comparable : sans balises ni entités, sans accents, en minuscules. */
export function normaliserTexte(texte: string | null | undefined): string {
  if (!texte) return "";
  return decodeHtmlEntities(texte.replace(/<[^>]*>/g, " "))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[’‘]/g, "'")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const VARIANTES: Record<string, string> = {
  a: "aàâäáã",
  c: "cç",
  e: "eéèêë",
  i: "iîïí",
  o: "oôöó",
  u: "uùûüú",
  y: "yÿ",
};
const ENTITE = "&#[0-9a-fA-Fx]{1,8};|&[a-zA-Z]+;";

/**
 * Expression régulière MongoDB qui retrouve `requete` dans du HTML tel que
 * l'Assemblée le publie, où les lettres accentuées, apostrophes et espaces
 * insécables sont souvent codés en entités (« pr&#x00E9;vention »). À utiliser
 * avec l'option "i".
 */
export function motifRechercheHtml(requete: string): string {
  let motif = "";
  for (const caractere of normaliserTexte(requete).trim()) {
    const variantes = VARIANTES[caractere];
    if (variantes) motif += `(?:[${variantes}]|${ENTITE})`;
    else if (caractere === "'") motif += `(?:['’‘]|${ENTITE})`;
    else if (caractere === " ") motif += `(?:\\s|${ENTITE})+`;
    else motif += caractere.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return motif;
}
