import * as React from "react";
import { Debat } from "@prisma/client";

export type DebateType = "seance" | "commission";

type DebateMeta = {
  uid: string;
  debateType: DebateType;
  organeLibelle: string | null;
  reunionDate: string | null;
  lectureLabel: string | null;
};

type AgendaWithDebates = {
  uid?: string;
  chambre?: string;
  xsiType?: string;
  etat?: string;
  timestampDebut?: string | null;
  organeReunionRefUid?: string | null;
  organeLibelle?: string | null;
  compteRenduRefUid?: string | null;
  transcriptionRefUid?: string | null;
  compteRenduRef?: Debat[];
};

type DossierAct = {
  chambre?: string | null;
  codeActe?: string | null;
  dateActe?: string | null;
  organeRefUid?: string | null;
  reunionRefUid?: string | null;
  organeRef?: {
    uid?: string;
    codeType?: string | null;
    libelle?: string | null;
  } | null;
};

const DOSSIER_SPECIFIC_COMMISSION_TYPES = new Set(["CNPS", "COMNL"]);

function debatesFromAgenda(
  agenda: AgendaWithDebates | null | undefined,
  fallbackOrganeLibelle: string | null = null,
  lectureLabel: string | null = null
): DebateMeta[] {
  if (!agenda || ["Annulé", "Supprimé"].includes(agenda.etat ?? "")) {
    return [];
  }

  const debateType: DebateType =
    agenda.xsiType === "seance_type" ? "seance" : "commission";
  const organeLibelle = agenda.organeLibelle ?? fallbackOrganeLibelle;
  const anDebates = (agenda.compteRenduRef ?? []).filter(
    (debat) => debat.chambre === "AN"
  );

  // Une réunion peut exposer simultanément sa transcription provisoire et son
  // compte rendu officiel. Le sélecteur doit représenter les réunions, pas les
  // différentes versions d'un même contenu : on privilégie donc le CR officiel.
  const preferredUid =
    agenda.compteRenduRefUid ?? agenda.transcriptionRefUid ?? null;
  const preferredDebate =
    anDebates.find((debat) => debat.uid === preferredUid) ??
    anDebates.find((debat) => debat.uid.toUpperCase().startsWith("CR")) ??
    anDebates[0];

  return preferredDebate
    ? [
        {
          uid: preferredDebate.uid,
          debateType,
          organeLibelle,
          reunionDate: agenda.timestampDebut ?? null,
          lectureLabel,
        },
      ]
    : [];
}

function isCommissionAct(act: DossierAct): boolean {
  return (
    (act.chambre == null || act.chambre === "AN") &&
    /(?:^|-)COM-(?:FOND|AVIS)(?:-|$)/.test(act.codeActe ?? "")
  );
}

function lectureFromCodeActe(codeActe: string | null | undefined): string | null {
  const code = codeActe?.match(/^(ANLUNI|AN\d+|CMP)(?:-|$)/)?.[1];
  if (!code) return null;
  if (code === "ANLUNI") return "Lecture unique";
  if (code === "CMP") return "Commission mixte paritaire";

  const lectureNumber = Number(code.slice(2));
  if (!Number.isFinite(lectureNumber)) return null;
  return lectureNumber === 1
    ? "1re lecture"
    : `${lectureNumber}e lecture`;
}

