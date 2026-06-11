import { Dossier } from "@prisma/client";
import { parseDossier } from "./parsers/parseDossier";
import { PaginatedResponse, extractPaginationMetadata } from "./pagination";

interface SearchDossierParams {
  /**
   * @default 10
   */
  perPage?: number;
  /**
   * @default 1
   * L'API Tricoteuses utilise une pagination 1-based : page=0 renvoie HTTP 400.
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
    chambre: "AN",
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

    if (!rep.ok) {
      console.error(
        `searchDossier: HTTP ${rep.status} ${rep.statusText} for ${rep.url}`
      );
      return null;
    }

    const body = await rep.json();
    const data: Dossier[] = Array.isArray(body?.data) ? body.data : [];

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
