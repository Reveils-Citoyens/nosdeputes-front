import { Organe } from "@prisma/client";
import { cacheTricoteuses } from "./cacheTricoteuses";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

// Sur le serveur, le référentiel est lu dans notre base (cf.
// data/mongo/referentielAN.ts) ; l'API ne sert plus que de repli pour les
// organes que nous n'importons pas (législatures antérieures). Le test sur
// `window` est résolu à la compilation : le module MongoDB n'est pas embarqué
// dans le code envoyé au navigateur.
async function fetchOrgane(uid: string): Promise<Organe | null> {
  if (typeof window === "undefined") {
    const { getOrganeAN } = await import("./mongo/referentielAN");
    const organe = await getOrganeAN(uid);
    if (organe) return organe;
  }
  try {
    const rep = await fetchTricoteuses(`${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/organes/${uid}`, cacheTricoteuses("stable"));
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

/**
 * Nombre d'uids par requête groupée : au-delà d'une quarantaine, l'URL devient
 * assez longue pour qu'un intermédiaire la rejette (cf. getVideosDesReunions).
 */
const ORGANES_PAR_LOT = 40;

/**
 * Plusieurs organes en une poignée de requêtes (`/organes/?uid=a,b,c`).
 *
 * Une fiche député compte des dizaines de mandats actifs (commissions,
 * groupes d'amitié…) : les demander un par un multipliait les allers-retours
 * vers l'API, et avec eux les chances de tomber sur une réponse lente.
 *
 * Les organes déjà connus viennent du cache mémoire de `getOrgane`, qu'on
 * alimente en retour. Un organe absent d'une réponse groupée (ou un lot en
 * échec) est redemandé individuellement : le résultat est le même qu'avec
 * `getOrgane`, uid par uid.
 */
export async function getOrganes(uids: (string | null | undefined)[]): Promise<Map<string, Organe | null>> {
  const demandes = [...new Set(uids.filter((uid): uid is string => !!uid))];
  let manquants = demandes.filter((uid) => !cache.has(uid));

  if (typeof window === "undefined" && manquants.length > 0) {
    const { getOrganesAN } = await import("./mongo/referentielAN");
    const trouves = await getOrganesAN(manquants);
    for (const [uid, organe] of trouves) cache.set(uid, Promise.resolve(organe));
    manquants = manquants.filter((uid) => !trouves.has(uid));
  }

  const lots: string[][] = [];
  for (let debut = 0; debut < manquants.length; debut += ORGANES_PAR_LOT) {
    lots.push(manquants.slice(debut, debut + ORGANES_PAR_LOT));
  }
  await Promise.all(
    lots.map(async (lot) => {
      try {
        const parametres = new URLSearchParams({ uid: lot.join(","), perPage: String(ORGANES_PAR_LOT) });
        const rep = await fetchTricoteuses(
          `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/organes/?${parametres}`,
          cacheTricoteuses("stable")
        );
        if (!rep.ok) return;
        const { data } = (await rep.json()) as { data?: Organe[] };
        for (const organe of data ?? []) {
          if (organe?.uid && lot.includes(organe.uid) && !cache.has(organe.uid)) {
            cache.set(organe.uid, Promise.resolve(organe));
          }
        }
      } catch (error) {
        console.warn("getOrganes: échec d'un lot, repli individuel", error);
      }
    })
  );

  const resultats = await Promise.all(demandes.map(async (uid) => [uid, await getOrgane(uid)] as const));
  return new Map(resultats);
}
