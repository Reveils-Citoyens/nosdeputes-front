import { NextRequest, NextResponse } from "next/server";

const MAX_PER_PAGE = 500;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const documentRefUid = sp.get("documentRefUid");
  if (!documentRefUid) {
    return NextResponse.json({ error: "documentRefUid required" }, { status: 400 });
  }

  const perPage = Math.min(parseInt(sp.get("perPage") ?? "200", 10), MAX_PER_PAGE);
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10));

  const apiUrl = new URL(`${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements`);
  apiUrl.searchParams.set("documentRefUid", documentRefUid);
  apiUrl.searchParams.set("chambre", "AN");
  apiUrl.searchParams.set("perPage", String(perPage));
  apiUrl.searchParams.set("page", String(page));
  apiUrl.searchParams.set("sort", "numeroOrdreDepot.asc");

  try {
    const res = await fetch(apiUrl.toString(), { next: { revalidate: 60 } });
    const body = await res.json();
    const items: unknown[] = body.data ?? [];
    const headerTotal =
      parseInt(res.headers.get("x-total") ?? "0", 10) ||
      parseInt(res.headers.get("x-count") ?? "0", 10) ||
      (body.total as number) ||
      0;
    // Quand l'API ne renvoie pas de total, on sait au moins qu'il y en a
    // potentiellement plus si on a reçu exactement perPage résultats.
    const total = headerTotal || (items.length >= perPage ? perPage + 1 : items.length);

    return NextResponse.json(
      { items, total },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (e) {
    console.error("[liseuse/amendements]", e);
    return NextResponse.json({ items: [], total: 0 }, { status: 500 });
  }
}
