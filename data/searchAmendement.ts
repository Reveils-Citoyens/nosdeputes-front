import { Amendement } from "@prisma/client";

interface SearchAmendementParams {
  /**
   * L'uid of the document sur le quel porte l'amendment.
   */
  documentRefUid: string;
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
  /**
   * L'uid of l'auteur de l'amendment.
   */
  acteurRefUid?: string;
  sortAmendement?: string;
}

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
): Promise<Amendement[] | null> {
  const {
    perPage = 10,
    page = 1,
    sort = "numeroOrdreDepot.asc",
    search = "",
    documentRefUid,
    acteurRefUid,
    sortAmendement,
  } = params;

  const searchParams = new URLSearchParams({
    perPage: perPage.toString(),
    page: page.toString(),
    sort,
  });

  if (search) {
    searchParams.set("search", search);
  }
  if (acteurRefUid) {
    searchParams.set("acteurRefUid", acteurRefUid);
  }
  if (sortAmendement) {
    searchParams.set("sortAmendement", sortAmendement);
  }
  if (documentRefUid) {
    searchParams.set("documentRefUid", documentRefUid);
  }
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements?${searchParams}`
    );

    const { data } = await rep.json();


    return data;
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return null;
  }
}
