import { NextRequest, NextResponse } from "next/server";
import { buildSommaireUrl, getDocumentSommaire } from "@/data/getDocumentSommaire";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) return NextResponse.json({ error: "uid required" }, { status: 400 });
  if (!buildSommaireUrl(uid)) return NextResponse.json({ articles: null });

  const articles = await getDocumentSommaire(uid);
  return NextResponse.json(
    { articles },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
