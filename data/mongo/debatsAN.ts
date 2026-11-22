import type { Debat } from "@prisma/client";
import { getParlementDb } from "@/lib/mongodb";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";
import {
  DOSSIER_SPECIFIC_COMMISSION_TYPES,
  debatesFromAgenda,
  getLectureLabel,
  isCommissionAct,
  type AgendaWithDebates,
  type DebateMeta,
  type DossierAct,
  type ReturnedDebat,
} from "../getDebats";
import { dossierDepuisAN } from "./conversionDossierAN";
import { getOrganesAN } from "./referentielAN";
import { valeur } from "./conversionAN";

/**
 * Débats d'un dossier (séances publiques et réunions de commission) lus dans
 * notre base plutôt que dans l'API Tricoteuses, qui demandait 5 à 30 appels
 * par dossier. Les règles de sélection (compte rendu retenu, lecture, réunions
 * de secours) sont celles de getDebats, appliquées aux mêmes données :
 *
 * - réunions dont un point de l'ordre du jour cite le dossier (collection
 *   `reunions`, ODJ.pointsODJ.pointODJ.dossiersLegislatifsRefs) ;
 * - à défaut, réunions citées par un acte de commission du dossier, et toutes
 *   celles d'une commission créée pour ce dossier ;
 * - débat = compte rendu de la réunion (collection `comptes_rendus`).
 *
 * Une réunion récente peut n'avoir encore qu'une transcription provisoire,
 * que nous n'importons pas : pour ces réunions seulement, on interroge l'API.
 *
 * Serveur uniquement. `null` si le dossier est absent de la base.
 */

type Brut = Record<string, unknown>;

const objet = (brut: unknown): Brut =>
  brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Brut) : {};

const XSI_COMMISSION = "reunionCommission_type";

/**
 * "20261112090000000" → "2026-11-12T09:00:00.000Z". L'heure est celle de
 * Paris, mais l'API la rendait telle quelle comme une heure UTC : on garde la
 * même convention pour que l'affichage ne change pas.
 */
