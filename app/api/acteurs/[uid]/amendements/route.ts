import { NextResponse } from "next/server";
import { searchAmendement } from "@/data/searchAmendement";

/**
 * Amendements déposés par un député (onglet « Amendements »), paginés : notre
 * base d'abord, l'API Tricoteuses en repli. Paramètres : page, perPage,
 * sortAmendement, search.
 */
export async function GET(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!/^PA\d+$/.test(uid)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const parametres = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(parametres.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(50, Math.max(1, Number.parseInt(parametres.get("perPage") ?? "10", 10) || 10));
  const sortAmendement = parametres.get("sortAmendement") ?? "";
  const search = (parametres.get("search") ?? "").slice(0, 200);

  try {
    const { getAmendementsActeurAN } = await import("@/data/mongo/amendementsActeurAN");
    const resultat = await getAmendementsActeurAN(uid, { page, perPage, sortAmendement, search });
    return NextResponse.json(resultat, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch (erreur) {
    console.warn("Amendements du député : lecture en base impossible, repli sur l'API", uid, erreur);
  }
  const resultat = await searchAmendement({
    page,
    perPage,
    acteurRefUid: uid,
    sortAmendement,
    search,
    include: "dossierRef",
  });
  if (!resultat) return NextResponse.json({ error: "Amendements indisponibles" }, { status: 503 });
  return NextResponse.json(resultat);
}
