import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";

export type MissionReunion = {
  uid: string;
  date: string | null; // ISO
  odj: string[]; // lignes d'ordre du jour (auditions, intervenants…)
  lieu: string | null;
  /** uid du compte rendu (verbatim) s'il existe, pour lier la transcription. */
  compteRenduRefUid: string | null;
};

// Types d'organes correspondant aux missions d'information et commissions d'enquête.
const MISSION_CODE_TYPES = ["MISINFO", "MISINFOCOM", "MISINFOPRE", "CNPE"];

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractCompteRenduUid(cr: any): string | null {
  if (!cr) return null;
  if (typeof cr === "string") return cr;
  if (Array.isArray(cr)) return typeof cr[0] === "string" ? cr[0] : cr[0]?.uid ?? null;
  return cr.uid ?? null;
}

function extractOdj(odj: any): string[] {
  if (!odj) return [];
  const src = odj.resumeODJ ?? odj.convocationODJ ?? null;
  const item = src?.item;
  if (!item) return [];
  const arr = Array.isArray(item) ? item : [item];
  return arr
    .map((x: any) => (typeof x === "string" ? x : x?.["#text"] ?? ""))
    .map((s: string) => s.trim())
    .filter(Boolean);
}

/**
 * Réunions d'un organe (mission/CE) à partir de son uid.
 */
export const getReunionsByOrgane = cache(
  async (organeUid: string): Promise<MissionReunion[]> => {
    if (!organeUid) return [];
    try {
      const db = await getParlementDb();
      const docs = await db
        .collection("reunions")
        .find(
          { organeReuniRef: organeUid },
          {
            projection: {
              _id: 0,
              uid: 1,
              timeStampDebut: 1,
              ODJ: 1,
              "lieu.libelleLong": 1,
              compteRenduRef: 1,
            },
            sort: { timeStampDebut: -1 },
            limit: 300,
          }
        )
        .toArray();

      return docs.map((r) => ({
        uid: String(r.uid),
        date: typeof r.timeStampDebut === "string" ? r.timeStampDebut : null,
        odj: extractOdj(r.ODJ),
        lieu: r.lieu?.libelleLong ?? null,
        compteRenduRefUid: extractCompteRenduUid(r.compteRenduRef),
      }));
    } catch (error) {
      console.error("[getReunionsByOrgane] erreur:", error);
      return [];
    }
  }
);

/**
 * Réunions / auditions d'une mission d'information ou commission d'enquête,
 * à partir du titre du dossier.
 *
 * Ces dossiers n'étant pas exposés par l'API, on passe par l'ORGANE : on le
 * retrouve par titre identique (libelle === titre du dossier), puis on liste
 * ses réunions via `reunions.organeReuniRef`.
 */
async function getMissionReunionsUnCached(
  titre: string | null,
  legislature: number | string | null
): Promise<MissionReunion[]> {
  if (!titre) return [];
  try {
    const db = await getParlementDb();

    const legFilter =
      legislature != null
        ? { legislature: { $in: [String(legislature), Number(legislature)] } }
        : {};

    const organe = await db.collection("organes").findOne(
      { libelle: titre, codeType: { $in: MISSION_CODE_TYPES }, ...legFilter },
      { projection: { _id: 0, uid: 1 } }
    );
    if (!organe?.uid) return [];

    return getReunionsByOrgane(organe.uid);
  } catch (error) {
    console.error("[getMissionReunions] erreur:", error);
    return [];
  }
}

export const getMissionReunions = cache(getMissionReunionsUnCached);
