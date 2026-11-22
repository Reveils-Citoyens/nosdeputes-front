import { NextResponse } from "next/server";
import { getDossierVotesSummary } from "@/data/getDossierVotesSummary";

/**
 * Résumé des votes d'un dossier (actes et scrutins rattachés), pour la
 * chronologie, qui s'exécute dans le navigateur : elle interrogeait
 * directement l'API Tricoteuses, sans cache ni délai maximal.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!/^[A-Za-z0-9-]{4,40}$/.test(uid)) {
    return NextResponse.json({ error: "Identifiant de dossier invalide" }, { status: 400 });
  }
  const resume = await getDossierVotesSummary(uid);
  if (!resume) return NextResponse.json({ error: "Votes indisponibles" }, { status: 502 });
  return NextResponse.json(resume, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
