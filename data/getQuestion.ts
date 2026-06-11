import * as React from "react";
import { Question, Organe } from "@prisma/client";
import { getOrgane } from "./getOrgane";
import { extractPaginationMetadata, PaginatedResponse } from "./pagination";

type GetQuestionsParams = {
  perPage?: number;
  page?: number;
  sort?: string;
  search?: string;
}

async function getQuestionsUnCached(
  acteurUid: string,
  params: GetQuestionsParams
): Promise<PaginatedResponse<ReturnedGetQuestion>> {

  const {
    perPage = 10,
    page = 1,
    sort = "dateDepot.desc",
    search,
  } = params
  try {
    if (acteurUid === "") {
      return { data: [], pagination: { total: 0, totalPage: 0, perPage: 0, currentPage: 0 } };
    }

    const searchParams = new URLSearchParams({
      acteurRefUid: acteurUid,
      perPage: perPage.toString(),
      page: page.toString(),
      sort,
      dataset: "17",
    });
    if (search) {
      searchParams.set("search", search);
    }

    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/questions/?${searchParams.toString()}`
    );

    const pagination = extractPaginationMetadata(rep, page);
    const { data } = (await rep.json()) as { data: Question[] };

    const groupes = await Promise.all(
      data.map(async (item) =>
        item.minIntRefUid === null ? null : await getOrgane(item.minIntRefUid)
      )
    );

    return {
      data: data.map((item, index) => ({
        ...item,
        dateCloture: item.dateCloture ? new Date(item.dateCloture) : null,
        dateDepotSignal: item.dateDepotSignal
          ? new Date(item.dateDepotSignal)
          : null,
        dateDepot: item.dateDepot ? new Date(item.dateDepot) : null,
        dateMaj: new Date(item.dateMaj),
        ministerInteroge: groupes[index],
      })),
      pagination
    };
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return { data: [], pagination: { total: 0, totalPage: 0, perPage: 0, currentPage: 0 } };
  }
}

export type ReturnedGetQuestion = Question & {
  ministerInteroge: Organe | null;
};

export const getQuestions = React.cache(getQuestionsUnCached);
