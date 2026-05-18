import { NextRequest, NextResponse } from "next/server";
import { searchDossierParTitre } from "@/data/mongo/searchDossierParTitre";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await searchDossierParTitre(q, { limit: 5 });

  return NextResponse.json(results);
}
