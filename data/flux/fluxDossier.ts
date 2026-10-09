import { getParlementDb } from "@/lib/mongodb";
import { getOrgane } from "@/data/getOrgane";
import type { Flux } from "@/lib/rss";
import { cacheTricoteuses } from "@/data/cacheTricoteuses";
import {
  elementsAmendements,
  elementsDesActes,
  organesACharger,
  type ActeDossier,
  type AmendementsDuJour,
} from "./actesDossier";

/** Jours d'amendements repris dans le flux (les plus récents). */
const JOURS_AMENDEMENTS = 30;
const AUTEURS_CITES = 3;

type DossierApi = {
  uid: string;
  legislature?: number | null;
  titreDossier?: { titre?: string | null } | null;
  titre?: string | null;
  actesLegislatifs?: ActeDossier[];
};

/**
 * Lit le dossier et ses actes avec les scrutins rattachés, en un appel.
 * Lève une erreur si l'API est en panne : le flux répond alors en erreur
 * (et l'ancienne version reste servie) plutôt que de publier un flux vide.
 */
async function lireDossierApi(uid: string): Promise<DossierApi | null> {
  const rep = await fetch(
    `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/dossiers/${encodeURIComponent(uid)}?include=actesLegislatifs.voteRefs.voteRef`,
    cacheTricoteuses("contenu"),
  );
  if (rep.status === 404) return null;
  if (!rep.ok) throw new Error(`API dossiers : HTTP ${rep.status}`);
  const { data } = await rep.json();
  return data ?? null;
}

/**
 * Missions d'information et commissions d'enquête : absentes de l'API, seules
 * leurs métadonnées sont en base (cf. getDossier).
 */
async function lireDossierMongo(uid: string): Promise<DossierApi | null> {
  const db = await getParlementDb();
  const d = await db
    .collection("dossiers")
    .findOne({ uid }, { projection: { _id: 0, uid: 1, legislature: 1, "titreDossier.titre": 1 } });
  return d ? { uid: d.uid, legislature: Number(d.legislature), titreDossier: d.titreDossier } : null;
}

/**
 * Amendements AN du dossier, regroupés par jour de dépôt. Même chaîne que les
 * alertes : textes AN du dossier (`documents`) puis amendements par
 * `texteLegislatifRef` (indexé).
 */
async function lireAmendementsParJour(dossierUid: string): Promise<AmendementsDuJour[]> {
  const db = await getParlementDb();
  const textes = await db
    .collection("documents")
    .find({ dossierRef: dossierUid, uid: { $regex: /^[A-Z]{4}ANR/ } }, { projection: { _id: 0, uid: 1 } })
    .toArray();
  const texteUids = textes.map((t) => t.uid).filter(Boolean);
  if (texteUids.length === 0) return [];

  const groupes = await db
    .collection("amendements")
    .aggregate<{ _id: { jour: string; type: string | null; auteur: unknown }; n: number }>([
      { $match: { texteLegislatifRef: { $in: texteUids }, "cycleDeVie.dateDepot": { $type: "string" } } },
      {
        $group: {
          _id: {
            jour: "$cycleDeVie.dateDepot",
            type: "$signataires.auteur.typeAuteur",
            auteur: "$signataires.auteur.acteurRef",
          },
          n: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const parJour = new Map<string, { total: number; gouvernement: number; auteurs: Map<string, number> }>();
  for (const { _id, n } of groupes) {
    const jour = _id.jour.slice(0, 10);
    const entree = parJour.get(jour) ?? { total: 0, gouvernement: 0, auteurs: new Map() };
    entree.total += n;
    if (_id.type === "Gouvernement") entree.gouvernement += n;
    // acteurRef vaut un objet { @xsi:nil } pour le Gouvernement.
    else if (typeof _id.auteur === "string") {
      entree.auteurs.set(_id.auteur, (entree.auteurs.get(_id.auteur) ?? 0) + n);
    }
    parJour.set(jour, entree);
  }

  const jours = [...parJour.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, JOURS_AMENDEMENTS)
    .map(([jour, e]) => ({
      jour,
      total: e.total,
      gouvernement: e.gouvernement,
      auteurs: [...e.auteurs.entries()].sort((a, b) => b[1] - a[1]).slice(0, AUTEURS_CITES),
    }));

  const uids = Array.from(new Set(jours.flatMap((j) => j.auteurs.map(([uid]) => uid))));
  const acteurs = await db
    .collection("acteurs")
    .find({ uid: { $in: uids } }, { projection: { _id: 0, uid: 1, "etatCivil.ident": 1 } })
    .toArray();
  const noms = new Map(
    acteurs.map((a) => [a.uid, `${a.etatCivil?.ident?.prenom ?? ""} ${a.etatCivil?.ident?.nom ?? ""}`.trim()]),
  );

  return jours.map((j) => ({
    ...j,
    auteurs: j.auteurs.flatMap(([uid, nombre]) => {
      const nom = noms.get(uid);
      return nom ? [{ nom, nombre }] : [];
    }),
  }));
}

export async function getFluxDossier(legislature: string, uid: string): Promise<Flux | null> {
  const dossier = (await lireDossierApi(uid)) ?? (await lireDossierMongo(uid));
  if (!dossier) return null;

  const actes = dossier.actesLegislatifs ?? [];
  const [organes, amendements] = await Promise.all([
    Promise.all(
      organesACharger(actes).map(async (o) => [o, (await getOrgane(o))?.libelle ?? null] as const),
    ),
    lireAmendementsParJour(uid),
  ]);

  const base = `/${legislature}/dossier/${uid}`;
  const titre = dossier.titreDossier?.titre?.trim() || dossier.titre?.trim() || "Dossier législatif";
  return {
    titre: `${titre} — NosDéputés.fr`,
    lien: base,
    chemin: `${base}/rss.xml`,
    description: `Avancée du dossier « ${titre} » à l'Assemblée nationale : étapes, votes et amendements déposés.`,
    elements: [
      ...elementsDesActes(actes, {
        base,
        organes: new Map(organes.filter((o): o is readonly [string, string] => o[1] !== null)),
      }),
      ...elementsAmendements(amendements, { base, dossierUid: uid }),
    ],
  };
}
