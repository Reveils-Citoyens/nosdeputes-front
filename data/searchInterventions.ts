import { getParlementDb } from "@/lib/mongodb";
import { unique } from "@/utils/unique";

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
  type: "seance" | "commission" | null;
  dossierUid: string | null;
  href: string | null;
  /** Slug du député quand l'orateur est un acteur AN (sinon intervenant extérieur). */
  deputeSlug: string | null;
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
  return null;
}

function legislatureFrom(uid: string | null): string | null {
  if (!uid) return null;
  const m = uid.match(/L(\d+)/);
  return m ? m[1] : null;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type DossierInfo = { uid: string; leg: string | null; code: string | null };

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

/* eslint-disable @typescript-eslint/no-explicit-any */
async function enrichWithHref(
  items: Omit<DebatSearchResult, "dossierUid" | "href" | "deputeSlug">[]
): Promise<DebatSearchResult[]> {
  if (items.length === 0) return [];
  try {
    const db = await getParlementDb();

    const directUids = unique(
      items.map((i) => i.dossierRefUid).filter(Boolean)
    ) as string[];
    const reunionUids = unique(
      items.filter((i) => !i.dossierRefUid && i.reunionRefUid).map((i) => i.reunionRefUid)
    ) as string[];

    // Résolution des orateurs députés (acteurRefUid) → slug pour lier la fiche.
    const acteurUids = unique(items.map((i) => i.acteurRefUid).filter(Boolean)) as string[];
    const acteurs = acteurUids.length
      ? await db
          .collection("acteurs")
          .find(
            { uid: { $in: acteurUids } },
            { projection: { _id: 0, uid: 1, "etatCivil.ident.prenom": 1, "etatCivil.ident.nom": 1 } }
          )
          .toArray()
      : [];
    const acteurToSlug = new Map<string, string>(
      acteurs
        .map((a: any) => {
          const ident = a.etatCivil?.ident;
          if (!ident?.prenom || !ident?.nom) return null;
          return [a.uid, toSlug(ident.prenom, ident.nom)] as [string, string];
        })
        .filter(Boolean) as [string, string][]
    );

    const [directDocs, reunionDocs] = await Promise.all([
      directUids.length
        ? db
            .collection("dossiers")
            .find(
              { uid: { $in: directUids } },
              { projection: { _id: 0, uid: 1, legislature: 1, "procedureParlementaire.code": 1 } }
            )
            .toArray()
        : Promise.resolve([]),
      reunionUids.length
        ? db
            .collection("reunions")
            .find(
              { uid: { $in: reunionUids } },
              { projection: { _id: 0, uid: 1, organeReuniRef: 1 } }
            )
            .toArray()
        : Promise.resolve([]),
    ]);

    const directMap = new Map<string, DossierInfo>(
      directDocs.map((d: any) => [
        d.uid,
        { uid: d.uid, leg: d.legislature != null ? String(d.legislature) : null, code: d.procedureParlementaire?.code ?? null },
      ])
    );

    // Chaîne réunion → organe → dossier (par titre) pour les auditions sans dossier.
    const reuToOrg = new Map<string, string>(
      reunionDocs.filter((r: any) => r.organeReuniRef).map((r: any) => [r.uid, r.organeReuniRef])
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
        { uid: d.uid, leg: d.legislature != null ? String(d.legislature) : null, code: d.procedureParlementaire?.code ?? null },
      ])
    );

    return items.map((i) => {
      let info: DossierInfo | null = null;
      if (i.dossierRefUid && directMap.has(i.dossierRefUid)) {
        info = directMap.get(i.dossierRefUid)!;
      } else if (i.reunionRefUid) {
        const orgUid = reuToOrg.get(i.reunionRefUid);
        const titre = orgUid ? orgToTitre.get(orgUid) : null;
        info = titre ? titreToDossier.get(titre) ?? null : null;
      }
      return {
        ...i,
        dossierUid: info?.uid ?? null,
        href: buildHref(info, i.debatRefUid, i.type),
        deputeSlug: i.acteurRefUid ? acteurToSlug.get(i.acteurRefUid) ?? null : null,
      };
    });
  } catch (error) {
    console.error("[searchInterventions] enrichissement erreur:", error);
    return items.map((i) => ({ ...i, dossierUid: null, href: null, deputeSlug: null }));
  }
}

export async function searchInterventions(
  query: string,
  options: { page?: number; perPage?: number } = {}
): Promise<{ items: DebatSearchResult[]; total: number }> {
  const q = query.trim();
  if (q.length < 5) return { items: [], total: 0 };

  const { page = 1, perPage = 10 } = options;

  try {
    const params = new URLSearchParams({
      search: q,
      chambre: "AN",
      perPage: String(perPage),
      page: String(page),
    });
    const rep = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/interventions/?${params}`
    );
    if (!rep.ok) return { items: [], total: 0 };

    const { data } = await rep.json();
    const total = parseInt(rep.headers.get("total") ?? "0", 10);

    const seen = new Set<string>();
    const base: Omit<DebatSearchResult, "dossierUid" | "href" | "deputeSlug">[] = [];
    for (const p of (data ?? []) as Record<string, unknown>[]) {
      const texte = stripHtml(String(p.texte ?? ""));
      if (!texte) continue;
      const key = texte.slice(0, 140).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const debatRefUid = (p.debatRefUid as string) ?? null;
      base.push({
        uid: String(p.uid),
        texte,
        orateur: (p.orateur as string) ?? null,
        acteurRefUid: (p.acteurRefUid as string) ?? null,
        dateSeance: (p.dateSeance as string) ?? null,
        debatRefUid,
        reunionRefUid: (p.reunionRefUid as string) ?? null,
        dossierRefUid: (p.dossierRefUid as string) ?? null,
        type: debatType(debatRefUid),
      });
    }

    const items = await enrichWithHref(base);
    return { items, total };
  } catch (error) {
    console.error("[searchInterventions] erreur:", error);
    return { items: [], total: 0 };
  }
}
