/**
 * Décode les références de caractères HTML numériques (&#x2011; trait d'union
 * insécable, &#x2019; apostrophe, &#x153; œ, &#8209;, …) et &nbsp; vers leurs
 * vrais caractères Unicode.
 *
 * Nécessaire pour les libellés rendus en texte brut (sans
 * dangerouslySetInnerHTML), qui afficheraient sinon l'entité littérale.
 * On laisse < > & encodés pour ne pas réintroduire de structure dans du HTML
 * éventuellement réinjecté ailleurs. L'espace insécable (0xa0) est normalisé
 * en espace standard.
 */
export function decodeHtmlEntities(s: string): string {
  const safe = (cp: number, original: string) => {
    if (cp === 0x3c || cp === 0x3e || cp === 0x26 || cp > 0x10ffff) return original;
    if (cp === 0xa0) return " ";
    return String.fromCodePoint(cp);
  };
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => safe(parseInt(h, 16), m))
    .replace(/&#(\d+);/g, (m, d) => safe(parseInt(d, 10), m))
    .replace(/&nbsp;/g, " ");
}