function getLectureLabel(
  agenda: AgendaWithDebates,
  debateType: DebateType,
  acts: DossierAct[]
): string | null {
  const directAct = acts.find(
    (act) => act.reunionRefUid && act.reunionRefUid === agenda.uid
  );
  const directLabel = lectureFromCodeActe(directAct?.codeActe);
  if (directLabel) return directLabel;

  const relevantActs = acts.filter((act) => {
    if (act.chambre != null && act.chambre !== "AN") return false;
    if (debateType === "commission") {
      return (
        isCommissionAct(act) &&
        (!agenda.organeReunionRefUid ||
          act.organeRefUid === agenda.organeReunionRefUid)
      );
    }
    return /^AN(?:LUNI|\d+)-DEBATS(?:-|$)/.test(act.codeActe ?? "");
  });

  const stages = new Map<string, { label: string; timestamp: number }>();
  for (const act of relevantActs) {
    const label = lectureFromCodeActe(act.codeActe);
    if (!label || !act.dateActe) continue;
    const timestamp = new Date(act.dateActe).getTime();
    const previous = stages.get(label);
    if (!previous || timestamp < previous.timestamp) {
      stages.set(label, { label, timestamp });
    }
  }

  const orderedStages = [...stages.values()].sort(
    (a, b) => a.timestamp - b.timestamp
  );
  if (orderedStages.length === 0) return null;
  if (!agenda.timestampDebut) return orderedStages[0].label;

  const reunionTimestamp = new Date(agenda.timestampDebut).getTime();
  let selectedStage = orderedStages[0];
  for (const stage of orderedStages) {
    if (stage.timestamp > reunionTimestamp) break;
    selectedStage = stage;
  }
  return selectedStage.label;
}

/**
 * Certains jeux de données AN ne créent aucun PointOdj pour les réunions de
 * commission. Dans ce cas, la chaîne dossier -> point ODJ -> réunion utilisée
 * habituellement est rompue, alors que les comptes rendus existent bien.
 *
 * On complète donc la liste avec :
 * - les réunions explicitement référencées par un acte du dossier ;
 * - toutes les réunions d'une commission créée spécialement pour ce dossier.
 *
 * Les commissions permanentes sont volontairement exclues du second cas :
 * leur organe traite de nombreux dossiers et son seul UID ne suffit pas à
 * attribuer une réunion au bon texte.
 */
async function getCommissionFallbackMeta(
  acts: DossierAct[]
): Promise<DebateMeta[]> {
  const apiUrl = process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL;
  const commissionActs = acts.filter(isCommissionAct);

  const organeLabels = new Map<string, string | null>();
  const directReunionUids = new Set<string>();
  const dedicatedOrganeUids = new Set<string>();

  for (const act of commissionActs) {
    if (act.reunionRefUid) directReunionUids.add(act.reunionRefUid);

    const organeUid = act.organeRefUid ?? act.organeRef?.uid;
    if (!organeUid) continue;
    organeLabels.set(organeUid, act.organeRef?.libelle ?? null);
    if (
      act.organeRef?.codeType &&
      DOSSIER_SPECIFIC_COMMISSION_TYPES.has(act.organeRef.codeType)
    ) {
      dedicatedOrganeUids.add(organeUid);
    }
  }

  const directRequests = [...directReunionUids].map(async (reunionUid) => {
    const response = await fetch(
      `${apiUrl}/reunions/${reunionUid}?include=compteRenduRef`
    );
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: AgendaWithDebates | null };
    if (body.data?.xsiType !== "reunionCommission_type") return [];
    return debatesFromAgenda(
      body.data,
      null,
      getLectureLabel(body.data, "commission", acts)
    );
  });

  const organeRequests = [...dedicatedOrganeUids].map(async (organeUid) => {
    const params = new URLSearchParams({
      organeReunionRefUid: organeUid,
      include: "compteRenduRef",
      perPage: "100",
    });
    const response = await fetch(`${apiUrl}/reunions/?${params}`);
    if (!response.ok) return [];
    const body = (await response.json()) as { data?: AgendaWithDebates[] };
    return (body.data ?? [])
      .filter((agenda) => agenda.xsiType === "reunionCommission_type")
      .flatMap((agenda) =>
        debatesFromAgenda(
          agenda,
          organeLabels.get(organeUid) ?? null,
          getLectureLabel(
            { ...agenda, organeReunionRefUid: organeUid },
            "commission",
            acts
          )
        )
      );
  });

  const results = await Promise.allSettled([
    ...directRequests,
    ...organeRequests,
  ]);

  return results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
}

