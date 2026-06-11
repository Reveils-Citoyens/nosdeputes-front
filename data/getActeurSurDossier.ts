import { getDossier } from "./getDossier";
import { getDossierVotes } from "./getDossierVotes";
import { getDebats } from "./getDebats";
import { searchAmendement } from "./searchAmendement";

export type ActeurVoteSurDossier = {
  scrutinUid: string;
  scrutinNumero: string | null;
  scrutinObjet: string | null;
  dateScrutin: string | null;
  position: "pour" | "contre" | "abstention" | "nonVotant" | null;
  parDelegation: boolean;
  /**
   * Position majoritaire du groupe parlementaire de l'acteur sur ce scrutin,
   * ou null si non calculable (NI, groupe absent, pas de majorité stricte).
   */
  groupePosition: "pour" | "contre" | "abstention" | null;
  groupeAbrev: string | null;
  isDissident: boolean;
};

export type ActeurRoleSurDossier = {
  /**
   * Le type de rapport produit (par ex. "Rapporteur",
   * "Rapporteur pour avis", "Rapporteur spécial"…).
   * Conservé brut depuis l'API.
   */
  typeRapporteur: string;
};

export type ActeurAmendementsStats = {
  total: number;
  adoptes: number;
  rejetes: number;
  retires: number;
  autres: number;
};

export type ActeurSurDossier = {
  votes: ActeurVoteSurDossier[];
  amendements: ActeurAmendementsStats;
  interventionsCount: number;
  roles: ActeurRoleSurDossier[];
};

const ADOPTE_LABELS = new Set(["Adopté"]);
const REJETE_LABELS = new Set(["Rejeté", "Tombé", "Irrecevable", "Irrecevable 40"]);
const RETIRE_LABELS = new Set(["Retiré", "Non soutenu"]);

function computeGroupeMajoritaire(
  scrutinVotes: { positionVote?: string | null; groupeVotantRef?: { uid?: string } | null }[],
  groupeUid: string
): "pour" | "contre" | "abstention" | null {
  let pour = 0;
  let contre = 0;
  let abs = 0;
  for (const v of scrutinVotes) {
    if (v.groupeVotantRef?.uid !== groupeUid) continue;
    if (v.positionVote === "pour") pour += 1;
    else if (v.positionVote === "contre") contre += 1;
    else if (v.positionVote === "abstention") abs += 1;
  }
  const max = Math.max(pour, contre, abs);
  if (max === 0) return null;
  if (pour === max && pour > contre && pour > abs) return "pour";
  if (contre === max && contre > pour && contre > abs) return "contre";
  if (abs === max && abs > pour && abs > contre) return "abstention";
  return null;
}

async function getVotes(
  acteurUid: string,
  dossierUid: string
): Promise<ActeurVoteSurDossier[]> {
  const dossier = await getDossierVotes(dossierUid);
  if (!dossier) return [];

  const votes: ActeurVoteSurDossier[] = [];
  for (const acte of dossier.actesLegislatifs ?? []) {
    for (const ref of acte.voteRefs ?? []) {
      const scrutin = ref.voteRef;
      if (!scrutin) continue;
      const acteurVote = scrutin.votes?.find(
        (v) => v.acteurRef?.uid === acteurUid && v.positionVote != null
      );
      if (!acteurVote) continue;

      const groupe = acteurVote.groupeVotantRef;
      const groupeUid = groupe?.uid ?? null;
      const groupeAbrev = groupe?.organeRef?.libelleAbrev ?? null;
      const isNI = groupeAbrev === "NI";

      const groupePosition =
        groupeUid && !isNI
          ? computeGroupeMajoritaire(scrutin.votes ?? [], groupeUid)
          : null;

      const position = acteurVote.positionVote ?? null;
      const isDissident =
        !!groupePosition &&
        !!position &&
        position !== "nonVotant" &&
        position !== groupePosition;

      votes.push({
        scrutinUid: scrutin.uid,
        scrutinNumero: scrutin.numero ?? null,
        scrutinObjet: scrutin.objet ?? null,
        dateScrutin: scrutin.dateScrutin
          ? new Date(scrutin.dateScrutin).toISOString()
          : null,
        position,
        parDelegation: acteurVote.parDelegation ?? false,
        groupePosition,
        groupeAbrev,
        isDissident,
      });
    }
  }
  votes.sort((a, b) => {
    if (!a.dateScrutin || !b.dateScrutin) return 0;
    return b.dateScrutin.localeCompare(a.dateScrutin);
  });
  return votes;
}

async function getAmendementsStats(
  acteurUid: string,
  dossierUid: string
): Promise<ActeurAmendementsStats> {
  const stats: ActeurAmendementsStats = {
    total: 0,
    adoptes: 0,
    rejetes: 0,
    retires: 0,
    autres: 0,
  };
  try {
    const res = await searchAmendement({
      acteurRefUid: acteurUid,
      dossierUid,
      perPage: 500,
    });
    if (!res?.data) return stats;
    for (const amd of res.data) {
      stats.total += 1;
      const sort = (amd as { sort?: string | null }).sort ?? "";
      if (ADOPTE_LABELS.has(sort)) stats.adoptes += 1;
      else if (REJETE_LABELS.has(sort)) stats.rejetes += 1;
      else if (RETIRE_LABELS.has(sort)) stats.retires += 1;
      else stats.autres += 1;
    }
  } catch (err) {
    console.error("getAmendementsStats:", err);
  }
  return stats;
}

async function getInterventionsCount(
  acteurUid: string,
  dossierUid: string
): Promise<number> {
  try {
    const debats = await getDebats(dossierUid);
    if (!debats || debats.length === 0) return 0;

    const counts = await Promise.all(
      debats.map(async (debat) => {
        const url = `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/interventions/?debatRefUid=${debat.uid}&acteurRefUid=${acteurUid}&perPage=500`;
        const rep = await fetch(url);
        if (!rep.ok) return 0;
        const body = await rep.json();
        return Array.isArray(body?.data) ? body.data.length : 0;
      })
    );
    return counts.reduce((a, b) => a + b, 0);
  } catch (err) {
    console.error("getInterventionsCount:", err);
    return 0;
  }
}

async function getRoles(
  acteurUid: string,
  dossierUid: string
): Promise<ActeurRoleSurDossier[]> {
  try {
    const dossier = await getDossier(dossierUid);
    if (!dossier) return [];
    const roles = (dossier.rapporteurs ?? [])
      .filter((r) => r.acteurRefUid === acteurUid)
      .map((r) => ({ typeRapporteur: r.typeRapporteur }));
    // Dédup par typeRapporteur (un acteur peut avoir plusieurs rapports du même type)
    const seen = new Set<string>();
    return roles.filter((r) => {
      if (seen.has(r.typeRapporteur)) return false;
      seen.add(r.typeRapporteur);
      return true;
    });
  } catch (err) {
    console.error("getRoles:", err);
    return [];
  }
}

export async function getActeurSurDossier(
  acteurUid: string,
  dossierUid: string
): Promise<ActeurSurDossier> {
  const [votes, amendements, interventionsCount, roles] = await Promise.all([
    getVotes(acteurUid, dossierUid),
    getAmendementsStats(acteurUid, dossierUid),
    getInterventionsCount(acteurUid, dossierUid),
    getRoles(acteurUid, dossierUid),
  ]);
  return { votes, amendements, interventionsCount, roles };
}
