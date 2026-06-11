import { Organe } from "@prisma/client";

async function fetchOrgane(uid: string): Promise<Organe | null> {
  try {
    const rep = await fetch(`${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/organes/${uid}`);
    if (!rep.ok) return null;
    const { data } = await rep.json();
    return data ?? null;
  } catch (error) {
    // Échec réseau non bloquant : l'appelant gère le null (avatar/groupe non
    // affiché). console.warn (et non error) pour ne pas déclencher l'overlay
    // Next.js en dev sur une condition récupérable.
    console.warn("getOrgane: échec de récupération", uid, error);
    return null;
  }
}

// Cache mémoire partagé (client et serveur) avec dédoublonnage des requêtes
// concurrentes : de nombreux amendements pointent vers le même groupe, on ne
// veut pas refaire des centaines de fetchs identiques en parallèle.
// Les résultats nuls (échecs) ne sont pas conservés afin de permettre un
// nouvel essai ultérieur.
const cache = new Map<string, Promise<Organe | null>>();

export function getOrgane(uid: string): Promise<Organe | null> {
  const cached = cache.get(uid);
  if (cached) return cached;

  const p = fetchOrgane(uid).then((res) => {
    if (res == null) cache.delete(uid);
    return res;
  });
  cache.set(uid, p);
  return p;
}
