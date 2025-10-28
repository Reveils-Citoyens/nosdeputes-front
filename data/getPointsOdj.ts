import * as React from "react";
import { Agenda, PointOdj } from "@prisma/client";

async function getPointsOdjUnCached(
  dossierUid: string
): Promise<ReturnedPointsOdj[] | null> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/points_odj/?dossierLegislatifUid=${dossierUid}&select=uid&perPage=100`
    );


    const uids = (await rep.json()) as { data: { uid: string }[] };

    if (uids.data.length === 0) {
      return [];
    }
    const items = await Promise.all(
      uids.data.map(async (item) => {
        const rep = await fetch(
          `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/points_odj/${item.uid}?include=agendaRef,_count.interventions`
        );
        const { data } = await rep.json();
        return data as ReturnedPointsOdj;
      })
    );


    items.forEach((item) => {
      if (item.agendaRef && item.agendaRef.timestampDebut) {
        item.agendaRef.timestampDebut = new Date(item.agendaRef.timestampDebut);
      }
    });

    return items;
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return null;
  }
}

export type ReturnedPointsOdj = PointOdj & { agendaRef?: Agenda; _count: { interventions: number } };

export const getPointsOdj = React.cache(getPointsOdjUnCached);
