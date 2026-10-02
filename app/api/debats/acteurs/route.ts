import { NextResponse } from "next/server";
import { getDebateActeurs } from "@/data/getDebateActeurs";

export async function GET(request: Request) {
  const uids = new URL(request.url).searchParams.get("uids")?.split(",") ?? [];
  if (uids.length === 0 || uids.length > 50 || uids.some((uid) => !/^PA\d+$/.test(uid))) {
    return NextResponse.json({ error: "Invalid actor UIDs" }, { status: 400 });
  }
  const items = await getDebateActeurs(uids);
  // Les acteurs manquants pourront être réessayés côté client ; pas de cache
  // d'une réponse partielle au niveau du CDN.
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
}
