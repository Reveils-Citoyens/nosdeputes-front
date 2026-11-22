import * as React from "react";
import { AuteurDocument, CoSignataireDocument, Document } from "@prisma/client";
import { cacheTricoteuses } from "./cacheTricoteuses";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

export type ReturnedDocument = Document & {
  coSignataires?: CoSignataireDocument[];
  auteurs?: AuteurDocument[];
  _count: {
    amendements: number;
  };
};
/** Document lu dans l'API Tricoteuses (repli). */
async function depuisApi(uid: string, include?: string[]): Promise<ReturnedDocument | null> {
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/documents/${uid}?include=${(include ?? ["auteurs", "coSignataires", "_count.amendements"]).join(",")}`,
      cacheTricoteuses("activite")
    );
    // API indisponible (503 en HTML) ou document inconnu : rien à lire.
    if (!rep.ok) return null;

    const { data } = await rep.json();

    if (!data) return null;

    // L'API n'inclut pas toujours `_count` (notamment hors include single-document).
    // On le normalise pour que tous les consommateurs puissent lire
    // `_count.amendements` sans crash (cf. erreur prod r._count.amendements).
    data._count = { amendements: data?._count?.amendements ?? 0 };

    return data;
  } catch (error) {
    console.error("Error fetching documents:", error);
    return null;
  }
}

async function getDocumentUnCached(
  uid: string, include?: string[]
): Promise<ReturnedDocument | null> {
  // Serveur : notre base d'abord (cf. data/mongo/documentsAN.ts). Les imports
  // restent DANS ce bloc : le test sur `window` est résolu à la compilation,
  // et c'est ce qui retire le module MongoDB du code envoyé au navigateur.
  if (typeof window === "undefined") {
    const { getDocumentAN } = await import("./mongo/documentsAN");
    const { identifiantSenat } = await import("./mongo/conversionDocumentAN");
    const document = (await getDocumentAN(uid)) as unknown as ReturnedDocument | null;
    if (!document) return depuisApi(uid, include);
    if (document.pdfUrl || document.chambre !== "SN") return document;

    // Texte du Sénat : nous n'en avons que la notice, sans PDF ni amendements
    // du Sénat. Tricoteuses le publie sous l'identifiant du Sénat (ppl25-311) ;
    // on l'y cherche, en gardant l'identifiant AN auquel se réfèrent les actes.
    const senat = identifiantSenat(uid);
    const depuisSenat = senat ? await depuisApi(senat, include) : null;
    return depuisSenat ? { ...depuisSenat, uid } : document;
  }

  // Navigateur : notre route, qui fait de même côté serveur.
  try {
    const rep = await fetch(`/api/documents?uid=${encodeURIComponent(uid)}`);
    if (!rep.ok) return null;
    const { data } = await rep.json();
    return data ?? null;
  } catch (error) {
    console.warn("getDocument: échec de récupération", uid, error);
    return null;
  }
}

export const getDocument = React.cache(getDocumentUnCached);
