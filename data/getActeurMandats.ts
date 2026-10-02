import * as React from "react";
import { Mandat, Organe } from "@prisma/client";
import { getOrganes } from "./getOrgane";
import { cacheTricoteuses } from "./cacheTricoteuses";

export type MandatWithOrgane = Mandat & {
  organeRef: Organe | null;
};

async function getActeurMandatsUnCached(
  acteurUid: string
): Promise<MandatWithOrgane[]> {
  try {
    const rep = await fetch(
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
