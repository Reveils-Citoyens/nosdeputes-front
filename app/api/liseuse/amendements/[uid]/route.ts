import { NextResponse } from "next/server";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

export async function GET(_request: Request, { params }: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  if (!/^AMANR\d+L\d+[A-Z0-9]+$/.test(uid)) {
    return NextResponse.json({ error: "Invalid amendment UID" }, { status: 400 });
  }
  // Notre base d'abord (texte en HTML, plus riche que celui de l'API), l'API en repli.
  try {
    const { getTexteAmendementAN } = await import("@/data/mongo/amendementsAN");
    const texte = await getTexteAmendementAN(uid);
    if (texte && (texte.dispositif || texte.exposeSommaire)) {
      return NextResponse.json(texte, { headers: { "Cache-Control": "no-store" } });
    }
  } catch {
    // Base indisponible : on interroge l'API.
  }
  try {
    const response = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements/${uid}?select=uid,dispositif,exposeSommaire`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) throw new Error("Upstream unavailable");
    const { data } = await response.json();
    if (!data || data.uid !== uid) throw new Error("Invalid amendment response");
    return NextResponse.json({ dispositif: data.dispositif ?? null, exposeSommaire: data.exposeSommaire ?? null },
      { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Amendment unavailable" }, { status: 502 });
  }
}
