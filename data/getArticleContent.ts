import { normalizeDivisionKey } from "./getDocumentSommaire";

export type AlineaData = {
  html: string;
  alineaNumber: number | null; // null = en-tête (titre, sous-section…)
  cssClass: string;
};

type SegItem = { line: string; type: string; start: number };

function buildBaseUrl(uid: string): string | null {
  // Segment alpha multi-lettres : B / BTC / BTA / TAP… (cf. buildSommaireUrl)
  const m = uid.match(/^([A-Z]{4})ANR5L(\d{2})([A-Z]+)(\d{4})$/);
  if (!m) return null;
  const [, type, leg, letter, numStr] = m;
  const nnn = String(Math.floor(parseInt(numStr, 10) / 1000)).padStart(3, "0");
  return (
    `https://git.tricoteuses.fr/assemblee/Documents_enrichis/raw/branch/master` +
    `/${type}/AN/R5/${leg}/${letter}/${nnn}/${uid}`
  );
}

export function flattenSeg(data: Record<string, unknown>): SegItem[] {
  const items: SegItem[] = [];

  // Format arborescent `items` (Documents_enrichis depuis fin septembre
  // 2026) : divisions et articles mêlés, distingués par `type`.
  function walkItems(nodes: Record<string, unknown>[]) {
    for (const node of nodes) {
      const orig = (node.originalTransformation as Record<string, unknown> | undefined)
        ?.position as Record<string, number> | undefined;
      if (orig?.start != null) {
        items.push({ line: node.line as string, type: node.type as string, start: orig.start });
      }
      walkItems((node.items as Record<string, unknown>[]) ?? []);
    }
  }
  walkItems((data.items as Record<string, unknown>[]) ?? []);

  function walk(node: Record<string, unknown>) {
    const orig = (node.originalTransformation as Record<string, unknown> | undefined)
      ?.position as Record<string, number> | undefined;
    if (orig?.start != null) {
      items.push({ line: node.line as string, type: node.type as string, start: orig.start });
    }
    for (const art of (node.articles as Record<string, unknown>[]) ?? []) {
      const ao = (art.originalTransformation as Record<string, unknown> | undefined)
        ?.position as Record<string, number> | undefined;
      if (ao?.start != null)
        items.push({ line: art.line as string, type: art.type as string, start: ao.start });
    }
    for (const sub of (node.divisions as Record<string, unknown>[]) ?? []) walk(sub);
  }

  for (const d of (data.divisions as Record<string, unknown>[]) ?? []) walk(d);
  for (const a of (data.articles as Record<string, unknown>[]) ?? []) {
    const ao = (a.originalTransformation as Record<string, unknown> | undefined)
      ?.position as Record<string, number> | undefined;
    if (ao?.start != null)
      items.push({ line: a.line as string, type: a.type as string, start: ao.start });
  }

  return items.sort((a, b) => a.start - b.start);
}

// Décode les références de caractères HTML numériques (&#x2011; trait d'union
// insécable, &#x2019; apostrophe, &#x153; œ, &#8209;, …) ainsi que &nbsp;.
// Nécessaire pour les en-têtes de section rendus en texte brut (sans innerHTML),
// qui afficheraient sinon l'entité littérale. On laisse < > & encodés pour ne
// pas réintroduire de structure dans le HTML des alinéas (injecté via innerHTML).
function decodeEntities(s: string): string {
  const safe = (cp: number, original: string) => {
    if (cp === 0x3c || cp === 0x3e || cp === 0x26 || cp > 0x10ffff) return original;
    if (cp === 0xa0) return " "; // espace insécable → espace normal
    return String.fromCodePoint(cp);
  };
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => safe(parseInt(h, 16), m))
    .replace(/&#(\d+);/g, (m, d) => safe(parseInt(d, 10), m))
    .replace(/&nbsp;/g, " ");
}

function sanitize(raw: string): string {
  return decodeEntities(raw)
    .replace(/[\r\n\t]+/g, " ")
    .replace(/ /g, " ") // espaces insécables → espace normal
    .replace(/ {2,}/g, " ")
    .replace(/<a\s/g, '<a target="_blank" rel="noopener noreferrer" ')
    .trim();
}

// Mise en page des projets de loi de finances (classes assnatFPF… / FAR…) :
//  - le numéro d'alinéa est un paragraphe séparé « (1) » (assnatPastille),
//    suivi du texte (assnatFPFprojetloiartexte) ;
//  - chaque article est suivi de son exposé des motifs, puis d'un saut de
//    page avec un en-tête courant « Projet de loi de finances » et un numéro.
const CLASSE_PASTILLE = "assnatPastille";
const CLASSE_TEXTE_PLF = "assnatFPFprojetloiartexte";
const CLASSE_TITRE_EXPOSE = "assnatFPFexpogentitre1";

function estEnTeteDePage(cssClass: string, texte: string): boolean {
  return (
    cssClass === "assnatFARSautApres" ||
    (cssClass === "assnatFARTT08Bleu" && /^projet de loi de finances/i.test(texte)) ||
    (cssClass === "assnatFAR09Noir" && /^\d+$/.test(texte))
  );
}

/**
 * Dans un PLF, garde l'article et son propre exposé des motifs, et s'arrête
 * là. La segmentation de Documents_enrichis ne reconnaît pas tous les
 * articles d'un PLF (66 sur 89 pour le PLF 2027) : sans cette coupure, le
 * texte d'un article non reconnu s'afficherait sous l'article précédent.
 * Sans exposé (autres textes), rien ne change.
 */
