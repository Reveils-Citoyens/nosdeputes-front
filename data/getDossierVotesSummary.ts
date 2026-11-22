import * as React from "react";
import type { ActeLegislatif, Scrutin } from "@prisma/client";
import { parseActeLefislatif } from "./parsers/parseActeLegislatif";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";

export type ScrutinSummary = Pick<Scrutin,
  "uid" | "numero" | "titre" | "dateScrutin" | "code" | "pour" | "contre" | "abstentions"
>;
export type DossierVotesSummary = {
  actesLegislatifs: (Pick<ActeLegislatif, "uid" | "codeActe" | "nomCanonique" | "dateActe"> & {
    voteRefs: { voteRef: ScrutinSummary | null }[];
  })[];
};

export async function getDossierVotesSummaryUnCached(uid: string): Promise<DossierVotesSummary | null> {
  try {
    const response = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/${uid}?include=actesLegislatifs.voteRefs.voteRef`,
      { next: { revalidate: 60 } }
    );
    if (!response.ok) return null;
    const { data } = await response.json();
    if (!data) return null;
    return {
      actesLegislatifs: (data.actesLegislatifs ?? []).map((acte: ActeLegislatif & {
        voteRefs?: { voteRef: ScrutinSummary | null }[];
      }) => {
        parseActeLefislatif(acte);
        return {
          uid: acte.uid, codeActe: acte.codeActe,
          nomCanonique: acte.nomCanonique, dateActe: acte.dateActe,
          voteRefs: (acte.voteRefs ?? []).map(({ voteRef }) => ({
            voteRef: voteRef ? {
              uid: voteRef.uid, numero: voteRef.numero, titre: voteRef.titre,
              dateScrutin: voteRef.dateScrutin ? new Date(voteRef.dateScrutin) : null,
              code: voteRef.code, pour: voteRef.pour, contre: voteRef.contre,
              abstentions: voteRef.abstentions,
            } : null,
          })),
        };
      }),
    };
  } catch {
    return null;
  }
}

/**
 * Notre base d'abord (cf. data/mongo/votesDossierAN.ts), identique à l'API à
 * la date des scrutins près (l'API la décalait d'un jour) ; l'API reste le
 * repli pour un dossier que nous n'avons pas. Serveur uniquement : le
 * navigateur passe par /api/dossiers/[uid]/votes.
 */
export const getDossierVotesSummary = React.cache(async (uid: string): Promise<DossierVotesSummary | null> => {
  try {
    const { getDossierVotesSummaryAN } = await import("./mongo/votesDossierAN");
    const depuisBase = await getDossierVotesSummaryAN(uid);
    if (depuisBase) return depuisBase;
  } catch (error) {
    console.warn("getDossierVotesSummary: lecture de la base impossible, repli sur l'API", uid, error);
  }
  return getDossierVotesSummaryUnCached(uid);
});
