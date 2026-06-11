import type { MetadataRoute } from "next";
import { THEMES, type ThemeSlug } from "@/data/themes";
import { THEME_GROUPS } from "@/data/themeGroups";
import { getDeputes } from "@/data/getDeputes";
import { getParlementDb } from "@/lib/mongodb";

const BASE = process.env.NEXT_PUBLIC_BASE_URL || "https://www.nosdeputes.fr";

// Régénération horaire (les listes députés/dossiers évoluent).
export const revalidate = 3600;

/**
 * Slug d'un député — DOIT rester identique au `toSlug` utilisé dans les liens
 * de l'app (recherche, navbar) pour que les URLs du sitemap résolvent.
 */
function toSlug(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Next génère un index /sitemap.xml pointant vers /sitemap/{id}.xml.
export async function generateSitemaps() {
  return [{ id: "pages" }, { id: "deputes" }, { id: "dossiers" }];
}

async function pagesSitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/dossiers`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/deputes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/themes`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/comprendre`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/recherche`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/methodologie`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/mentions-legales`, changeFrequency: "yearly", priority: 0.2 },
  ];
  const themeEntries: MetadataRoute.Sitemap = (
    Object.keys(THEMES) as ThemeSlug[]
  ).map((slug) => ({
    url: `${BASE}/themes/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  const groupEntries: MetadataRoute.Sitemap = Object.keys(THEME_GROUPS).map(
    (slug) => ({
      url: `${BASE}/themes/domaine/${slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    })
  );
  return [...staticEntries, ...themeEntries, ...groupEntries].map((e) => ({
    ...e,
    lastModified: now,
  }));
}

async function deputesSitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getDeputes(17);
  if (!data) return [];
  const now = new Date();
  return Object.values(data.acteurs)
    .filter((a) => a.prenom && a.nom)
    .map((a) => ({
      url: `${BASE}/depute/${toSlug(a.prenom, a.nom)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
}

async function dossiersSitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const db = await getParlementDb();
    const docs = await db
      .collection("dossiers")
      .find(
        {
          "@xsi:type": { $regex: /^Dossier/ },
          dossierRef: null,
          chambre: { $ne: "SN" },
        },
        { projection: { _id: 0, uid: 1, legislature: 1 }, limit: 50000 }
      )
      .toArray();
    const now = new Date();
    return docs
      .filter((d) => d.uid && d.legislature)
      .map((d) => ({
        url: `${BASE}/${d.legislature}/dossier/${d.uid}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.error("[sitemap] dossiers erreur:", error);
    return [];
  }
}

export default async function sitemap({
  id,
}: {
  id: string;
}): Promise<MetadataRoute.Sitemap> {
  switch (id) {
    case "pages":
      return pagesSitemap();
    case "deputes":
      return deputesSitemap();
    case "dossiers":
      return dossiersSitemap();
    default:
      return [];
  }
}