export function couperApresExposeDesMotifs(alineas: AlineaData[]): AlineaData[] {
  const debut = alineas.findIndex((a) => a.cssClass === CLASSE_TITRE_EXPOSE);
  if (debut === -1) return alineas;
  let fin = debut + 1;
  while (fin < alineas.length && alineas[fin].cssClass.startsWith("assnatFPFexpogen")) fin++;
  return alineas.slice(0, fin);
}

export function parseAlineas(html: string): AlineaData[] {
  const results: AlineaData[] = [];
  let counter = 0;
  // Numéro lu dans une pastille « (n) » (PLF), appliqué au paragraphe suivant.
  let pastille: number | null = null;

  // Capture tous les <p> quel que soit leur format (class= ou style= ou rien)
  const re = /<p([^>]*)>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    const attrs = match[1];
    const rawContent = match[2];

    const classMatch = attrs.match(/\bclass="([^"]+)"/);
    const cssClass = classMatch ? classMatch[1].trim() : "";

    const styleMatch = attrs.match(/\bstyle="([^"]+)"/);
    const inlineStyle = styleMatch ? styleMatch[1] : "";

    // Numéro d'article (ex : "Article 5") — toujours ignoré
    if (cssClass.includes("ArticleNum")) continue;

    const content = sanitize(rawContent);
    if (!content || content.trim() === "") continue;

    if (cssClass) {
      const texte = content.replace(/<[^>]+>/g, "").trim();
      if (cssClass === CLASSE_PASTILLE) {
        const n = texte.match(/^\((\d+)\)$/);
        if (n) {
          pastille = Number(n[1]);
          continue;
        }
      }
      if (estEnTeteDePage(cssClass, texte)) continue;

      // Format avec classes CSS (assnatLoiTexte, assnat6SectionIntit…)
      if (cssClass === "assnatLoiTexte") {
        counter++;
        results.push({ html: content, alineaNumber: counter, cssClass });
      } else if (cssClass === CLASSE_TEXTE_PLF) {
        // Numéro officiel de la pastille (un tableau peut en consommer un :
        // « (1) texte, (2) tableau, (3) texte »). Sans pastille, c'est la
        // suite de l'alinéa précédent (« » ; » après un tableau cité).
        results.push({ html: content, alineaNumber: pastille, cssClass });
        pastille = null;
      } else if (cssClass.startsWith("assnat")) {
        // Sous-sections, titres de section → en-tête non numéroté
        results.push({ html: content, alineaNumber: null, cssClass });
        // Dans un PLF, un tableau est un alinéa : il consomme sa pastille, que
        // le texte qui le suit (« » ; ») ne doit pas reprendre.
        pastille = null;
      }
    } else {
      // Format avec styles inline (margin-bottom + text-indent)
      const isCentered =
        inlineStyle.includes("text-align:center") ||
        inlineStyle.includes("text-align: center");
      if (isCentered) {
        results.push({ html: content, alineaNumber: null, cssClass: "inline-header" });
      } else {
        counter++;
        results.push({ html: content, alineaNumber: counter, cssClass: "inline-alinea" });
      }
    }
  }

  return results;
}

// Récupère une ressource texte avec quelques tentatives : git.tricoteuses peut
// renvoyer des 502 transitoires. `cache: "no-store"` évite de figer un échec
// dans le cache de données Next (le cache mémoire ci-dessous gère la réutilisation).
async function fetchText(url: string, attempts = 3): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) return await res.text();
    } catch {
      // erreur réseau → on retente
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  return null;
}

// Document entier parsé : tous les articles → leurs alinéas, indexés par clé
// canonique. On parse le HTML (200 Ko) UNE SEULE FOIS par version plutôt qu'à
// chaque article.
type ParsedDoc = { articlesByKey: Map<string, AlineaData[]> };

// Cache mémoire (succès uniquement) : un échec n'est jamais conservé, pour
// qu'une indisponibilité transitoire de git.tricoteuses ne se traduise pas par
// un « Texte non disponible » figé.
const docCache = new Map<string, Promise<ParsedDoc | null>>();

async function loadParsedDoc(uid: string): Promise<ParsedDoc | null> {
  const base = buildBaseUrl(uid);
  if (!base) return null;

  const [segText, htmlText] = await Promise.all([
    fetchText(`${base}/dyn-opendata_avec_liens_segmentation.json`),
    fetchText(`${base}/dyn-opendata_avec_liens.html`),
  ]);
  if (!segText || !htmlText) return null;

  let segData: Record<string, unknown>;
  try {
    segData = JSON.parse(segText);
  } catch {
    return null;
  }

  const items = flattenSeg(segData);
  const map = new Map<string, AlineaData[]>();
  for (let i = 0; i < items.length; i++) {
    if (items[i].type !== "article") continue;
    const start = items[i].start;
    const end = items[i + 1]?.start;
    const chunk = end != null ? htmlText.slice(start, end) : htmlText.slice(start);
    map.set(normalizeDivisionKey(items[i].line), couperApresExposeDesMotifs(parseAlineas(chunk)));
  }
  return { articlesByKey: map };
}

function getParsedDoc(uid: string): Promise<ParsedDoc | null> {
  const cached = docCache.get(uid);
  if (cached) return cached;
  const p = loadParsedDoc(uid).then((res) => {
    if (res === null) docCache.delete(uid); // ne pas figer un échec
    return res;
  });
  docCache.set(uid, p);
  return p;
}

export async function getArticleContent(
  uid: string,
  articleKey: string,
): Promise<AlineaData[] | null> {
  const doc = await getParsedDoc(uid);
  if (!doc) return null;
  return doc.articlesByKey.get(normalizeDivisionKey(articleKey)) ?? null;
}
