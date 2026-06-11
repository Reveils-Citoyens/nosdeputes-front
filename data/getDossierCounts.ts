import * as React from "react";

/**
 * Returns the total number of amendments for a dossier (AN only).
 * Uses perPage=1 to minimise data transfer; total comes from the response header.
 */
async function getAmendementCountUnCached(dossierUid: string): Promise<number> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements?dossierRefUid=${dossierUid}&chambre=AN&perPage=1`
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
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/${dossierUid}?include=actesLegislatifs.voteRefs`
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
