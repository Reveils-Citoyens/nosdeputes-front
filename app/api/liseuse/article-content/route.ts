import { NextRequest, NextResponse } from "next/server";
import { getArticleContent } from "@/data/getArticleContent";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const uid = sp.get("uid");
  const key = sp.get("key");

  if (!uid || !key) {
    return NextResponse.json({ error: "uid and key required" }, { status: 400 });
  }

  const alineas = await getArticleContent(uid, key);
  // En cas d'échec (alineas null — souvent une indisponibilité transitoire de
  // git.tricoteuses), on ne fige PAS la réponse 24h : cache très court pour
  // permettre une nouvelle tentative rapide. Succès → cache long.
  const cacheControl = alineas
    ? "public, s-maxage=86400, stale-while-revalidate=604800"
    : "public, s-maxage=15";
  return NextResponse.json({ alineas }, { headers: { "Cache-Control": cacheControl } });
}
