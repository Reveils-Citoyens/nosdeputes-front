/**
 * Décode les entités HTML/XML les plus courantes et strip les balises HTML.
 * Conçu pour générer des previews lisibles à partir des champs HTML stockés
 * en base (amendements, exposés sommaires, etc.).
 */

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  // Accents et caractères français courants
  eacute: "é", Eacute: "É",
  egrave: "è", Egrave: "È",
  ecirc: "ê",  Ecirc: "Ê",
  euml: "ë",   Euml: "Ë",
  aacute: "á", Aacute: "Á",
  agrave: "à", Agrave: "À",
  acirc: "â",  Acirc: "Â",
  auml: "ä",   Auml: "Ä",
  iacute: "í", Iacute: "Í",
  igrave: "ì", Igrave: "Ì",
  icirc: "î",  Icirc: "Î",
  iuml: "ï",   Iuml: "Ï",
  oacute: "ó", Oacute: "Ó",
  ograve: "ò", Ograve: "Ò",
  ocirc: "ô",  Ocirc: "Ô",
  ouml: "ö",   Ouml: "Ö",
  uacute: "ú", Uacute: "Ú",
  ugrave: "ù", Ugrave: "Ù",
  ucirc: "û",  Ucirc: "Û",
  uuml: "ü",   Uuml: "Ü",
  ccedil: "ç", Ccedil: "Ç",
  ntilde: "ñ", Ntilde: "Ñ",
  // Ponctuation typographique
  laquo: "«",
  raquo: "»",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  bull: "•",
  middot: "·",
};

function decodeHtmlEntities(text: string): string {
  // Hex numeric entities: &#x00E9; → é
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return _;
    }
  });
  // Decimal numeric entities: &#233; → é
  text = text.replace(/&#(\d+);/g, (_, dec) => {
    try {
      return String.fromCodePoint(parseInt(dec, 10));
    } catch {
      return _;
    }
  });
  // Named entities
  text = text.replace(/&(\w+);/g, (match, name) => NAMED_ENTITIES[name] ?? match);
  return text;
}

/**
 * Retourne un extrait texte propre à partir d'un fragment HTML/XML
 * potentiellement encodé avec des entités hex.
 *
 * @param html Le HTML source (peut contenir <p>, &#x00E9;, etc.)
 * @param maxLength Longueur maximale (caractères) du résultat. Coupé avec "…".
 */
export function htmlToPreview(
  html: string | null | undefined,
  maxLength = 180
): string {
  if (!html) return "";

  let s = html;

  // 1) Strip les balises HTML (en gardant un espace pour éviter les mots collés)
  s = s.replace(/<[^>]*>/g, " ");

  // 2) Décoder les entités
  s = decodeHtmlEntities(s);

  // 3) Normaliser les espaces (multiples espaces, sauts de ligne…)
  s = s.replace(/\s+/g, " ").trim();

  // 4) Tronquer proprement
  if (s.length > maxLength) {
    s = s.slice(0, maxLength).trimEnd() + "…";
  }

  return s;
}
