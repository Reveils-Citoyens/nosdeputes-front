import { decodeHtmlEntities } from "@/utils/decodeHtmlEntities";

export type ArticleEntry = {
  label: string;
  key: string;
  isDivisionHeader: boolean;
};

type RawArticle = { line: string; type: string };
type RawDivision = {
  line: string;
  type: string;
  articles?: RawArticle[];
  divisions?: RawDivision[];
};
type RawSommaire = {
  articles?: RawArticle[];
  divisions?: RawDivision[];
};

export function buildSommaireUrl(uid: string): string | null {
  // Le segment alpha peut faire plusieurs lettres :
  //   B    → texte déposé        (PRJLANR5L17B0324  → …/B/000/…)
  //   BTC  → texte de commission (PIONANR5L17BTC1281 → …/BTC/001/…)
  //   BTA  → texte adopté        (PIONANR5L17BTA0121 → …/BTA/000/…)
  const m = uid.match(/^([A-Z]{4})ANR5L(\d{2})([A-Z]+)(\d{4})$/);
  if (!m) return null;
  const [, type, leg, letter, numStr] = m;
  const nnn = String(Math.floor(parseInt(numStr, 10) / 1000)).padStart(3, "0");
  return (
    `https://git.tricoteuses.fr/assemblee/Documents_enrichis/raw/branch/master` +
    `/${type}/AN/R5/${leg}/${letter}/${nnn}/${uid}/sommaire.json`
  );
}

/**
 * Clé canonique pour apparier un article du sommaire avec l'`identifiantDivision`
 * d'un amendement. Tolérante aux divergences de notation entre les deux sources :
 *  - "Article 1er"            ↔ "article 1"        (ordinal)
 *  - "Article 6 bis (nouveau)" ↔ "article 6 bis"   (annotation de commission)
 *  - "article-9"              ↔ "article 9"        (tirets)
 */
export function normalizeDivisionKey(line: string): string {
  return line
    .toLowerCase()
    .replace(/\s*:\s*$/, "")                       // deux-points final
    .replace(/\([^)]*\)/g, "")                     // annotations "(nouveau)", "(supprimé)"…
    .replace(/-/g, " ")                            // tirets → espaces
    .replace(/\b1\s*(?:er|re|ère|ere)\b/g, "1")    // "1er" / "1ère" → "1"
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(line: string): string {
  return normalizeDivisionKey(line);
}

function formatLabel(line: string): string {
  const s = decodeHtmlEntities(line).replace(/\s*:\s*$/, "").trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function flattenRaw(raw: RawSommaire): ArticleEntry[] {
  const result: ArticleEntry[] = [];

  for (const a of raw.articles ?? []) {
    result.push({ label: formatLabel(a.line), key: normalizeKey(a.line), isDivisionHeader: false });
  }

  for (const div of raw.divisions ?? []) {
    result.push({ label: decodeHtmlEntities(div.line).trim(), key: normalizeKey(div.line), isDivisionHeader: true });
    for (const a of div.articles ?? []) {
      result.push({ label: formatLabel(a.line), key: normalizeKey(a.line), isDivisionHeader: false });
    }
    if (div.divisions?.length) {
      result.push(...flattenRaw({ divisions: div.divisions }));
    }
  }

  return result;
}

export async function getDocumentSommaire(uid: string): Promise<ArticleEntry[] | null> {
  const url = buildSommaireUrl(uid);
  if (!url) return null;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const raw: RawSommaire = await res.json();
    return flattenRaw(raw);
  } catch {
    return null;
  }
}
