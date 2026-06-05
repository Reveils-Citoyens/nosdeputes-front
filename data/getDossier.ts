import * as React from "react";
import { ActeLegislatif, Dossier, Rapporteur } from "@prisma/client";
import { parseActeLefislatif } from "./parsers/parseActeLegislatif";
import { parseDossier } from "./parsers/parseDossier";
import { getParlementDb } from "@/lib/mongodb";

export type ReturnedDossier = Dossier & {
  actesLegislatifs: ActeLegislatif[];
  rapporteurs: Rapporteur[];
};

/**
 * Fallback MongoDB : certains dossiers (missions d'information code 10,
 * commissions d'enquête code 9) sont présents en base mais NON exposés par
 * l'API Tricoteuses. On renvoie alors les métadonnées (titre, procédure,
 * législature) dans la forme attendue par les pages, pour qu'elles s'affichent.
 * Le détail des actes n'est pas reconstruit depuis le format brut AN.
 */
async function getDossierFromMongo(uid: string): Promise<ReturnedDossier | null> {
  try {
    const db = await getParlementDb();
    const d = await db.collection("dossiers").findOne(
      { uid },
      {
        projection: {
          _id: 0,
          uid: 1,
          legislature: 1,
          "titreDossier.titre": 1,
          "procedureParlementaire.code": 1,
          "procedureParlementaire.libelle": 1,
          documentDeposeRefUid: 1,
        },
      }
    );
    if (!d) return null;

    return {
      uid: d.uid,
      legislature: d.legislature != null ? Number(d.legislature) : null,
      titre: d.titreDossier?.titre ?? null,
      libelleProcedure: d.procedureParlementaire?.libelle ?? null,
      codeProcedure: d.procedureParlementaire?.code ?? null,
      theme: null,
      documentDeposeRefUid: d.documentDeposeRefUid ?? null,
      actesLegislatifs: [],
      rapporteurs: [],
      // Métadonnées minimales : on complète la forme attendue par les pages.
    } as unknown as ReturnedDossier;
  } catch (error) {
    console.error("[getDossier] fallback Mongo erreur:", error);
    return null;
  }
}

async function getDossierUnCached(uid: string): Promise<
  | (Dossier & {
      actesLegislatifs: ActeLegislatif[];
      rapporteurs: Rapporteur[];
    })
  | null
> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/${uid}?include=actesLegislatifs,rapporteurs`
    );

    const { data } = await rep.json();

    if (data) {
      // Transforms all the "yyy-mm-dd" string into Date objects.
      parseDossier(data);
      data?.actesLegislatifs?.forEach((_: any, i: number) =>
        parseActeLefislatif(data.actesLegislatifs[i])
      );
      return data;
    }
  } catch (error) {
    console.error("Error fetching dossier:", error);
  }

  // L'API n'a rien renvoyé (cas des missions d'information / commissions
  // d'enquête) → on tente la base MongoDB.
  return getDossierFromMongo(uid);
}

export const getDossier = React.cache(getDossierUnCached);

export function getDocumentsUid(dossier: ReturnedDossier | null) {
  if (dossier === null) {
    return [];
  }
  return Array.from(
    new Set(
      dossier.actesLegislatifs.flatMap((act) =>
        [act.texteAdopteRefUid, act.texteAssocieRefUid].filter(
          (id) => id !== null
        )
      )
    )
  );
}
