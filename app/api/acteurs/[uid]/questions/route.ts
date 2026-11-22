import { NextResponse } from "next/server";
import { getQuestions } from "@/data/getQuestion";

/**
 * Questions d'un député (onglet « Questions »), paginées : notre base
 * d'abord, l'API Tricoteuses en repli. Paramètres : page, perPage, search.
 */
export async function GET(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!/^PA\d+$/.test(uid)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const parametres = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(parametres.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(50, Math.max(1, Number.parseInt(parametres.get("perPage") ?? "10", 10) || 10));
  const search = (parametres.get("search") ?? "").slice(0, 200);

  try {
    const { getQuestionsActeurAN } = await import("@/data/mongo/questionsAN");
    const resultat = await getQuestionsActeurAN(uid, { page, perPage, search });
    return NextResponse.json(resultat, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch (erreur) {
    console.warn("Questions du député : lecture en base impossible, repli sur l'API", uid, erreur);
  }
  const resultat = await getQuestions(uid, { page, perPage, search });
  // getQuestions renvoie une liste vide, sans pagination, quand l'API échoue.
  if (resultat.pagination.currentPage === 0) {
    return NextResponse.json({ error: "Questions indisponibles" }, { status: 503 });
  }
  return NextResponse.json(resultat);
}
