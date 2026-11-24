import { NextResponse } from "next/server";

/**
 * Derniers débats où un député est intervenu, en séance publique et en
 * commission (onglet « Travaux »), une ligne par débat. Paramètres : type
 * (« seance » ou « commission », les deux si absent), limite (10 par défaut).
 * Lu dans notre base : calcul nocturne des statistiques et comptes rendus.
 */
export async function GET(request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!/^PA\d+$/.test(uid)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  const parametres = new URL(request.url).searchParams;
  const type = parametres.get("type");
  const limite = Math.min(100, Math.max(1, Number.parseInt(parametres.get("limite") ?? "10", 10) || 10));

  try {
    const { getInterventionsActeurAN } = await import("@/data/mongo/interventionsActeurAN");
    const resultat = await getInterventionsActeurAN(uid, {
      type: type === "seance" || type === "commission" ? type : undefined,
      limite,
    });
    return NextResponse.json(resultat, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch (erreur) {
    console.error("Interventions du député : lecture impossible", uid, erreur);
    return NextResponse.json({ error: "Interventions indisponibles" }, { status: 503 });
  }
}
