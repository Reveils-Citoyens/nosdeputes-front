import { NextRequest, NextResponse } from "next/server";
import { searchDossierParTitre } from "@/data/mongo/searchDossierParTitre";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";

  if (!q || q.length < 5) {
    return NextResponse.json({ items: [], total: 0 });
  }

  const limit = Math.min(parseInt(sp.get("limit") ?? "5", 10) || 5, 20);
  const skip = Math.max(parseInt(sp.get("skip") ?? "0", 10) || 0, 0);
  const legislature = sp.get("legislature") ?? "17";
  const sort = sp.get("sort") === "date" ? "date" : "relevance";
  const codeProcedure = sp.get("codeProcedure") ?? undefined;
  const badge = sp.get("badge") ?? undefined;

  try {
    // Pour la navbar/home (pas de skip), on continue de renvoyer juste le tableau
    // pour rétrocompatibilité. Avec skip/limit explicites on renvoie { items, total }.
    const result = await searchDossierParTitre(q, { limit, skip, legislature, sort, codeProcedure, badge });

    if (skip === 0 && !sp.has("skip")) {
      // Rétrocompatibilité : navbar et SearchBar attendent un tableau plat
      return NextResponse.json(result.items);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("searchDossiers error:", err);
    if (skip === 0 && !sp.has("skip")) return NextResponse.json([]);
    return NextResponse.json({ items: [], total: 0 }, { status: 500 });
  }
}
