import { Amendement, Dossier } from "@prisma/client";
import { PaginatedResponse, extractPaginationMetadata } from "./pagination";

export type AmendementWithDossierRef = Amendement & {
  dossierRef?: Dossier | null;
};

type SearchAmendementParams = {
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
  search?: string;
  sortAmendement?: string;
  include?: string;
} & (
  | {
      /**
       * L'uid of the document sur le quel porte l'amendment.
       */
      documentRefUid: string;
      /**
       * L'uid of l'auteur de l'amendment.
       */
      acteurRefUid?: string;
      /**
       * L'uid du dossier associé à l'amendement.
       */
      dossierUid?: string;
    }
  | {
      /**
       * L'uid of the document sur le quel porte l'amendment.
       */
      documentRefUid?: string;
      /**
       * L'uid of l'auteur de l'amendment.
       */
      acteurRefUid: string;
      /**
       * L'uid du dossier associé à l'amendement.
       */
      dossierUid?: string;
    }
  | {
      /**
       * L'uid of the document sur le quel porte l'amendment.
       */
      documentRefUid?: string;
      /**
       * L'uid of l'auteur de l'amendment.
       */
      acteurRefUid?: string;
      /**
       * L'uid du dossier associé à l'amendement.
       */
      dossierUid: string;
    }
);

export const sortAmendementPossible = [
  "A discuter",
  "Adopté",
  "effacé",
  "En traitement",
  "Irrecevable",
  "Irrecevable 40",
  "Non soutenu",
  "Rejeté",
  "Retiré",
  "Satisfait ou sans objet",
  "Tombé",
] as const;

export async function searchAmendement(
  params: SearchAmendementParams
): Promise<PaginatedResponse<Amendement> | null> {
  const {
    perPage = 10,
    page = 1,
    sort = "numeroOrdreDepot.asc",
    search = "",
    dossierUid,
    documentRefUid,
    acteurRefUid,
    sortAmendement,
    include
  } = params;

  const searchParams = new URLSearchParams({
    perPage: perPage.toString(),
    page: page.toString(),
    sort,
    chambre: "AN",
  });

  if (search) {
    searchParams.set("search", search);
  }
  if (acteurRefUid) {
    searchParams.set("acteurRefUid", acteurRefUid);
  }
  if (dossierUid) {
    searchParams.set("dossierRefUid", dossierUid);
  }
  if (sortAmendement) {
    searchParams.set("sortAmendement", sortAmendement);
  }
  if (documentRefUid) {
    searchParams.set("documentRefUid", documentRefUid);
  }
  if (include) {
    searchParams.set("include", include);
  }
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements?${searchParams}`
    );

    const { data } = await rep.json();

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
