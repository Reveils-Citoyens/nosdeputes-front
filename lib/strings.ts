/**
 * Met une majuscule sur la première lettre uniquement
 * (à la différence de CSS `text-transform: capitalize`
 * qui capitalise chaque mot).
 */
export function capitalizeFirst(s: string | null | undefined): string {
  if (!s) return "";
  return s.charAt(0).toLocaleUpperCase("fr-FR") + s.slice(1);
}
