import * as React from "react";
import { AuteurDocument, CoSignataireDocument, Document } from "@prisma/client";

export type ReturnedDocument = Document & {
  coSignataires?: CoSignataireDocument[];
  auteurs?: AuteurDocument[];
  _count: {
    amendements: number;
  };
};
async function getDocumentUnCached(
  uid: string, include?: string[]
): Promise<ReturnedDocument | null> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/documents/${uid}?include=${(include ?? ["auteurs", "coSignataires", "_count.amendements"]).join(",")}`
    );


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

export const getDocument = React.cache(getDocumentUnCached);
