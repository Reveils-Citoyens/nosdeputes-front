import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";

export type CCompteDocument = {
  href: string;
  type: string;
};

export type CCompteParagraph = {
  type: string;
  content: string;
};

export type CCompteResult = {
  id: string;
  titre: string;
  teaser: string;
  date: string;
  url: string;
  documents: CCompteDocument[];
  themes: string[];
  content: CCompteParagraph[];
};

const PROJECTION = {
  _id: 1,
  titre: 1,
  teaser: 1,
  date: 1,
  url: 1,
  documents: 1,
  themes: 1,
  content: 1,
};

function mapDoc(d: Record<string, unknown>): CCompteResult {
  return {
    id: String(d._id),
    titre: typeof d.titre === "string" ? d.titre : "",
    teaser: typeof d.teaser === "string" ? d.teaser : "",
    date: typeof d.date === "string" ? d.date : "",
    url: typeof d.url === "string" ? d.url : "",
    documents: Array.isArray(d.documents)
      ? d.documents
          .filter((doc: unknown) => doc && typeof (doc as Record<string, unknown>).href === "string")
          .map((doc: Record<string, unknown>) => ({
            href: String(doc.href),
            type: typeof doc.type === "string" ? doc.type.trim() : "Document",
          }))
      : [],
    themes: Array.isArray(d.themes)
      ? d.themes.filter((t: unknown) => typeof t === "string")
      : [],
    content: Array.isArray(d.content)
      ? d.content
          .filter((p: unknown) => p && typeof (p as Record<string, unknown>).content === "string")
          .map((p: Record<string, unknown>) => ({
            type: typeof p.type === "string" ? p.type : "paragraph",
            content: String(p.content),
          }))
      : [],
  };
}

async function getCComptesParThemeUnCached(
  themes: string | string[],
  limit = 5,
  skip = 0
): Promise<{ items: CCompteResult[]; total: number }> {
  const db = await getParlementDb();
  const themesArr = Array.isArray(themes) ? themes : [themes];
  const filter = { themes: { $in: themesArr } };

  const [docs, total] = await Promise.all([
    db
      .collection("ccomptes")
      .find(filter, { projection: PROJECTION, sort: { date: -1 }, skip, limit })
      .toArray(),
    db.collection("ccomptes").countDocuments(filter),
  ]);

  return { items: docs.map((d) => mapDoc(d as Record<string, unknown>)), total };
}

export const getCComptesParTheme = cache(getCComptesParThemeUnCached);
