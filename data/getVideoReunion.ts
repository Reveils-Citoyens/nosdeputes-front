import * as React from "react";

import {
  CHAMPS_VIDEO as CHAMPS,
  versVideo,
  type ReunionApi,
  type Video,
} from "./prisesDeParoleVideo";

/**
 * Liens vidéo d'une réunion (type `Video`, défini avec les règles de sélection
 * des prises de parole pour être partagé avec le précalcul nocturne).
 *
 * Ces liens ne sont pas dans les jeux de données que nous ingérons — la
 * collection `reunions` de MongoDB ne porte aucun champ vidéo. Ils sont résolus
 * par Tricoteuses, qui apparie chaque réunion à son média. On les lit donc à la
 * demande plutôt que de porter un moissonneur de plus.
 */
export type { Video };

const API = process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL;

async function getVideoReunionUnCached(
  reunionUid: string | null | undefined
): Promise<Video | null> {
  if (!reunionUid) return null;

  try {
    const reponse = await fetch(
      `${API}/reunions/${reunionUid}?select=${CHAMPS}`,
      { next: { revalidate: 86400 } }
    );
    if (!reponse.ok) return null;

    const { data } = await reponse.json();
    return versVideo(data);
  } catch (error) {
    console.error("Error fetching video réunion:", error);
    return null;
  }
}

export const getVideoReunion = React.cache(getVideoReunionUnCached);

/**
 * Réunion à laquelle se rattache un compte rendu.
 *
 * Le compte rendu ne porte pas les liens vidéo, la réunion si : il faut ce
 * saut pour passer d'une page de transcription à sa captation.
 */
async function getReunionDuCompteRenduUnCached(
  compteRenduUid: string | null | undefined
): Promise<string | null> {
  if (!compteRenduUid) return null;
  try {
    const reponse = await fetch(
      `${API}/debats/${compteRenduUid}?select=uid,reunionRefUid`,
      { next: { revalidate: 86400 } }
    );
    if (!reponse.ok) return null;
    const { data } = await reponse.json();
    return data?.reunionRefUid ?? null;
  } catch (error) {
    console.error("Error fetching réunion du compte rendu:", error);
    return null;
  }
}

export const getReunionDuCompteRendu = React.cache(
  getReunionDuCompteRenduUnCached
);

/** Vidéo associée à un compte rendu, en passant par sa réunion. */
export const getVideoDuCompteRendu = React.cache(
  async (compteRenduUid: string | null | undefined): Promise<Video | null> =>
    getVideoReunion(await getReunionDuCompteRendu(compteRenduUid))
);

/**
 * Nombre d'uids par requête groupée.
 *
 * Le filtre `uid=a,b,c` de l'API accepte une liste, mais un uid de réunion fait
 * 23 caractères : au-delà d'une quarantaine, l'URL devient assez longue pour
 * qu'un intermédiaire la rejette. Découper coûte une requête de plus, pas une
 * page blanche.
 */
const PAR_LOT = 40;

/**
 * Vidéos de plusieurs réunions, en une poignée de requêtes.
 *
 * Une commission d'enquête tient des dizaines d'auditions ; interroger l'API
 * réunion par réunion depuis la liste ferait autant d'allers-retours avant le
 * premier octet rendu.
 *
 * Les réunions sans vidéo sont simplement absentes du résultat.
 */
async function getVideosDesReunionsUnCached(
  reunionUids: string[]
): Promise<Record<string, Video>> {
  const uids = [...new Set(reunionUids.filter(Boolean))];
  if (uids.length === 0) return {};

  const lots: string[][] = [];
  for (let debut = 0; debut < uids.length; debut += PAR_LOT) {
    lots.push(uids.slice(debut, debut + PAR_LOT));
  }

  try {
    const reponses = await Promise.all(
      lots.map(async (lot) => {
        const parametres = new URLSearchParams({
          uid: lot.join(","),
          perPage: String(PAR_LOT),
          select: CHAMPS,
        });
        const reponse = await fetch(`${API}/reunions/?${parametres}`, {
          next: { revalidate: 86400 },
        });
        if (!reponse.ok) return [];
        const { data } = await reponse.json();
        return Array.isArray(data) ? (data as ReunionApi[]) : [];
      })
    );

    const parReunion: Record<string, Video> = {};
    for (const ligne of reponses.flat()) {
      const video = versVideo(ligne);
      if (video && ligne.uid) parReunion[ligne.uid] = video;
    }
    return parReunion;
  } catch (error) {
    console.error("Error fetching vidéos des réunions:", error);
    return {};
  }
}

export const getVideosDesReunions = React.cache(getVideosDesReunionsUnCached);
