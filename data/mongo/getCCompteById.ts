import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";
import type { CCompteDocument } from "./getCComptesParTheme";

type CCompteParagraph = {
  type: string;
  content: string;
};

export type CCompteDetail = {
  id: string;
  titre: string;
  teaser: string;
  date: string;
  url: string;
  documents: CCompteDocument[];
  content: CCompteParagraph[];
  themes: string[];
};

async function getCCompteByIdUnCached(id: string): Promise<CCompteDetail | null> {
  const db = await getParlementDb();

  // _id est stocké comme string dans cette collection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await db.collection("ccomptes").findOne({ _id: id as any });
  if (!doc) return null;

  return {
    id: String(doc._id),
    titre: typeof doc.titre === "string" ? doc.titre : "",
    teaser: typeof doc.teaser === "string" ? doc.teaser : "",
    date: typeof doc.date === "string" ? doc.date : "",
    url: typeof doc.url === "string" ? doc.url : "",
    documents: Array.isArray(doc.documents)
      ? doc.documents
          .filter((d: unknown) => d && typeof (d as Record<string, unknown>).href === "string")
          .map((d: Record<string, unknown>) => ({
            href: String(d.href),
            type: typeof d.type === "string" ? d.type.trim() : "Document",
          }))
      : [],
    content: Array.isArray(doc.content)
      ? doc.content
          .filter((p: unknown) => p && typeof (p as Record<string, unknown>).content === "string")
          .map((p: Record<string, unknown>) => ({
            type: typeof p.type === "string" ? p.type : "paragraph",
            content: String(p.content),
          }))
      : [],
    themes: Array.isArray(doc.themes)
      ? doc.themes.filter((t: unknown) => typeof t === "string")
      : [],
  };
}

export const getCCompteById = cache(getCCompteByIdUnCached);
