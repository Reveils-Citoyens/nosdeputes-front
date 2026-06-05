import { NextRequest, NextResponse } from "next/server";
import { searchInterventions } from "@/data/searchInterventions";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  if (q.length < 5) return NextResponse.json({ items: [], total: 0 });

  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(20, Math.max(1, parseInt(sp.get("perPage") ?? "10", 10) || 10));

  const result = await searchInterventions(q, { page, perPage });
  return NextResponse.json(result);
}
