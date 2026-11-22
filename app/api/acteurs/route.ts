import { NextResponse } from "next/server";
import { getActeur } from "@/data/getActeur";
import { getActeurBySlug } from "@/data/getActeurBySlug";

/**
 * Un acteur, par `uid` ou par `slug`, pour les composants exécutés dans le
 * navigateur : ils ne peuvent pas lire la base, et interroger directement
 * l'API Tricoteuses les exposait à sa lenteur, sans cache.
 */
export async function GET(request: Request) {
  const parametres = new URL(request.url).searchParams;
  const uid = parametres.get("uid");
  const slug = parametres.get("slug");

  let data = null;
  if (uid && /^PA\d+$/.test(uid)) data = await getActeur(uid);
  else if (slug && /^[a-z0-9-]+$/.test(slug)) data = await getActeurBySlug(slug);
  else return NextResponse.json({ error: "Paramètre uid ou slug invalide" }, { status: 400 });

  if (!data) return NextResponse.json({ data: null }, { status: 404 });
  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  );
}
