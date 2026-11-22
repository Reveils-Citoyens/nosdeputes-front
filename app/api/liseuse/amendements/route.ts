import { NextRequest, NextResponse } from "next/server";
import { startServerTiming } from "@/lib/serverTiming";
import { DELAI_TRICOTEUSES_LISTE_MS, fetchTricoteuses } from "@/lib/fetchTricoteuses";

const MAX_PER_PAGE = 500;

export async function GET(req: NextRequest) {
  const finishTiming = startServerTiming("liseuse-metadata");
  const sp = req.nextUrl.searchParams;
  const documentRefUid = sp.get("documentRefUid");
  if (!documentRefUid) {
    return NextResponse.json({ error: "documentRefUid required" }, { status: 400 });
  }

  const requestedPerPage = Number(sp.get("perPage") ?? "200");
  const requestedPage = Number(sp.get("page") ?? "1");
  if (!Number.isSafeInteger(requestedPerPage) || requestedPerPage < 1 ||
      !Number.isSafeInteger(requestedPage) || requestedPage < 1) {
    return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
  }
  const perPage = Math.min(requestedPerPage, MAX_PER_PAGE);
  const page = requestedPage;

  const apiUrl = new URL(`${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements`);
  apiUrl.searchParams.set("documentRefUid", documentRefUid);
  apiUrl.searchParams.set("chambre", "AN");
  apiUrl.searchParams.set("perPage", String(perPage));
  apiUrl.searchParams.set("page", String(page));
  apiUrl.searchParams.set("sort", "numeroOrdreDepot.asc");
  if (sp.get("compact") === "1") {
    // Tous les champs utilisés par les filtres, compteurs, navigation et
    // cartes. Le dispositif/exposé n'est nécessaire qu'à l'ouverture.
    apiUrl.searchParams.set("select", "uid,numeroLong,sortAmendement,typeAuteur,identifiantDivision,divisionArticleAdditionnel,acteurRefUid,nombreCoSignataires,dateDepot,dateSort,scrutinRefUid,idDiscussionIdentique");
  }

  // Mode compact (la liseuse) : notre base d'abord, sans dépendre de l'API ni
  // de sa lenteur. L'API reste le repli pour un texte que nous n'avons pas.
  if (sp.get("compact") === "1") {
    try {
      const { getAmendementsTexteAN } = await import("@/data/mongo/amendementsAN");
      const depuisBase = await getAmendementsTexteAN(documentRefUid, page, perPage);
      if (depuisBase) {
        return NextResponse.json(
          { items: depuisBase.items, total: depuisBase.total, totalIsKnown: true },
          { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300", "Server-Timing": finishTiming() } }
        );
      }
    } catch (e) {
      console.warn("[liseuse/amendements] lecture de la base impossible, repli sur l'API", e);
    }
  }

  try {
    // Mise en cache 5 minutes (comme les scrutins de la liseuse) : les visites
    // suivantes ne repaient pas la requête, et une lenteur passagère de l'API
    // est masquée par la dernière réponse réussie.
    const res = await fetchTricoteuses(
      apiUrl.toString(),
      { next: { revalidate: 300 } },
      DELAI_TRICOTEUSES_LISTE_MS
    );
    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
    const body = await res.json();
    const items: unknown[] = body.data ?? [];
    if (!Array.isArray(items)) throw new Error("Invalid amendment list");
    const headerTotal =
      parseInt(res.headers.get("total") ?? "0", 10) ||
      parseInt(res.headers.get("x-total") ?? "0", 10) ||
      parseInt(res.headers.get("x-count") ?? "0", 10) ||
      (body.total as number) ||
      0;
    // Quand l'API ne renvoie pas de total, on sait au moins qu'il y en a
    // potentiellement plus si on a reçu exactement perPage résultats.
    const total = headerTotal || (items.length >= perPage ? perPage + 1 : items.length);

    return NextResponse.json(
      { items, total, totalIsKnown: headerTotal > 0 || items.length < perPage },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300", "Server-Timing": finishTiming() } }
    );
  } catch (e) {
    console.error("[liseuse/amendements]", e);
    return NextResponse.json({ items: [], total: 0 }, { status: 500 });
  }
}
