import { getParlementDb } from "@/lib/mongodb";
import { unique } from "@/utils/unique";
import { cacheTricoteuses } from "./cacheTricoteuses";
import { fetchTricoteuses } from "@/lib/fetchTricoteuses";
import { urlCompteRendu } from "@/lib/sourcesAN";

/**
 * Recherche plein-texte dans le verbatim des débats (séance + commission),
 * via l'API Tricoteuses (`/interventions?search=`), filtrée AN.
 *
 * Chaque résultat est ensuite enrichi d'un lien profond (`href`) vers la bonne
 * page dossier, en résolvant le dossier de deux manières :
 *   - directement via `dossierRefUid` ;
 *   - sinon via `reunionRefUid → organe → dossier` (titre identique), ce qui
 *     récupère les auditions de missions/commissions d'enquête non rattachées
 *     à un dossier dans la donnée brute.
 */
export type DebatSearchResult = {
  uid: string;
  texte: string;
  orateur: string | null;
  acteurRefUid: string | null;
  dateSeance: string | null;
  debatRefUid: string | null;
  reunionRefUid: string | null;
  dossierRefUid: string | null;
  /** Point de l'ordre du jour de la réunion, quand l'API le renseigne. */
  pointOdjRefUid: string | null;
  type: "seance" | "commission" | null;
  dossierUid: string | null;
  /** Intitulé du dossier législatif dont il est question, s'il est résolu. */
  dossierTitre: string | null;
  /** Page du dossier (aperçu), distincte du lien vers le compte rendu. */
  dossierHref: string | null;
  href: string | null;
  /** Slug du député quand l'orateur est un acteur AN (sinon intervenant extérieur). */
  deputeSlug: string | null;
  /** Position de l'intervention dans le compte rendu. */
  ordreAbsoluSeance: number | null;
  /**
   * Lieu et sujet du débat quand il ne se rattache à aucun dossier (audition,
   * table ronde…) : « Commission des affaires étrangères · Table ronde sur… ».
   */
  contexte: string | null;
  /** Compte rendu officiel de l'Assemblée, à défaut de page du débat sur le site. */
  lienOfficiel: string | null;
};

