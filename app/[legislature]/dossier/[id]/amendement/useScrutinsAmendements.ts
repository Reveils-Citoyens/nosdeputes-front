"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  rattacherScrutins,
  type AmendementAvecScrutin,
  type ScrutinResume,
} from "@/data/liseuse/scrutinsAmendements";

/** uid d'amendement → résumé du scrutin public qui l'a tranché. */
export type ScrutinsParAmendement = Map<string, ScrutinResume>;

export const ScrutinsAmendementsContext = React.createContext<ScrutinsParAmendement>(new Map());

const LOT_UIDS = 50;

async function lireScrutins(url: string, signal: AbortSignal): Promise<ScrutinResume[]> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { scrutins } = (await res.json()) as { scrutins: ScrutinResume[] };
  return scrutins;
}

/**
 * Charge les résumés des scrutins publics des amendements affichés. Attend
 * que tous les amendements du texte soient chargés (`complet`), puis lit la
 * liste des scrutins du document en un appel, complétée au besoin par uid.
 * En cas d'échec, la liseuse reste utilisable sans l'information de vote.
 */
export function useScrutinsAmendements(
  docUid: string,
  amendements: AmendementAvecScrutin[] | null,
  complet: boolean,
): ScrutinsParAmendement {
  const rattachement = React.useMemo(
    () => (amendements ? rattacherScrutins(amendements) : new Map<string, string>()),
    [amendements],
  );
  const uids = React.useMemo(() => [...new Set(rattachement.values())].sort(), [rattachement]);

  const { data: resumes } = useQuery({
    queryKey: ["liseuse-scrutins", docUid, uids.join(",")],
    enabled: complet && uids.length > 0,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: async ({ signal }) => {
      const parUid = new Map<string, ScrutinResume>();
      for (const s of await lireScrutins(`/api/liseuse/scrutins?documentRefUid=${encodeURIComponent(docUid)}`, signal)) {
        parUid.set(s.uid, s);
      }
      const manquants = uids.filter((u) => !parUid.has(u));
      for (let i = 0; i < manquants.length; i += LOT_UIDS) {
        const lot = manquants.slice(i, i + LOT_UIDS).join(",");
        for (const s of await lireScrutins(`/api/liseuse/scrutins?uids=${lot}`, signal)) parUid.set(s.uid, s);
      }
      return parUid;
    },
  });

  return React.useMemo(() => {
    const parAmendement: ScrutinsParAmendement = new Map();
    if (!resumes) return parAmendement;
    for (const [amendement, scrutin] of rattachement) {
      const resume = resumes.get(scrutin);
      if (resume) parAmendement.set(amendement, resume);
    }
    return parAmendement;
  }, [rattachement, resumes]);
}
