import * as React from "react";
import type { Mandat } from "@prisma/client";

/**
 * Quand un député est nommé au gouvernement, son `mandatPrincipal` côté API
 * Tricoteuses pointe vers son mandat de ministre (typeOrgane === "GOUVERNEMENT"),
 * sa `urlImage` devient la marianne, et `numCirco`/`numDepartement` sont null.
 *
 * Ce helper :
 *   - détecte ces cas (renvoie `auGouvernement: true`)
 *   - récupère le mandat ASSEMBLEE actif du député et l'utilise comme
 *     mandatPrincipal pour récupérer la vraie circonscription
 *   - remplace l'avatar marianne.webp par l'URL de photo standard
 *
 * Le mandat de député est juste suspendu pendant le mandat ministériel
 * (article 23 de la Constitution), pas terminé — d'où la nécessité de
 * conserver les infos de circonscription.
 */

type ActeurMinimal = {
  uid: string;
  urlImage: string | null;
  mandatPrincipal: Mandat | null;
};

export type AuGouvernementEnrichment = {
  auGouvernement: boolean;
};

function deputePhotoUrl(uid: string): string {
  return `https://tricoteuses-assets.s3.fr-par.scw.cloud/photos/${uid.replace(/^PA/, "")}_124x124.jpg`;
}

async function fetchActiveAssembleeMandat(acteurUid: string): Promise<Mandat | null> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/mandats?acteurRefUid=${acteurUid}&perPage=100`,
    );
    if (!rep.ok) return null;
    const { data } = (await rep.json()) as { data: Mandat[] };
    return (
      data.find(
        (m) => m.typeOrgane === "ASSEMBLEE" && m.dateFin === null,
      ) ?? null
    );
  } catch {
    return null;
  }
}

const fetchActiveAssembleeMandatCached = React.cache(fetchActiveAssembleeMandat);

/**
 * Enrichit un acteur avec un flag `auGouvernement` et corrige son
 * `mandatPrincipal` + `urlImage` si nécessaire.
 */
export async function resolveAuGouvernement<T extends ActeurMinimal>(
  acteur: T,
): Promise<T & AuGouvernementEnrichment> {
  const auGouvernement = acteur.mandatPrincipal?.typeOrgane === "GOUVERNEMENT";
  if (!auGouvernement) {
    return { ...acteur, auGouvernement: false };
  }

  const assembleeMandat = await fetchActiveAssembleeMandatCached(acteur.uid);

  return {
    ...acteur,
    mandatPrincipal: assembleeMandat ?? acteur.mandatPrincipal,
    urlImage: deputePhotoUrl(acteur.uid),
    auGouvernement: true,
  };
}

/**
 * Version batch pour enrichir une liste d'acteurs. Les fetchs vers /mandats
 * sont parallélisés.
 */
export async function resolveAuGouvernementBatch<T extends ActeurMinimal>(
  acteurs: T[],
): Promise<(T & AuGouvernementEnrichment)[]> {
  return Promise.all(acteurs.map(resolveAuGouvernement));
}
