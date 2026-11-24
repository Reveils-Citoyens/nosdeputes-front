import { NextResponse } from "next/server";
import { getQuestions } from "@/data/getQuestion";

/** QE : questions écrites ; QG et QOSD : questions orales. */
const TYPES_AUTORISES = new Set(["QE", "QG", "QOSD"]);

/**
 * Questions d'un député (onglets « Questions écrites » et « Questions
 * orales »), paginées : notre base d'abord, l'API Tricoteuses en repli.
 * Paramètres : page, perPage, search, types (« QE » ou « QG,QOSD » ; tous
 * les types si absent).
 */
export async function GET(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!/^PA\d+$/.test(uid)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const parametres = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(parametres.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(50, Math.max(1, Number.parseInt(parametres.get("perPage") ?? "10", 10) || 10));
  const search = (parametres.get("search") ?? "").slice(0, 200);
  const types = (parametres.get("types") ?? "")
    .split(",")
    .map((type) => type.trim().toUpperCase())
    .filter((type) => TYPES_AUTORISES.has(type));

  try {
    const { getQuestionsActeurAN } = await import("@/data/mongo/questionsAN");
    const resultat = await getQuestionsActeurAN(uid, { page, perPage, search, types });
    return NextResponse.json(resultat, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch (erreur) {
    console.warn("Questions du député : lecture en base impossible, repli sur l'API", uid, erreur);
  }

  // Repli : l'API ne filtre que sur un type à la fois.
  if (types.length <= 1) {
    const resultat = await getQuestions(uid, { page, perPage, search, type: types[0] });
    // getQuestions renvoie une liste vide, sans pagination, quand l'API échoue.
    if (resultat.pagination.currentPage === 0) {
      return NextResponse.json({ error: "Questions indisponibles" }, { status: 503 });
    }
    return NextResponse.json(resultat);
  }
  const parType = await Promise.all(
    types.map((type) => getQuestions(uid, { page: 1, perPage: 500, search, type }))
  );
  if (parType.some((resultat) => resultat.pagination.currentPage === 0)) {
    return NextResponse.json({ error: "Questions indisponibles" }, { status: 503 });
  }
  const toutes = parType
    .flatMap((resultat) => resultat.data)
    .sort((a, b) => (b.dateDepot?.getTime() ?? 0) - (a.dateDepot?.getTime() ?? 0));
  // Même forme que la réponse lue en base : le nombre de questions de chaque type.
  const nombresParType = Object.fromEntries(
    types.map((type, i) => [type, parType[i].pagination.total ?? parType[i].data.length])
  );
  return NextResponse.json({
    data: toutes.slice((page - 1) * perPage, page * perPage),
    pagination: {
      total: toutes.length,
      totalPage: Math.ceil(toutes.length / perPage),
      perPage,
      currentPage: page,
    },
    parType: nombresParType,
  });
}
