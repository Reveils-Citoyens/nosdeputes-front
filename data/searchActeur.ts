import { Prisma } from "@prisma/client";

export type ActeurWithGroupe = Prisma.ActeurGetPayload<{
  include: { groupeParlementaire: true };
}>;

export async function searchActeur(
  search: string,
  perPage = 5
): Promise<ActeurWithGroupe[]> {
  const params = new URLSearchParams({
    search,
    prefixSearch: "true",
    chambre: "AN",
    actif: "true",
    perPage: String(perPage),
    searchLanguage: "french",
    include: "groupeParlementaire",
  });

  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/acteurs/?${params}`
    );
    const { data } = await rep.json();
    return data as ActeurWithGroupe[];
  } catch (error) {
    console.error("Error fetching acteurs by name:", error);
    return [];
  }
}
