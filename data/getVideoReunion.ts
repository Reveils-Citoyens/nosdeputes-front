import * as React from "react";

/**
 * Liens vidéo d'une réunion : le flux HLS et la page du portail de l'Assemblée.
 *
 * Ces liens ne sont pas dans les jeux de données que nous ingérons — la
 * collection `reunions` de MongoDB ne porte aucun champ vidéo. Ils sont résolus
 * par Tricoteuses, qui apparie chaque réunion à son média. On les lit donc à la
 * demande plutôt que de porter un moissonneur de plus.
 *
 * ⚠️ L'archive du diffuseur ne conserve qu'environ l'année en cours : passé ce
 * délai le flux répond 404 alors que `page` reste accessible. Le lecteur bascule
 * seul sur le lien, encore faut-il le lui fournir.
 */
export type Video = {
  /** Flux HLS, lisible dans le navigateur. */
  flux: string | null;
  /** Page de la vidéo sur le site de l'Assemblée, qui survit à l'archivage. */
  page: string | null;
  /**
   * Seconde à laquelle les débats commencent réellement.
   *
   * La captation démarre avant l'ouverture : sur une réunion de commission,
   * l'écart va de quelques secondes à plus d'une demi-heure de salle vide.
   * Ouvrir la vidéo à zéro donne l'impression d'un lecteur cassé.
   */
  secondeDebut: number | null;
};

const API = process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL;
const CHAMPS = "uid,urlVideo,urlPageVideo,timecodeDebutVideo";

/** Réunion telle que l'API la rend, réduite aux champs vidéo. */
type ReunionApi = {
  uid?: string;
  urlVideo?: string | null;
  urlPageVideo?: string | null;
  timecodeDebutVideo?: number | null;
};

/** Une réunion telle que l'API la rend → notre type, ou null si sans vidéo. */
function versVideo(donnees: ReunionApi | null | undefined): Video | null {
  if (!donnees?.urlVideo && !donnees?.urlPageVideo) return null;
  return {
    flux: donnees.urlVideo ?? null,
    page: donnees.urlPageVideo ?? null,
    secondeDebut: donnees.timecodeDebutVideo ?? null,
  };
}

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
