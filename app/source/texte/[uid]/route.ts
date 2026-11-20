import { getParlementDb } from "@/lib/mongodb";
import { formatsTexte, UID_TEXTE, urlDossier } from "@/lib/sourcesAN";

/**
 * Redirige vers le texte officiel d'un document sur le site de l'Assemblée.
 *
 * Selon le type, le site publie une version HTML, un PDF, ou ni l'un ni
 * l'autre sous cet identifiant (avis publiés par tomes). On vérifie donc
 * l'existence avant de rediriger ; à défaut, on renvoie vers la page du
 * dossier, qui liste les documents tels que l'Assemblée les publie.
 */

const UN_JOUR = 86_400_000;
// Adresse trouvée par uid : un clic ne coûte une vérification qu'une fois par
// jour et par instance.
const cache = new Map<string, { url: string; expire: number }>();

function rediriger(url: string, maxAge: number) {
  return new Response(null, {
    status: 302,
    headers: { location: url, "cache-control": `public, max-age=${maxAge}` },
  });
}

async function existe(url: string): Promise<boolean | null> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (res.ok) return true;
    return res.status === 404 || res.status === 410 ? false : null;
  } catch {
    return null; // panne réseau : on ne sait pas
  }
}

async function dossierDuDocument(uid: string): Promise<string | null> {
  try {
    const db = await getParlementDb();
    const doc = await db.collection("documents").findOne({ uid }, { projection: { _id: 0, dossierRef: 1 } });
    return urlDossier(doc?.dossierRef);
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!UID_TEXTE.test(uid)) return new Response("Identifiant de document invalide", { status: 400 });

  const enCache = cache.get(uid);
  if (enCache && enCache.expire > Date.now()) return rediriger(enCache.url, 86400);

  const candidats = formatsTexte(uid);
  let incertain = false;
  for (const url of candidats) {
    const ok = await existe(url);
    if (ok) {
      cache.set(uid, { url, expire: Date.now() + UN_JOUR });
      return rediriger(url, 86400);
    }
    if (ok === null) incertain = true;
  }

  // Site injoignable : on tente le format le plus probable, sans rien retenir.
  if (incertain) return rediriger(candidats[0], 0);

  const dossier = await dossierDuDocument(uid);
  if (dossier) return rediriger(dossier, 3600);
  return new Response("Ce document n’est pas publié sous cet identifiant sur le site de l’Assemblée nationale.", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
