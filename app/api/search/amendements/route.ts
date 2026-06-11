import { NextRequest, NextResponse } from "next/server";
import { searchAmendementMongo } from "@/data/mongo/searchAmendementMongo";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const legislature = request.nextUrl.searchParams.get("legislature")?.trim() || "17";
  const skip = parseInt(request.nextUrl.searchParams.get("skip") ?? "0", 10);
  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "5", 10);
  const sort =
    request.nextUrl.searchParams.get("sort") === "date" ? "date" : "relevance";

  if (q.length < 5) {
    return NextResponse.json({ items: [], total: 0 });
  }

  const result = await searchAmendementMongo(q, {
    limit: Math.min(Math.max(limit, 1), 20),
    skip: Math.max(skip, 0),
    legislature,
    sort,
  });
  return NextResponse.json(result);
}
