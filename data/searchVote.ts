import { Vote } from "@prisma/client";
import { PaginatedResponse, extractPaginationMetadata } from "./pagination";

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
  const {
    perPage = 10,
    page = 1,
    sort = "dateVote.desc",
    search = "",
    include,
    acteurRefUid,
    codeTypeVote,
    scrutinRefUid,
    causePositionVote,
    positionVote,
  } = params;

  const searchParams = new URLSearchParams({
    perPage: perPage.toString(),
    page: page.toString(),
    sort,
  });

  if (search) {
    searchParams.set("search", search);
  }

  // autres filtres
  if (include) searchParams.set("include", include);
  if (acteurRefUid) searchParams.set("acteurRefUid", acteurRefUid);

  // filtre pour les votes solennels (SPS) ou autres
  if (codeTypeVote) searchParams.set("codeTypeVote", codeTypeVote);

  if (scrutinRefUid) searchParams.set("scrutinRefUid", scrutinRefUid);
  if (causePositionVote) searchParams.set("causePositionVote", causePositionVote);
  if (positionVote) searchParams.set("positionVote", positionVote);

  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/votes?${searchParams}`
    );

    const { data } = await rep.json();

    data?.forEach((vote: any) => {
      if (vote.dateVote) { vote.dateVote = new Date(vote.dateVote); }
      if (vote.scrutinRef?.dateScrutin) { vote.scrutinRef.dateScrutin = new Date(vote.scrutinRef.dateScrutin); }
    })
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