export function dateSeance(brut: unknown): string | null {
  const m = valeur(brut)?.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.000Z` : null;
}

function isoReel(brut: unknown): string | null {
  const texte = valeur(brut);
  if (!texte) return null;
  const date = new Date(texte);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Compte rendu brut → `Debat` au format de l'API. */
function debatDepuisAN(cr: Brut, taille: number): Debat & { _count: { paragraphes: number } } {
  const md = objet(cr.metadonnees);
  const legislature = Number.parseInt(valeur(md.legislature) ?? "", 10);
  const debat = {
    uid: cr.uid,
    dataset: 17,
    chambre: "AN",
    typeAssemblee: valeur(md.typeAssemblee) ?? "AN",
    legislature: Number.isFinite(legislature) ? legislature : null,
    reunionRefUid: valeur(cr.seanceRef),
    sessionRef: valeur(cr.sessionRef) ?? "",
    dateSeance: dateSeance(md.dateSeance),
    dateSeanceJour: valeur(md.dateSeanceJour) ?? "",
    numSeance: valeur(md.numSeance) ?? "",
    numSeanceJour: valeur(md.numSeanceJour) ?? "",
    diffusion: valeur(md.diffusion) ?? "",
    environnement: valeur(md.environnement) ?? "",
    etat: valeur(md.etat) ?? "",
    version: valeur(md.version) ?? "",
    heureGeneration: isoReel(md.heureGeneration),
    nomFichierJo: valeur(md.nomFichierJo) ?? "",
    session: valeur(md.session) ?? "",
    validite: valeur(md.validite) ?? "",
    quantiemesJournee: "",
    quantiemesSession: valeur(md.session) ?? "",
    presidentSeance: valeur(objet(objet(md.sommaire).presidentSeance)._),
    // Les pages ne comparent ce nombre qu'à zéro (débat vide masqué). Compter
    // les paragraphes obligerait à transférer des comptes rendus de plusieurs
    // mégaoctets : un contenu non vide vaut ici « au moins un paragraphe ».
    _count: { paragraphes: taille > TAILLE_CONTENU_VIDE ? 1 : 0 },
  };
  return debat as unknown as Debat & { _count: { paragraphes: number } };
}

/** Taille BSON d'un `contenu` vide ou squelettique ; le plus petit réel fait ~900 octets. */
const TAILLE_CONTENU_VIDE = 200;

function agendaDepuisAN(reunion: Brut, debats: Debat[]): AgendaWithDebates {
  return {
    uid: reunion.uid as string,
    chambre: "AN",
    xsiType: valeur(reunion["@xsi:type"]) ?? undefined,
    etat: valeur(objet(reunion.cycleDeVie).etat) ?? undefined,
    timestampDebut: isoReel(reunion.timeStampDebut),
    organeReunionRefUid: valeur(reunion.organeReuniRef),
    organeLibelle: null,
    compteRenduRefUid: valeur(reunion.compteRenduRef),
    transcriptionRefUid: null,
    compteRenduRef: debats,
  };
}

export async function getDebatsAN(dossierUid: string): Promise<ReturnedDebat[] | null> {
  const db = await getParlementDb();
  const dossierBrut = await db
    .collection("dossiers")
    .findOne({ uid: dossierUid }, { projection: { _id: 0, heatComponents: 0, enrichmentKeywords: 0 } });
  if (!dossierBrut) return null;

  // Actes du dossier, avec l'organe que les règles de lecture consultent.
  const actes = dossierDepuisAN(dossierBrut as unknown as Parameters<typeof dossierDepuisAN>[0]).actesLegislatifs;
  const organes = await getOrganesAN([...new Set(actes.map((a) => a.organeRefUid).filter((u): u is string => !!u))]);
  const acts: DossierAct[] = actes.map((a) => {
    const organe = a.organeRefUid ? organes.get(a.organeRefUid) : undefined;
    return {
      chambre: a.chambre,
      codeActe: a.codeActe,
      dateActe: a.dateActe ? String(a.dateActe) : null,
      organeRefUid: a.organeRefUid,
      reunionRefUid: a.reunionRefUid,
      organeRef: organe ? { uid: organe.uid, codeType: organe.codeType, libelle: organe.libelle } : null,
    };
  });

  // Réunions : par l'ordre du jour, puis les réunions de secours.
  const commissionActs = acts.filter(isCommissionAct);
  const reunionsActes = [...new Set(commissionActs.map((a) => a.reunionRefUid).filter((u): u is string => !!u))];
  const organesDedies = [
    ...new Set(
      commissionActs
        .filter((a) => a.organeRef?.codeType && DOSSIER_SPECIFIC_COMMISSION_TYPES.has(a.organeRef.codeType))
        .map((a) => a.organeRefUid ?? a.organeRef?.uid)
        .filter((u): u is string => !!u)
    ),
  ];
  const projection = { _id: 0, uid: 1, "@xsi:type": 1, cycleDeVie: 1, timeStampDebut: 1, organeReuniRef: 1, compteRenduRef: 1 };
  const [parOdj, parActes, parOrganes] = await Promise.all([
    db.collection("reunions").find({ "ODJ.pointsODJ.pointODJ.dossiersLegislatifsRefs.dossierRef": dossierUid }, { projection }).toArray(),
    reunionsActes.length
      ? db.collection("reunions").find({ uid: { $in: reunionsActes } }, { projection }).toArray()
      : Promise.resolve([]),
    organesDedies.length
      ? db.collection("reunions").find({ organeReuniRef: { $in: organesDedies } }, { projection }).toArray()
      : Promise.resolve([]),
  ]);

  // Comptes rendus de toutes ces réunions, avec la taille de leur contenu
  // (calculée par la base, sans transférer le texte).
  const toutes = [...parOdj, ...parActes, ...parOrganes] as Brut[];
  const uidsReunions = [...new Set(toutes.map((r) => r.uid as string))];
  const uidsCr = [...new Set(toutes.map((r) => valeur(r.compteRenduRef)).filter((u): u is string => !!u))];
  const comptesRendus = await db
    .collection("comptes_rendus")
    .aggregate([
      { $match: { $or: [{ uid: { $in: uidsCr } }, { seanceRef: { $in: uidsReunions } }] } },
      {
        $project: {
          _id: 0, uid: 1, seanceRef: 1, sessionRef: 1, metadonnees: 1,
          taille: { $bsonSize: { $ifNull: ["$contenu", {}] } },
        },
      },
    ])
    .toArray();
  const debatsParReunion = new Map<string, Debat[]>();
  const debatParUid = new Map<string, Debat & { _count: { paragraphes: number } }>();
  for (const cr of comptesRendus as Brut[]) {
    const debat = debatDepuisAN(cr, Number(cr.taille) || 0);
    debatParUid.set(debat.uid, debat);
    for (const reunion of toutes) {
      if (cr.uid === valeur(reunion.compteRenduRef) || cr.seanceRef === reunion.uid) {
        const uid = reunion.uid as string;
        debatsParReunion.set(uid, [...(debatsParReunion.get(uid) ?? []).filter((d) => d.uid !== debat.uid), debat]);
      }
    }
  }

  // Réunions tenues sans compte rendu dans notre base : peut-être une
  // transcription provisoire, connue de la seule API.
  const maintenant = Date.now();
  const agendaDe = async (reunion: Brut): Promise<AgendaWithDebates> => {
    const agenda = agendaDepuisAN(reunion, debatsParReunion.get(reunion.uid as string) ?? []);
    const passee = agenda.timestampDebut && new Date(agenda.timestampDebut).getTime() < maintenant;
    if (agenda.compteRenduRef?.length || !passee || ["Annulé", "Supprimé"].includes(agenda.etat ?? "")) {
      return agenda;
    }
    const api = await reunionApi(agenda.uid!);
    return api?.compteRenduRef?.length ? { ...agenda, ...api, timestampDebut: agenda.timestampDebut } : agenda;
  };

  const metaOdj = (await Promise.all(parOdj.map((r) => agendaDe(r as Brut)))).flatMap((agenda) => {
    const debateType = agenda.xsiType === "seance_type" ? "seance" : "commission";
    return debatesFromAgenda(agenda, null, getLectureLabel(agenda, debateType, acts));
  });
  const metaActes = (await Promise.all(parActes.map((r) => agendaDe(r as Brut))))
    .filter((agenda) => agenda.xsiType === XSI_COMMISSION)
    .flatMap((agenda) => debatesFromAgenda(agenda, null, getLectureLabel(agenda, "commission", acts)));
  const metaOrganes = (await Promise.all(parOrganes.map((r) => agendaDe(r as Brut))))
    .filter((agenda) => agenda.xsiType === XSI_COMMISSION)
    .flatMap((agenda) => {
      const libelle = commissionActs.find((a) => (a.organeRefUid ?? a.organeRef?.uid) === agenda.organeReunionRefUid)?.organeRef?.libelle ?? null;
      return debatesFromAgenda(agenda, libelle, getLectureLabel(agenda, "commission", acts));
    });

  // Même ordre de priorité et même dédoublonnage que getDebats.
  const vus = new Set<string>();
  const metas: DebateMeta[] = [...metaOdj, ...metaActes, ...metaOrganes].filter(({ uid }) => {
    if (vus.has(uid)) return false;
    vus.add(uid);
    return true;
  });

  const items = await Promise.all(
    metas.map(async (meta) => {
      const debat = debatParUid.get(meta.uid) ?? (await debatApi(meta.uid));
      if (!debat) return null;
      return {
        ...debat,
        // Objet Date, comme le faisait getDebats à partir de l'API.
        dateSeance: debat.dateSeance ? new Date(debat.dateSeance) : debat.dateSeance,
        debateType: meta.debateType,
        organeLibelle: meta.organeLibelle,
        reunionDate: meta.reunionDate,
        lectureLabel: meta.lectureLabel,
      } as unknown as ReturnedDebat;
    })
  );

  const temps = (d: ReturnedDebat) =>
    d.reunionDate ? new Date(d.reunionDate).getTime() : d.dateSeance ? new Date(d.dateSeance).getTime() : 0;
  return items.filter((d): d is ReturnedDebat => d !== null).sort((a, b) => temps(a) - temps(b));
}

/** Réunion vue par l'API, avec ses comptes rendus et transcriptions. */
async function reunionApi(uid: string): Promise<AgendaWithDebates | null> {
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/reunions/${uid}?include=compteRenduRef`,
      { next: { revalidate: 3600 } }
    );
    if (!rep.ok) return null;
    const { data } = (await rep.json()) as { data?: AgendaWithDebates | null };
    return data ?? null;
  } catch {
    return null;
  }
}

/** Débat absent de notre base (transcription provisoire), lu dans l'API. */
async function debatApi(uid: string): Promise<(Debat & { _count: { paragraphes: number } }) | null> {
  try {
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/debats/${uid}?include=_count.paragraphes`,
      { next: { revalidate: 3600 } }
    );
    if (!rep.ok) return null;
    const { data } = await rep.json();
    if (!data) return null;
    return data;
  } catch {
    return null;
  }
}

/** Exposé pour les tests. */
export const pourTests = { dateSeance, debatDepuisAN, agendaDepuisAN };
