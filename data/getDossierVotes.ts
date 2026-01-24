// data/getDossierVotes.ts
import * as React from "react";
import { ActeLegislatif, Dossier, Scrutin, Vote, Acteur, GroupeVotant, Organe } from "@prisma/client";
import { parseDossier } from "./parsers/parseDossier";
import { parseActeLefislatif } from "./parsers/parseActeLegislatif";

export type ScrutinComplet = Scrutin & {
  votes: (Vote & {
    acteurRef: Acteur | null;
    groupeVotantRef: (GroupeVotant & { organeRef: Organe | null }) | null;
  })[];
};

export type ActeWithScrutins = ActeLegislatif & {
  voteRefs: {
    voteRef: ScrutinComplet | null;
  }[];
};

export type DossierVotes = Dossier & {
  actesLegislatifs: ActeWithScrutins[];
};

async function getDossierVotesUnCached(uid: string): Promise<DossierVotes | null> {
  try {
    const includeParams = [
      "actesLegislatifs.voteRefs.voteRef.votes.acteurRef",
      "actesLegislatifs.voteRefs.voteRef.votes.groupeVotantRef.organeRef"
    ].join(",");

    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/${uid}?include=${includeParams}`
    );

    const { data } = await rep.json();

    if (!data) return null;

    parseDossier(data);
    data.actesLegislatifs?.forEach((acte: any) => {
      parseActeLefislatif(acte);
      acte.voteRefs?.forEach((ref: any) => {
        if (ref.voteRef?.dateScrutin) {
          ref.voteRef.dateScrutin = new Date(ref.voteRef.dateScrutin);
        }
      });
    });

    return data as DossierVotes;
  } catch (error) {
    console.error(`Error fetching votes for dossier ${uid}:`, error);
    return null;
  }
}

export const getDossierVotes = React.cache(getDossierVotesUnCached);