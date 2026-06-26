/**
 * Met une majuscule sur la première lettre uniquement
 * (à la différence de CSS `text-transform: capitalize`
 * qui capitalise chaque mot).
 */
export function capitalizeFirst(s: string | null | undefined): string {
  if (!s) return "";
  return s.charAt(0).toLocaleUpperCase("fr-FR") + s.slice(1);
}

/**
 * Normalise une chaîne pour une recherche tolérante aux accents et à la casse :
 * "Masséglia" et "Masseglia" deviennent identiques. À appliquer aux deux côtés
 * (requête ET cible) de la comparaison.
 */
export function normalizeForSearch(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .toLowerCase()
    .trim();
}
