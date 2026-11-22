import { NextResponse } from "next/server";
import { getDocument } from "@/data/getDocument";

/**
 * Un document législatif, pour les composants exécutés dans le navigateur
 * (chronologie, filtres des amendements) : ils ne peuvent pas lire la base, et
 * interroger directement l'API Tricoteuses les exposait à sa lenteur.
 */
export async function GET(request: Request) {
  const uid = new URL(request.url).searchParams.get("uid");
  if (!uid || !/^[A-Za-z0-9-]{4,40}$/.test(uid)) {
    return NextResponse.json({ error: "Paramètre uid invalide" }, { status: 400 });
  }
  const data = await getDocument(uid);
  if (!data) return NextResponse.json({ data: null }, { status: 404 });
  return NextResponse.json(
    { data },
    // Le nombre d'amendements évolue pendant l'examen d'un texte : cache court.
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } }
  );
}
