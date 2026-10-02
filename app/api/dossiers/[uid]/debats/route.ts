import { NextResponse } from "next/server";
import { getDebats } from "@/data/getDebats";
import { startServerTiming } from "@/lib/serverTiming";

export async function GET(_request: Request, { params }: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const finishTiming = startServerTiming("debats-metadata");
  if (!/^DLR\d+L\d+N\d+$/.test(uid)) {
    return NextResponse.json({ error: "Invalid dossier UID" }, { status: 400 });
  }
  const items = await getDebats(uid);
  if (items === null) {
    return NextResponse.json({ error: "Debates unavailable" }, { status: 502 });
  }
  // Pas de cache CDN d'une agrégation potentiellement partielle.
  return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store", "Server-Timing": finishTiming() } });
}
