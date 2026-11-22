import * as React from "react";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

/**
 * Returns the total number of amendments for a dossier (AN only).
 * Uses perPage=1 to minimise data transfer; total comes from the response header.
 */
/**
 * Compteurs calculés dans notre base (cf. data/mongo/referentielAN.ts), une
 * seule fois par rendu pour les deux. `null` : dossier absent de la base, on
 * interroge alors l'API.
 */
const compteursBase = React.cache(async (dossierUid: string) => {
  const { getCompteursDossierAN } = await import("./mongo/referentielAN");
  return getCompteursDossierAN(dossierUid);
});

async function getAmendementCountUnCached(dossierUid: string): Promise<number> {
  const depuisBase = await compteursBase(dossierUid);
  if (depuisBase) return depuisBase.amendements;
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements?dossierRefUid=${dossierUid}&chambre=AN&perPage=1`,
      { next: { revalidate: 60 } }
    );
    if (!rep.ok) return 0;
    return parseInt(rep.headers.get("total") ?? "0", 10);
  } catch {
    return 0;
  }
}

/**
 * Returns the total number of scrutins (votes) attached to a dossier.
 * Fetches only actesLegislatifs.voteRefs (no deep include) and counts non-empty refs.
 */
async function getScrutinCountUnCached(dossierUid: string): Promise<number> {
  const depuisBase = await compteursBase(dossierUid);
  if (depuisBase) return depuisBase.scrutins;
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/${dossierUid}?include=actesLegislatifs.voteRefs`,
      { next: { revalidate: 60 } }
    );
    if (!rep.ok) return 0;
    const { data } = await rep.json();
    if (!data?.actesLegislatifs) return 0;
    return (data.actesLegislatifs as { voteRefs?: unknown[] }[]).reduce(
      (sum, acte) => sum + (acte.voteRefs?.length ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

export const getAmendementCount = React.cache(getAmendementCountUnCached);
export const getScrutinCount = React.cache(getScrutinCountUnCached);
