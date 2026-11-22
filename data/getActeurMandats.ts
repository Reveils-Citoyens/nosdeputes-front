import * as React from "react";
import { Mandat, Organe } from "@prisma/client";
import { getOrganes } from "./getOrgane";
import { cacheTricoteuses } from "./cacheTricoteuses";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

export type MandatWithOrgane = Mandat & {
  organeRef: Organe | null;
};

async function getActeurMandatsUnCached(
  acteurUid: string
): Promise<MandatWithOrgane[]> {
  // Notre base d'abord (cf. data/mongo/referentielAN.ts), l'API en repli.
  const { getMandatsActifsAN } = await import("./mongo/referentielAN");
  const depuisBase = await getMandatsActifsAN(acteurUid);
  if (depuisBase) return depuisBase;
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/mandats?acteurRefUid=${acteurUid}&actif=true&perPage=100`,
      cacheTricoteuses("stable")
    );

    const { data } = (await rep.json()) as { data: Mandat[] };

    const organes = await getOrganes(data.map((item) => item.organeRefUid));

    return data.map((item) => ({
      ...item,
      organeRef: item.organeRefUid === null ? null : organes.get(item.organeRefUid) ?? null,
    }));
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return [];
  }
}

export const getActeurMandats = React.cache(getActeurMandatsUnCached);
