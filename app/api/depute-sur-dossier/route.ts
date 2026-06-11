import { NextRequest, NextResponse } from "next/server";
import { getActeurSurDossier } from "@/data/getActeurSurDossier";

export async function GET(request: NextRequest) {
  const acteurUid = request.nextUrl.searchParams.get("acteurUid")?.trim();
  const dossierUid = request.nextUrl.searchParams.get("dossierUid")?.trim();

  if (!acteurUid || !dossierUid) {
    return NextResponse.json(
      { error: "acteurUid et dossierUid sont requis" },
      { status: 400 }
    );
  }

  const data = await getActeurSurDossier(acteurUid, dossierUid);
  return NextResponse.json(data);
}
