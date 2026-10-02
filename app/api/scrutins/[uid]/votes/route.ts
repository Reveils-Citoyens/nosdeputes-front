import { NextResponse } from "next/server";
import { getScrutinVotes } from "@/data/getScrutinVotes";
import { startServerTiming } from "@/lib/serverTiming";

export async function GET(_request: Request, { params }: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const finishTiming = startServerTiming("votes-detail");
  if (!/^[A-Z][A-Z0-9]{2,127}$/.test(uid)) {
    return NextResponse.json({ error: "Invalid scrutin UID" }, { status: 400 });
  }
  try {
    // Conserver tous les votes, y compris non-votants et délégations. Seuls
    // les profils destinés à l'affichage sont allégés.
    const votes = await getScrutinVotes(uid);
    return NextResponse.json({ votes }, { headers: { "Cache-Control": "no-store", "Server-Timing": finishTiming() } });
  } catch {
    return NextResponse.json({ error: "Votes unavailable" }, { status: 502 });
  }
}
