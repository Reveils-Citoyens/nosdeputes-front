import { Acteur, Mandat, Organe } from "@prisma/client";
import { getOrgane } from "./getOrgane";
import { resolveAuGouvernement } from "./helpers/resolveAuGouvernement";

export type ReturnedActeur = Acteur & {
  groupeParlementaire: Organe | null;
  mandatPrincipal: Mandat | null;
  auGouvernement: boolean;
};

async function fetchActeur(uid: string): Promise<ReturnedActeur | null> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/acteurs/${uid}?include=mandatPrincipal`,
    );
    if (!rep.ok) return null;

    const { data } = await rep.json();
    if (!data) return null;

    data.groupeParlementaire = null;
    if (data.groupeParlementaireUid) {
      data.groupeParlementaire = await getOrgane(data.groupeParlementaireUid);
    }
    return await resolveAuGouvernement(data);
  } catch (error) {
    // Échec réseau non bloquant : l'appelant gère le null (carte acteur masquée).
    console.warn("getActeur: échec de récupération", uid, error);
    return null;
  }
}

// Cache mémoire partagé (client et serveur) avec dédoublonnage des requêtes
// concurrentes : un même auteur revient sur des dizaines d'amendements, on ne
// veut pas le re-fetcher à chaque carte. Les échecs ne sont pas conservés pour
// permettre un nouvel essai.
const cache = new Map<string, Promise<ReturnedActeur | null>>();

export function getActeur(uid: string): Promise<ReturnedActeur | null> {
  const cached = cache.get(uid);
  if (cached) return cached;

  const p = fetchActeur(uid).then((res) => {
    if (res == null) cache.delete(uid);
    return res;
  });
  cache.set(uid, p);
  return p;
}
