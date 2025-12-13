import * as React from "react";
import { Debat, } from "@prisma/client";

async function getDebatsUnCached(
  dossierUid: string
): Promise<ReturnedDebat[] | null> {
  try {
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/points_odj/?dossierLegislatifUid=${dossierUid}&include=agendaRef.compteRenduRef&perPage=100`
    );

    const pointsOdj = (await rep.json()) as { data: { agendaRef?: { compteRenduRef?: Debat[] } }[] };



    const debatsUids = pointsOdj.data
      .flatMap((pt) => pt.agendaRef?.compteRenduRef ?? [])
      .map((deb) => deb.uid);

    if (debatsUids.length === 0) {
      return [];
    }
    const items = await Promise.all(
      debatsUids.map(async (debatUid) => {
        const rep = await fetch(
          `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/debats/${debatUid}?include=_count.paragraphes`
        );
        const { data } = await rep.json();
        return data as ReturnedDebat;
      })
    )


    items.forEach((item) => {
      if (item.dateSeance) {
        item.dateSeance = new Date(item.dateSeance);
      }
    });

    return items.filter((item): item is ReturnedDebat => item !== null);
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return null;
  }
}

export type ReturnedDebat = Debat & {
  _count: {
    paragraphes: number;
  };
};

export const getDebats = React.cache(getDebatsUnCached);
