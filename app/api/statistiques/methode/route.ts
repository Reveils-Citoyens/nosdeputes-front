import { NextResponse } from "next/server";
import { getValeursMethode } from "@/data/mongo/getValeursMethode";

export const dynamic = "force-dynamic";

/** Valeurs citées dans les fenêtres « ⓘ » des statistiques (cf. methodeStatistiques). */
export async function GET() {
  return NextResponse.json(await getValeursMethode(), {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
