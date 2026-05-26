import * as React from "react";
import { Debat } from "@prisma/client";

export type DebateType = "seance" | "commission";

async function getDebatsUnCached(
  dossierUid: string
): Promise<ReturnedDebat[] | null> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/points_odj/?dossierLegislatifUid=${dossierUid}&include=agendaRef.compteRenduRef&perPage=100`
    );

    const pointsOdj = (await rep.json()) as {
      data: {
        agendaRef?: {
          xsiType?: string;
          organeLibelle?: string;
          compteRenduRef?: Debat[];
        };
      }[];
    };

    // On préserve le xsiType de l'agendaRef pour distinguer séance vs commission.
    // seance_type → séance publique (hémicycle)
    // reunionCommission_type (et autres) → commission
    const debatsWithMeta = pointsOdj.data.flatMap((pt) => {
      const xsiType = pt.agendaRef?.xsiType ?? "";
      const organeLibelle = pt.agendaRef?.organeLibelle ?? null;
      const debateType: DebateType = xsiType === "seance_type" ? "seance" : "commission";
      return (pt.agendaRef?.compteRenduRef ?? [])
        .filter((deb) => deb.chambre === "AN")
        .map((deb) => ({ uid: deb.uid, debateType, organeLibelle }));
    });

    if (debatsWithMeta.length === 0) return [];

    // Dédupliquer par uid (un même compte-rendu peut apparaître sur plusieurs points)
    const seen = new Set<string>();
    const uniqueMeta = debatsWithMeta.filter(({ uid }) => {
      if (seen.has(uid)) return false;
      seen.add(uid);
      return true;
    });

    const items = await Promise.all(
      uniqueMeta.map(async ({ uid, debateType, organeLibelle }) => {
        const r = await fetch(
          `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/debats/${uid}?include=_count.paragraphes`
        );
        const { data } = await r.json();
        if (!data) return null;
        if (data.dateSeance) data.dateSeance = new Date(data.dateSeance);
        return { ...data, debateType, organeLibelle } as ReturnedDebat;
      })
    );

    return items
      .filter((item): item is ReturnedDebat => item !== null)
      .sort((a, b) => {
        const da = a.dateSeance ? new Date(a.dateSeance).getTime() : 0;
        const db = b.dateSeance ? new Date(b.dateSeance).getTime() : 0;
        return da - db; // croissant : plus ancien en premier (ordre chronologique)
      });
  } catch (error) {
    console.error("Error fetching debats:", error);
    return null;
  }
}

export type ReturnedDebat = Debat & {
  _count: { paragraphes: number };
  debateType: DebateType;
  organeLibelle: string | null;
};

export const getDebats = React.cache(getDebatsUnCached);
