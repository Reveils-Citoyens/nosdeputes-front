import * as React from "react";
import { ActeLegislatif, Dossier, Rapporteur } from "@prisma/client";
import { parseActeLefislatif } from "./parsers/parseActeLegislatif";
import { parseDossier } from "./parsers/parseDossier";
import { getParlementDb } from "@/lib/mongodb";
import { cacheTricoteuses } from "./cacheTricoteuses";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";
import { dossierDepuisAN } from "./mongo/conversionDossierAN";

export type ReturnedDossier = Dossier & {
  actesLegislatifs: ActeLegislatif[];
  rapporteurs: Rapporteur[];
};

/**
 * Dossier lu dans notre base (collection `dossiers`, importée chaque nuit par
 * ND.py) et converti dans la forme de l'API Tricoteuses (cf.
 * data/mongo/conversionDossierAN.ts). `null` si le dossier n'y est pas : les
 * dossiers propres au Sénat (« ppl22-031 ») ne sont pas importés.
 */
async function getDossierFromMongo(uid: string): Promise<ReturnedDossier | null> {
  try {
    const db = await getParlementDb();
    const brut = await db.collection("dossiers").findOne(
      { uid },
      // Champs ajoutés par nos calculs nocturnes : inutiles ici.
      { projection: { _id: 0, heatComponents: 0, enrichmentKeywords: 0 } }
    );
    if (!brut) return null;
    return dossierDepuisAN(brut as unknown as Parameters<typeof dossierDepuisAN>[0]);
  } catch (error) {
    console.error("[getDossier] lecture Mongo impossible:", error);
    return null;
  }
}

/** Dates des chaînes ISO converties en objets Date, comme pour l'API. */
function parser(data: ReturnedDossier): ReturnedDossier {
  parseDossier(data);
  data.actesLegislatifs?.forEach((_, i) => parseActeLefislatif(data.actesLegislatifs[i]));
  return data;
}

async function getDossierUnCached(uid: string): Promise<
  | (Dossier & {
      actesLegislatifs: ActeLegislatif[];
      rapporteurs: Rapporteur[];
    })
  | null
> {
  // Notre base d'abord : l'API Tricoteuses, lente quand elle est saturée,
  // bloquait toutes les pages du dossier. Elle reste le repli pour les
  // dossiers que nous n'importons pas.
  const depuisBase = await getDossierFromMongo(uid);
  if (depuisBase) return parser(depuisBase);

  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/${uid}?include=actesLegislatifs,rapporteurs`,
      cacheTricoteuses("contenu")
    );

    const { data } = await rep.json();

    if (data) return parser(data);
  } catch (error) {
    console.error("Error fetching dossier:", error);
  }
  return null;
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
