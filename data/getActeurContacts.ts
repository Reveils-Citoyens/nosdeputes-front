import * as React from "react";
import {
  AdresseElectronique,
  AdressePostale,
  Mandat,
  Organe,
} from "@prisma/client";
import { cacheTricoteuses } from "./cacheTricoteuses";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

export type MandatWithOrgane = Mandat & {
  organeRef: Organe | null;
};

async function getActeurAdressesElectroniquesUnCached(
  acteurUid: string
): Promise<AdresseElectronique[]> {
  // Notre base d'abord (cf. data/mongo/referentielAN.ts), l'API en repli.
  const { getAdressesAN } = await import("./mongo/referentielAN");
  const depuisBase = await getAdressesAN(acteurUid);
  if (depuisBase) return depuisBase.electroniques;
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/adressesElectroniques?acteurRefUid=${acteurUid}`,
      cacheTricoteuses("stable")
    );

    const { data } = (await rep.json()) as { data: AdresseElectronique[] };

    return data;
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return [];
  }
}

export const getActeurAdressesElectroniques = React.cache(
  getActeurAdressesElectroniquesUnCached
);

async function getActeurAdressesPostalesUnCached(
  acteurUid: string
): Promise<AdressePostale[]> {
  const { getAdressesAN } = await import("./mongo/referentielAN");
  const depuisBase = await getAdressesAN(acteurUid);
  if (depuisBase) return depuisBase.postales;
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/adressesPostales?acteurRefUid=${acteurUid}`,
      cacheTricoteuses("stable")
    );

    const { data } = (await rep.json()) as { data: AdressePostale[] };

    return data;
  } catch (error) {
    console.error("Error fetching dossier:", error);
    return [];
  }
}

export const getActeurAdressesPostales = React.cache(
  getActeurAdressesPostalesUnCached
);
