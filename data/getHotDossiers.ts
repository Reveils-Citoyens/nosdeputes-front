import { cache } from "react";
import { getParlementDb } from "@/lib/mongodb";
import { Status } from "@/components/StatusChip";

export type HotDossier = {
  uid: string;
  legislature: string;
  titre: string;
  typeLabel: string;
  dateDernierActe: Date | null;
  amendements: number;
  heatScore: number;
  statusLabel: string | null;
  statusType: Status | undefined;
  currentStage: string | null;
  badge: string | null;
};

// Mapping du currentStatus pré-calculé (script Python) vers le Status enum existant
const STATUS_MAPPING: Record<string, { label: string; status: Status }> = {
  promulgue: { label: "Promulgué", status: "validated" },
  adopte: { label: "Adopté", status: "validated" },
  rejete: { label: "Rejeté", status: "refused" },
  en_cours: { label: "En cours", status: "review" },
};

async function getHotDossiersUnCached(
  limit = 12,
  legislature = "17"
): Promise<HotDossier[]> {
  const db = await getParlementDb();

  const cursor = db.collection("dossiers").find(
    {
      // Tous les types de dossier (DossierLegislatif_Type, DossierResolutionAN,
      // DossierMissionControle_Type, etc.) — exclut les documents enfants
      // (texteLoi_Type, rapportParlementaire_Type, accordInternational_Type, …).
      "@xsi:type": { $regex: /^Dossier/ },
      legislature,
      heatScore: { $gt: 0 },
    },
    {
      projection: {
        _id: 0,
        uid: 1,
        legislature: 1,
        "titreDossier.titre": 1,
        "procedureParlementaire.libelle": 1,
        heatScore: 1,
        currentStatus: 1,
        currentStage: 1,
        dossierBadge: 1,
        "heatComponents.amendements_total": 1,
        "heatComponents.last_acte_date": 1,
      },
    }
  ).sort({ heatScore: -1 }).limit(limit);

  const docs = await cursor.toArray();

  return docs.map((d) => {
    const statusKey = d.currentStatus as string | undefined;
    const statusInfo = statusKey ? STATUS_MAPPING[statusKey] : undefined;
    const lastActe = d.heatComponents?.last_acte_date as string | undefined;

    return {
      uid: d.uid,
      legislature: d.legislature,
      titre: d.titreDossier?.titre ?? "",
      typeLabel:
        d.procedureParlementaire?.libelle ?? d.currentStage ?? "Dossier",
      dateDernierActe: lastActe ? new Date(lastActe) : null,
      amendements: d.heatComponents?.amendements_total ?? 0,
      heatScore: d.heatScore ?? 0,
      statusLabel: statusInfo?.label ?? null,
      statusType: statusInfo?.status,
      currentStage: d.currentStage ?? null,
      badge: (d.dossierBadge as string | undefined) ?? null,
    };
  });
}

export const getHotDossiers = cache(getHotDossiersUnCached);
