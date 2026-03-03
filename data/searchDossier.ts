import { Dossier } from "@prisma/client";
import { parseDossier } from "./parsers/parseDossier";
import { PaginatedResponse, extractPaginationMetadata } from "./pagination";

interface SearchDossierParams {
  /**
   * @default 10
   */
  perPage?: number;
  /**
   * @default 0
   */
  page?: number;
  /**
   * @default 'dateDernierActe.desc'
   */
  sort?: string;
  /**
   * @default ""
   */
  search?: string;
  include?: string;
  codeProcedure?: string;
  acteurPrincipalRefUid?: string;
}

export async function searchDossier(
  params: SearchDossierParams
): Promise<PaginatedResponse<Dossier> | null> {
  const {
    perPage = 10,
    page = 1,
    sort = "dateDernierActe.desc",
    search = "",
    codeProcedure = "",
    include,
    acteurPrincipalRefUid,
  } = params;

  const searchParams = new URLSearchParams({
    perPage: perPage.toString(),
    page: page.toString(),
    sort,
    dataset: "17",
    prefixSearch: "true",
    searchLanguage: "french",
  });

  Object.entries({
    search,
    include,
    acteurPrincipalRefUid,
    codeProcedure,
  }).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/?${searchParams}`
    );

    const { data } = await rep.json();

    // Transforms all the "yyy-mm-dd" string into Date objects.
    data.forEach(parseDossier);

    const pagination = extractPaginationMetadata(rep, page);

    return {
      data,
      pagination,
    };
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return null;
  }
}
