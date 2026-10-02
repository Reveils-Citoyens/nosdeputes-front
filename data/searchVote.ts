import { Vote } from "@prisma/client";
import { PaginatedResponse, extractPaginationMetadata } from "./pagination";
import { cacheTricoteuses } from "./cacheTricoteuses";

interface SearchVoteParams {
  /**
   * @default 10
   */
  perPage?: number;
  /**
   * @default 0
   */
  page?: number;
  /**
   * @default "numeroOrdreDepot.asc"
   */
  sort?: string;
  include?: string;
  search?: string;
  acteurRefUid?: string;
  codeTypeVote?: string;
  scrutinRefUid?: string;
  causePositionVote?: string;
  positionVote?: string;
}

export async function searchVote(
  params: SearchVoteParams
): Promise<PaginatedResponse<Vote> | null> {
  // L'API ne sait ni chercher dans `/votes` (toute valeur de `search` y répond
  // 500) ni filtrer par type de vote (`codeTypeVote` y est ignoré) : ces deux
  // cas passent par la liste complète des votes du député.
  if (params.search?.trim() || params.codeTypeVote) return searchVoteFiltre(params);

  const {
    perPage = 10,
    page = 1,
    sort = "dateVote.desc",
    include,
    acteurRefUid,
    scrutinRefUid,
    causePositionVote,
    positionVote,
  } = params;

  const searchParams = new URLSearchParams({
    perPage: perPage.toString(),
    page: page.toString(),
    sort,
  });

  // autres filtres
  if (include) searchParams.set("include", include);
  if (acteurRefUid) searchParams.set("acteurRefUid", acteurRefUid);

  if (scrutinRefUid) searchParams.set("scrutinRefUid", scrutinRefUid);
  if (causePositionVote) searchParams.set("causePositionVote", causePositionVote);
  if (positionVote) searchParams.set("positionVote", positionVote);

  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/votes?${searchParams}`,
      cacheTricoteuses("activite")
    );

    if (!rep.ok) throw new Error(`HTTP ${rep.status}`);
    const { data } = await rep.json();

    data?.forEach(convertirDates);
    const pagination = extractPaginationMetadata(rep, page);

    return {
      data: data ?? [],
      pagination,
    };
  } catch (error) {
    console.error("Error fetching vote:", error);
    return null;
  }
}

function convertirDates(vote: any) {
  if (vote.dateVote) vote.dateVote = new Date(vote.dateVote);
  if (vote.scrutinRef?.dateScrutin) vote.scrutinRef.dateScrutin = new Date(vote.scrutinRef.dateScrutin);
}

type VoteLeger = Pick<Vote, "scrutinRefUid" | "positionVote"> & {
  dateVote: string | null;
  codeTypeVote?: string | null;
};

/**
 * Listes complètes déjà filtrées, par recherche : les pages suivantes ne
 * relisent que les détails des votes affichés. Les échecs ne sont pas gardés.
 */
const listesRecentes = new Map<string, Promise<VoteLeger[]>>();

/**
 * Votes d'un député filtrés par mots-clés et/ou par type de vote.
 *
 * 1. Tous les votes du député, réduits à quelques champs (~2 300 votes,
 *    ~200 Ko pour un député actif), filtrés par position côté API et par type
 *    ici ;
 * 2. avec une recherche, les uids de tous les scrutins correspondants
 *    (`/scrutins`, qui sait chercher), croisés avec la liste précédente ;
 * 3. les détails (scrutin, dossier) des seuls votes de la page affichée.
 *
 * Le total est exact, sans limite au nombre de scrutins correspondants.
 */
async function searchVoteFiltre(params: SearchVoteParams): Promise<PaginatedResponse<Vote> | null> {
  const { perPage = 10, page = 1, search = "", acteurRefUid, include, codeTypeVote, positionVote, causePositionVote } = params;
  const cle = JSON.stringify([search.trim(), acteurRefUid, codeTypeVote, positionVote, causePositionVote]);

  let liste = listesRecentes.get(cle);
  if (!liste) {
    liste = listerVotesFiltres(params);
    listesRecentes.set(cle, liste);
    liste.catch(() => listesRecentes.delete(cle));
    if (listesRecentes.size > 20) listesRecentes.delete(listesRecentes.keys().next().value!);
  }

  try {
    const votes = await liste;
    const debut = (page - 1) * perPage;
    const affiches = votes.slice(debut, debut + perPage);
    return {
      data: await detaillerVotes(affiches, acteurRefUid, include),
      pagination: {
        total: votes.length,
        totalPage: Math.ceil(votes.length / perPage),
        perPage,
        currentPage: page,
      },
    };
  } catch (error) {
    console.error("Error searching votes:", error);
    return null;
  }
}

/** Toutes les pages d'une liste de l'API (en-tête `total`), en une ou deux requêtes. */
async function lireTout<T>(chemin: string, parametres: URLSearchParams): Promise<T[]> {
  const parPage = 10000;
  const resultats: T[] = [];
  for (let page = 1; page <= 5; page++) {
    parametres.set("perPage", String(parPage));
    parametres.set("page", String(page));
    const rep = await fetch(`${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}${chemin}?${parametres}`, cacheTricoteuses("activite"));
    if (!rep.ok) throw new Error(`${chemin}: HTTP ${rep.status}`);
    const { data } = (await rep.json()) as { data?: T[] };
    resultats.push(...(data ?? []));
    const total = parseInt(rep.headers.get("total") || "0", 10);
    if (!data?.length || resultats.length >= total) return resultats;
  }
  throw new Error(`${chemin}: liste incomplète`);
}

async function listerVotesFiltres({
  search = "",
  acteurRefUid,
  codeTypeVote,
  positionVote,
  causePositionVote,
}: SearchVoteParams): Promise<VoteLeger[]> {
  const parametresVotes = new URLSearchParams({
    select: "scrutinRefUid,dateVote,positionVote,codeTypeVote",
    sort: "dateVote.desc",
  });
  if (acteurRefUid) parametresVotes.set("acteurRefUid", acteurRefUid);
  if (positionVote) parametresVotes.set("positionVote", positionVote);
  if (causePositionVote) parametresVotes.set("causePositionVote", causePositionVote);

  const q = search.trim();
  const [votes, scrutins] = await Promise.all([
    lireTout<VoteLeger>("/votes", parametresVotes),
    q ? lireTout<{ uid: string }>("/scrutins", new URLSearchParams({ search: q, select: "uid" })) : null,
  ]);

  const correspondants = scrutins ? new Set(scrutins.map((scrutin) => scrutin.uid)) : null;
  return votes.filter(
    (vote) =>
      (!codeTypeVote || vote.codeTypeVote === codeTypeVote) &&
      (!correspondants || (!!vote.scrutinRefUid && correspondants.has(vote.scrutinRefUid)))
  );
}

/** Détails des votes affichés, dans l'ordre de la liste. */
async function detaillerVotes(
  affiches: VoteLeger[],
  acteurRefUid: string | undefined,
  include: string | undefined
): Promise<Vote[]> {
  if (affiches.length === 0) return [];
  const parametres = new URLSearchParams({
    scrutinRefUid: affiches.map((vote) => vote.scrutinRefUid).join(","),
    perPage: String(affiches.length),
  });
  if (acteurRefUid) parametres.set("acteurRefUid", acteurRefUid);
  if (include) parametres.set("include", include);
  const rep = await fetch(`${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/votes?${parametres}`, cacheTricoteuses("activite"));
  if (!rep.ok) throw new Error(`votes: HTTP ${rep.status}`);
  const { data } = (await rep.json()) as { data?: Vote[] };
  const parScrutin = new Map((data ?? []).map((vote) => [vote.scrutinRefUid, vote]));
  const votes = affiches.map((vote) => parScrutin.get(vote.scrutinRefUid)).filter((vote): vote is Vote => !!vote);
  votes.forEach(convertirDates);
  return votes;
}
