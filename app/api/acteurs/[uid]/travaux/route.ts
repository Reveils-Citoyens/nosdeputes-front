import { NextResponse } from "next/server";
import { searchDocument } from "@/data/searchDocument";
import { searchDossier } from "@/data/searchDossier";

/**
 * Travaux d'un député (onglet « Travaux ») : textes dont il est l'auteur
 * principal et dossiers qu'il a initiés. Notre base d'abord, l'API
 * Tricoteuses en repli.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  if (!/^PA\d+$/.test(uid)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });

  try {
    const { getTravauxActeurAN } = await import("@/data/mongo/travauxAN");
    const resultat = await getTravauxActeurAN(uid);
    return NextResponse.json(resultat, { headers: { "Cache-Control": "public, s-maxage=300" } });
  } catch (erreur) {
    console.warn("Travaux du député : lecture en base impossible, repli sur l'API", uid, erreur);
  }
  const [documents, dossiers] = await Promise.all([
    searchDocument({ perPage: 100, auteurPrincipalUid: uid, sort: "dateCreation.desc" }),
    searchDossier({ perPage: 100, acteurPrincipalRefUid: uid }),
  ]);
  if (!documents || !dossiers) return NextResponse.json({ error: "Travaux indisponibles" }, { status: 503 });
  return NextResponse.json({
    documents: documents.data.map((d) => ({
      uid: d.uid,
      classeCode: d.classeCode,
      titrePrincipalCourt: d.titrePrincipalCourt,
      dateCreation: d.dateCreation,
      pdfUrl: d.pdfUrl,
      dossierRefUid: d.dossierRefUid,
    })),
    dossiers: dossiers.data.map((d) => ({
      uid: d.uid,
      legislature: d.legislature,
      titre: d.titre,
      dateDernierActe: d.dateDernierActe,
    })),
  });
}
