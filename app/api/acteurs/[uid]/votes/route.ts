import { NextResponse } from "next/server";
import { searchVote } from "@/data/searchVote";

/**
 * Votes d'un député (onglet « Votes »), paginés : notre base d'abord, l'API
 * Tricoteuses en repli. Paramètres : page, perPage, positionVote,
 * codeTypeVote (« SPS » : scrutins solennels), search.
 */
export async function GET(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!/^PA\d+$/.test(uid)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const parametres = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(parametres.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(50, Math.max(1, Number.parseInt(parametres.get("perPage") ?? "10", 10) || 10));
  const positionVote = parametres.get("positionVote") ?? "";
  const codeTypeVote = parametres.get("codeTypeVote") ?? "";
  const search = (parametres.get("search") ?? "").slice(0, 200);

  try {
    const { getVotesActeurAN } = await import("@/data/mongo/votesActeurAN");
    const resultat = await getVotesActeurAN(uid, { page, perPage, positionVote, codeTypeVote, search });
    return NextResponse.json(resultat, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch (erreur) {
    console.warn("Votes du député : lecture en base impossible, repli sur l'API", uid, erreur);
  }
  const resultat = await searchVote({
    page,
    perPage,
    acteurRefUid: uid,
    positionVote,
    search,
    include: "scrutinRef.dossierRef",
    codeTypeVote: codeTypeVote || undefined,
  });
  if (!resultat) return NextResponse.json({ error: "Votes indisponibles" }, { status: 503 });
  return NextResponse.json(resultat);
}
