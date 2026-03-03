import { Acteur } from "@prisma/client";

export async function searchActeur(
  search: string,
  perPage = 5
): Promise<Acteur[]> {
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
    return data as Acteur[];
  } catch (error) {
    console.error("Error fetching acteurs by name:", error);
    return [];
  }
}