export async function getDebatsUnCached(
  dossierUid: string
): Promise<ReturnedDebat[] | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL;
    const rep = await fetch(
      `${apiUrl}/points_odj/?dossierLegislatifUid=${dossierUid}&include=agendaRef.compteRenduRef&perPage=100`
    );
    if (!rep.ok) throw new Error(`points_odj: HTTP ${rep.status}`);

    const pointsOdj = (await rep.json()) as {
      data?: { agendaRef?: AgendaWithDebates }[];
    };

    let dossierActs: DossierAct[] = [];
    try {
      const dossierResponse = await fetch(
        `${apiUrl}/dossiers/${dossierUid}?include=actesLegislatifs.organeRef`
      );
      if (dossierResponse.ok) {
        const { data } = (await dossierResponse.json()) as {
          data?: { actesLegislatifs?: DossierAct[] } | null;
        };
        dossierActs = data?.actesLegislatifs ?? [];
      }
    } catch (error) {
      console.warn(
        "getDebats: échec de récupération des actes législatifs",
        dossierUid,
        error
      );
    }

    // Source principale : rattachement explicite du point d'ordre du jour.
    const pointOdjMeta = (pointsOdj.data ?? []).flatMap((point) => {
      const agenda = point.agendaRef;
      if (!agenda) return [];
      const debateType: DebateType =
        agenda.xsiType === "seance_type" ? "seance" : "commission";
      return debatesFromAgenda(
        agenda,
        null,
        getLectureLabel(agenda, debateType, dossierActs)
      );
    });

    // Source de secours pour les réunions de commission dont les PointOdj sont
    // absents. Un échec de ce complément ne doit pas masquer les débats déjà
    // trouvés par la source principale.
    let fallbackMeta: DebateMeta[] = [];
    try {
      fallbackMeta = await getCommissionFallbackMeta(dossierActs);
    } catch (error) {
      console.warn(
        "getDebats: échec du fallback des réunions de commission",
        dossierUid,
        error
      );
    }

    const debatsWithMeta = [...pointOdjMeta, ...fallbackMeta];
    if (debatsWithMeta.length === 0) return [];

    // Dédupliquer par uid (un même compte rendu peut apparaître via plusieurs
    // points ODJ ou via les deux stratégies de rattachement).
    const seen = new Set<string>();
    const uniqueMeta = debatsWithMeta.filter(({ uid }) => {
      if (seen.has(uid)) return false;
      seen.add(uid);
      return true;
    });

    // Chaque débat est récupéré indépendamment : un échec réseau isolé ne doit
    // pas faire échouer toute la liste (sinon la tab entière disparaît).
    const items = await Promise.all(
      uniqueMeta.map(
        async ({ uid, debateType, organeLibelle, reunionDate, lectureLabel }) => {
          try {
            const r = await fetch(
              `${apiUrl}/debats/${uid}?include=_count.paragraphes`
            );
            if (!r.ok) return null;
            const { data } = await r.json();
            if (!data) return null;
            if (data.dateSeance) data.dateSeance = new Date(data.dateSeance);
            return {
              ...data,
              debateType,
              organeLibelle,
              reunionDate,
              lectureLabel,
            } as ReturnedDebat;
          } catch {
            return null;
          }
        }
      )
    );

    return items
      .filter((item): item is ReturnedDebat => item !== null)
      .sort((a, b) => {
        const da = a.reunionDate
          ? new Date(a.reunionDate).getTime()
          : a.dateSeance
            ? new Date(a.dateSeance).getTime()
            : 0;
        const db = b.reunionDate
          ? new Date(b.reunionDate).getTime()
          : b.dateSeance
            ? new Date(b.dateSeance).getTime()
            : 0;
        return da - db; // croissant : plus ancien en premier (ordre chronologique)
      });
  } catch (error) {
    // Échec géré et non bloquant : warn (et non error) pour ne pas déclencher
    // l'overlay Next.js en dev.
    console.warn("getDebats: échec de récupération", dossierUid, error);
    return null;
  }
}

export type ReturnedDebat = Debat & {
  _count: { paragraphes: number };
  debateType: DebateType;
  organeLibelle: string | null;
  reunionDate: string | null;
  lectureLabel: string | null;
};

export const getDebats = React.cache(getDebatsUnCached);