/** Slug député — identique au toSlug utilisé dans les liens de l'app. */
function toSlug(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function debatType(uid: string | null): "seance" | "commission" | null {
  if (!uid) return null;
  if (uid.startsWith("CRS")) return "seance";
  if (uid.startsWith("CRC")) return "commission";
  // Transcriptions vidéo (« TR-ANR5L17S2026IDC… ») : le type se lit dans
  // l'identifiant de la réunion, IDC pour une commission, IDS pour la séance.
  if (uid.startsWith("TR-")) {
    if (uid.includes("IDC")) return "commission";
    if (uid.includes("IDS")) return "seance";
  }
  return null;
}

const DOSSIER_UID = /DLR\d+L\d+N\d+/g;

/**
 * Dossier d'une intervention d'après l'ordre du jour de sa réunion : celui du
 * point auquel elle se rattache s'il est connu, sinon l'unique dossier cité.
 * Plusieurs dossiers sans point précis → aucun, plutôt qu'un lien au hasard.
 */
function dossierDeLOrdreDuJour(odj: any, pointOdjRefUid: string | null): string | null {
  if (!odj) return null;
  const points = ([] as any[]).concat(odj.pointsODJ?.pointODJ ?? []);
  const point = pointOdjRefUid ? points.find((p) => p?.uid === pointOdjRefUid) : null;
  const cites = [...new Set(JSON.stringify(point?.dossiersLegislatifsRefs ?? odj).match(DOSSIER_UID) ?? [])];
  return cites.length === 1 ? cites[0] : null;
}

function legislatureFrom(uid: string | null): string | null {
  if (!uid) return null;
  const m = uid.match(/L(\d+)/);
  return m ? m[1] : null;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type DossierInfo = { uid: string; leg: string | null; code: string | null; titre: string | null };

function avecAncre(href: string | null, ordre: number | null): string | null {
  return href && ordre != null ? `${href}#p-${ordre}` : href;
}

function buildHref(
  info: DossierInfo | null,
  debatRefUid: string | null,
  type: "seance" | "commission" | null
): string | null {
  if (!info || !info.leg || !debatRefUid) return null;
  // Missions d'information / commissions d'enquête → onglet comptes-rendus.
  if (info.code === "9" || info.code === "10") {
    return `/${info.leg}/dossier/${info.uid}/comptes-rendus/${debatRefUid}`;
  }
  if (type === "seance") return `/${info.leg}/dossier/${info.uid}/debat/${debatRefUid}`;
  if (type === "commission") return `/${info.leg}/dossier/${info.uid}/commission/${debatRefUid}`;
  return null;
}

type BaseResult = Omit<
  DebatSearchResult,
  "dossierUid" | "dossierTitre" | "dossierHref" | "href" | "deputeSlug" | "contexte" | "lienOfficiel"
>;

/* eslint-disable @typescript-eslint/no-explicit-any */
async function enrichWithHref(
  items: BaseResult[]
): Promise<DebatSearchResult[]> {
  if (items.length === 0) return [];
  try {
    const db = await getParlementDb();

    // Réunions de toutes les interventions sans dossier : leur ordre du jour
    // désigne souvent le texte examiné (transcriptions de commission surtout).
    const reunionsSansDossier = unique(
      items.filter((i) => !i.dossierRefUid && i.reunionRefUid).map((i) => i.reunionRefUid)
    ) as string[];
    // Résolution des orateurs députés (acteurRefUid) → slug pour lier la fiche.
    // Indépendante des réunions : les deux lectures partent ensemble.
    const acteurUids = unique(items.map((i) => i.acteurRefUid).filter(Boolean)) as string[];
    const [reunionsOdj, acteurs] = await Promise.all([
      reunionsSansDossier.length
        ? db
            .collection("reunions")
            .find({ uid: { $in: reunionsSansDossier } }, { projection: { _id: 0, uid: 1, ODJ: 1, organeReuniRef: 1 } })
            .toArray()
        : Promise.resolve([]),
      acteurUids.length
        ? db
            .collection("acteurs")
            .find(
              { uid: { $in: acteurUids } },
              { projection: { _id: 0, uid: 1, "etatCivil.ident.prenom": 1, "etatCivil.ident.nom": 1 } }
            )
            .toArray()
        : Promise.resolve([]),
    ]);
    const odjParReunion = new Map<string, any>(reunionsOdj.map((r: any) => [r.uid, r.ODJ]));
    const dossierParIntervention = new Map<string, string>();
    for (const i of items) {
      const uid = i.dossierRefUid
        ?? (i.reunionRefUid ? dossierDeLOrdreDuJour(odjParReunion.get(i.reunionRefUid), i.pointOdjRefUid) : null);
      if (uid) dossierParIntervention.set(i.uid, uid);
    }

    const directUids = unique([...dossierParIntervention.values()]) as string[];

    const acteurToSlug = new Map<string, string>(
      acteurs
        .map((a: any) => {
          const ident = a.etatCivil?.ident;
          if (!ident?.prenom || !ident?.nom) return null;
          return [a.uid, toSlug(ident.prenom, ident.nom)] as [string, string];
        })
        .filter(Boolean) as [string, string][]
    );

    const directDocs = directUids.length
      ? await db
          .collection("dossiers")
          .find(
            { uid: { $in: directUids } },
            {
              projection: {
                _id: 0, uid: 1, legislature: 1, "procedureParlementaire.code": 1,
                "titreDossier.titre": 1, "titres.titrePrincipal": 1,
              },
            }
          )
          .toArray()
      : [];

    const directMap = new Map<string, DossierInfo>(
      directDocs.map((d: any) => [
        d.uid,
        {
          uid: d.uid,
          leg: d.legislature != null ? String(d.legislature) : null,
          code: d.procedureParlementaire?.code ?? null,
          titre: d.titreDossier?.titre ?? d.titres?.titrePrincipal ?? null,
        },
      ])
    );

    // Chaîne réunion → organe → dossier (par titre) pour les auditions sans dossier.
    const reuToOrg = new Map<string, string>(
      reunionsOdj.filter((r: any) => r.organeReuniRef).map((r: any) => [r.uid, r.organeReuniRef])
    );
    const organeUids = unique([...reuToOrg.values()]) as string[];
    const organes = organeUids.length
      ? await db
          .collection("organes")
          .find({ uid: { $in: organeUids } }, { projection: { _id: 0, uid: 1, libelle: 1 } })
          .toArray()
      : [];
    const orgToTitre = new Map<string, string>(organes.map((o: any) => [o.uid, o.libelle]));
    const titres = unique([...orgToTitre.values()]) as string[];
    const missionDocs = titres.length
      ? await db
          .collection("dossiers")
          .find(
            { "titreDossier.titre": { $in: titres }, "procedureParlementaire.code": { $in: ["9", "10"] } },
            { projection: { _id: 0, uid: 1, legislature: 1, "titreDossier.titre": 1, "procedureParlementaire.code": 1 } }
          )
          .toArray()
      : [];
    const titreToDossier = new Map<string, DossierInfo>(
      missionDocs.map((d: any) => [
        d.titreDossier?.titre,
        {
          uid: d.uid,
          leg: d.legislature != null ? String(d.legislature) : null,
          code: d.procedureParlementaire?.code ?? null,
          titre: d.titreDossier?.titre ?? null,
        },
      ])
    );

    const resultats: DebatSearchResult[] = items.map((i) => {
      let info: DossierInfo | null = null;
      const dossierUid = dossierParIntervention.get(i.uid);
      if (dossierUid && directMap.has(dossierUid)) {
        info = directMap.get(dossierUid)!;
      } else if (i.reunionRefUid) {
        const orgUid = reuToOrg.get(i.reunionRefUid);
        const titre = orgUid ? orgToTitre.get(orgUid) : null;
        info = titre ? titreToDossier.get(titre) ?? null : null;
      }
      return {
        ...i,
        dossierUid: info?.uid ?? null,
        dossierTitre: info?.titre ?? null,
        dossierHref: info?.uid && info.leg ? `/${info.leg}/dossier/${info.uid}` : null,
        // Ancre de l'intervention : la page du débat s'y positionne.
        href: avecAncre(buildHref(info, i.debatRefUid, i.type), i.ordreAbsoluSeance),
        deputeSlug: i.acteurRefUid ? acteurToSlug.get(i.acteurRefUid) ?? null : null,
        contexte: null,
        lienOfficiel: null,
      };
    });
    return await completerSansDossier(resultats);
  } catch (error) {
    console.error("[searchInterventions] enrichissement erreur:", error);
    return items.map((i) => ({
      ...i,
      dossierUid: null,
      dossierTitre: null,
      dossierHref: null,
      href: null,
      deputeSlug: null,
      contexte: null,
      lienOfficiel: urlCompteRendu(i.debatRefUid),
    }));
  }
}

/**
 * Résultats sans dossier : même résolution que l'onglet Travaux des députés
 * (numéro du texte cité dans le compte rendu, ordre du jour, titre des
 * dossiers). S'il n'y a vraiment pas de dossier — audition, table ronde —, le
 * lieu et le sujet de la réunion, et le compte rendu officiel.
 */
async function completerSansDossier(resultats: DebatSearchResult[]): Promise<DebatSearchResult[]> {
  const aCompleter = resultats.filter((r) => !r.dossierUid && r.debatRefUid && r.type);
  if (aCompleter.length === 0) return resultats;
  try {
    const { resumerDebats } = await import("@/data/mongo/interventionsActeurAN");
    const debats = await resumerDebats(
      aCompleter.map((r) => ({
        compteRenduUid: r.debatRefUid!,
        date: (r.dateSeance ?? "").slice(0, 10),
        type: r.type!,
        paragraphes: r.ordreAbsoluSeance != null ? [{ ordre: r.ordreAbsoluSeance, presidence: false }] : [],
        reunionRefUid: r.reunionRefUid,
      }))
    );
    const parResultat = new Map(aCompleter.map((r, i) => [r.uid, debats[i]]));
    return resultats.map((r) => {
      const debat = parResultat.get(r.uid);
      if (!debat) return r;
      if (debat.dossierUid && debat.dossierLegislature && !debat.lienExterne) {
        return {
          ...r,
          dossierUid: debat.dossierUid,
          dossierTitre: debat.dossierTitre,
          dossierHref: `/${debat.dossierLegislature}/dossier/${debat.dossierUid}`,
          href: debat.lien,
        };
      }
      const sujet = debat.sujet && !/^(séance publique|réunion de commission)$/i.test(debat.sujet) ? debat.sujet : null;
      return {
        ...r,
        contexte: [debat.lieu, sujet].filter(Boolean).join(" · ") || null,
        lienOfficiel: urlCompteRendu(r.debatRefUid),
      };
    });
  } catch (erreur) {
    console.error("[searchInterventions] résolution des débats sans dossier :", erreur);
    return resultats.map((r) => (r.dossierUid ? r : { ...r, lienOfficiel: urlCompteRendu(r.debatRefUid) }));
  }
}

const CHAMPS_INTERVENTION =
  "uid,texte,orateur,acteurRefUid,dateSeance,debatRefUid,reunionRefUid,dossierRefUid,pointOdjRefUid,ordreAbsoluSeance";

/**
 * Longueur transmise au navigateur : la carte n'affiche que le début de
 * l'intervention (240 caractères), alors qu'une intervention peut dépasser
 * 20 000 caractères.
 */
const LONGUEUR_EXTRAIT = 400;

function extrait(texte: string): string {
  return texte.length > LONGUEUR_EXTRAIT ? `${texte.slice(0, LONGUEUR_EXTRAIT).trimEnd()}…` : texte;
}

/**
 * Requête transmise à l'API : une requête de plusieurs mots est cherchée comme
 * une expression exacte. Sans guillemets, l'API cherche chaque mot séparément :
 * « fin de vie » ramenait toute intervention contenant « fin » et « vie »
 * (aucune des 61 de la semaine mesurée ne parlait de fin de vie), contre 20 sur
 * 20 entre guillemets. Une requête déjà entre guillemets est laissée telle quelle.
 */
export function requeteDebats(query: string): string {
  const q = query.trim().replace(/\s+/g, " ");
  if (!q.includes(" ") || q.includes('"')) return q;
  return `"${q}"`;
}

export async function searchInterventions(
  query: string,
  options: {
    page?: number;
    perPage?: number;
    /** « date » : les plus récentes d'abord (alertes) ; sinon, pertinence. */
    tri?: "date";
  } = {}
): Promise<{ items: DebatSearchResult[]; total: number }> {
  const q = query.trim();
  if (q.length < 5) return { items: [], total: 0 };

  const { page = 1, perPage = 10, tri } = options;

  try {
    const params = new URLSearchParams({
      search: requeteDebats(q),
      chambre: "AN",
      perPage: String(perPage),
      page: String(page),
      // Sans sélection, chaque intervention arrive avec son vecteur de
      // recherche interne (~24 Ko) en plus du texte intégral.
      select: CHAMPS_INTERVENTION,
      ...(tri === "date" ? { sort: "dateSeance.desc" } : {}),
    });
    const rep = await fetchTricoteuses(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/interventions/?${params}`,
      cacheTricoteuses("contenu")
    );
    if (!rep.ok) return { items: [], total: 0 };

    const { data } = await rep.json();
    const total = parseInt(rep.headers.get("total") ?? "0", 10);

    const seen = new Set<string>();
    const base: BaseResult[] = [];
    for (const p of (data ?? []) as Record<string, unknown>[]) {
      const texte = stripHtml(String(p.texte ?? ""));
      if (!texte) continue;
      const key = texte.slice(0, 140).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const debatRefUid = (p.debatRefUid as string) ?? null;
      base.push({
        uid: String(p.uid),
        texte: extrait(texte),
        orateur: (p.orateur as string) ?? null,
        acteurRefUid: (p.acteurRefUid as string) ?? null,
        dateSeance: (p.dateSeance as string) ?? null,
        debatRefUid,
        reunionRefUid: (p.reunionRefUid as string) ?? null,
        dossierRefUid: (p.dossierRefUid as string) ?? null,
        pointOdjRefUid: (p.pointOdjRefUid as string) ?? null,
        type: debatType(debatRefUid),
        ordreAbsoluSeance: typeof p.ordreAbsoluSeance === "number" ? p.ordreAbsoluSeance : null,
      });
    }

    const items = await enrichWithHref(base);
    return { items, total };
  } catch (error) {
    console.error("[searchInterventions] erreur:", error);
    return { items: [], total: 0 };
  }
}

/** Au-delà, le compte est donné comme minimum (« plus de 1 000 interventions »). */
const PAGES_MAX_COMPTAGE = 10;

/**
 * Interventions et débats (séances, réunions) qui mentionnent la requête
 * depuis une date : les plus récentes d'abord, page par page, jusqu'à la
 * première antérieure. `null` si l'API ne répond pas.
 */
export async function compterDebatsDepuis(
  query: string,
  depuis: Date
): Promise<{ interventions: number; debats: number; complet: boolean } | null> {
  const q = query.trim();
  if (q.length < 5) return { interventions: 0, debats: 0, complet: true };
  let interventions = 0;
  const debats = new Set<string>();
  for (let page = 1; page <= PAGES_MAX_COMPTAGE; page++) {
    const params = new URLSearchParams({
      search: requeteDebats(q),
      chambre: "AN",
      perPage: "100",
      page: String(page),
      sort: "dateSeance.desc",
      select: "uid,dateSeance,debatRefUid",
    });
    try {
      const rep = await fetchTricoteuses(
        `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/interventions/?${params}`,
        cacheTricoteuses("contenu")
      );
      if (!rep.ok) return null;
      const { data } = await rep.json();
      if (!Array.isArray(data) || data.length === 0) return { interventions, debats: debats.size, complet: true };
      for (const p of data as { dateSeance?: string; debatRefUid?: string }[]) {
        if (!p.dateSeance || new Date(p.dateSeance) <= depuis) {
          return { interventions, debats: debats.size, complet: true };
        }
        interventions++;
        if (p.debatRefUid) debats.add(p.debatRefUid);
      }
    } catch (error) {
      console.error("[compterDebatsDepuis] erreur:", error);
      return null;
    }
  }
  return { interventions, debats: debats.size, complet: false };
}
