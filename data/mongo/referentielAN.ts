import type { AdresseElectronique, AdressePostale, Mandat, Organe } from "@prisma/client";
import { getParlementDb } from "@/lib/mongodb";
import couleursGroupes from "@/config/couleursGroupes.json";
import { fusionnerPeriodes, type PeriodeMandat } from "@/lib/periodesMandat";
import {
  acteurDepuisAN,
  adressesElectroniquesDepuisAN,
  adressesPostalesDepuisAN,
  mandatsDepuisAN,
  organeDepuisAN,
  scrutinsDuDossier,
  slugActeur,
  type ActeurAN,
} from "./conversionAN";

/**
 * Référentiel de l'Assemblée (acteurs, mandats, organes) lu dans notre base
 * plutôt que dans l'API Tricoteuses, dont la lenteur bloquait l'affichage des
 * fiches. Mêmes formes de données que l'API (cf. conversionAN.ts).
 *
 * Serveur uniquement. Chaque fonction rend `null` (ou une liste vide) quand la
 * donnée n'est pas dans notre base : l'appelant se replie alors sur l'API, qui
 * couvre aussi les législatures antérieures.
 */

const COULEURS = couleursGroupes as unknown as Record<string, string>;

/** Données de référence rechargées au plus toutes les heures (import nocturne). */
const DUREE_MEMOIRE_MS = 60 * 60 * 1000;

function memoire<T>(charger: () => Promise<T>): () => Promise<T> {
  let valeur: Promise<T> | null = null;
  let chargeLe = 0;
  return () => {
    if (!valeur || Date.now() - chargeLe > DUREE_MEMOIRE_MS) {
      chargeLe = Date.now();
      valeur = charger().catch((erreur) => {
        valeur = null; // nouvel essai au prochain appel
        throw erreur;
      });
    }
    return valeur;
  };
}

/**
 * Tous les organes (moins d'un millier), convertis une fois : une fiche député
 * en consulte des dizaines, autant ne pas multiplier les requêtes.
 */
const chargerOrganes = memoire(async () => {
  const db = await getParlementDb();
  const bruts = await db.collection("organes").find({}, { projection: { _id: 0 } }).toArray();
  const organes = new Map<string, Organe>();
  const clos = new Set<string>();
  for (const brut of bruts) {
    if (!brut.uid) continue;
    organes.set(brut.uid, organeDepuisAN(brut, COULEURS));
    if (typeof brut.viMoDe?.dateFin === "string") clos.add(brut.uid);
  }
  return { organes, clos };
});

/** Slug → uid, calculé sur l'identité de chaque acteur. */
const chargerSlugs = memoire(async () => {
  const db = await getParlementDb();
  const idents = await db
    .collection("acteurs")
    .find({}, { projection: { _id: 0, uid: 1, "etatCivil.ident": 1 } })
    .toArray();
  const parSlug = new Map<string, string[]>();
  for (const { uid, etatCivil } of idents as any[]) {
    const slug = slugActeur(String(etatCivil?.ident?.prenom ?? ""), String(etatCivil?.ident?.nom ?? ""));
    parSlug.set(slug, [...(parSlug.get(slug) ?? []), uid]);
  }
  return parSlug;
});

export async function getOrganeAN(uid: string): Promise<Organe | null> {
  try {
    const { organes } = await chargerOrganes();
    return organes.get(uid) ?? null;
  } catch (erreur) {
    console.warn("getOrganeAN: lecture impossible", uid, erreur);
    return null;
  }
}

/** Organes trouvés dans notre base ; les absents ne figurent pas dans la Map. */
export async function getOrganesAN(uids: string[]): Promise<Map<string, Organe>> {
  try {
    const { organes } = await chargerOrganes();
    return new Map(
      uids.flatMap((uid) => {
        const organe = organes.get(uid);
        return organe ? [[uid, organe] as const] : [];
      })
    );
  } catch (erreur) {
    console.warn("getOrganesAN: lecture impossible", erreur);
    return new Map();
  }
}

export type ActeurReferentiel = ActeurAN & { groupeParlementaire: Organe | null };

async function completer(brut: any): Promise<ActeurReferentiel> {
  const { organes, clos } = await chargerOrganes();
  const acteur = acteurDepuisAN(brut, clos);
  return {
    ...acteur,
    groupeParlementaire: acteur.groupeParlementaireUid
      ? organes.get(acteur.groupeParlementaireUid) ?? null
      : null,
  };
}

async function acteursBruts(uids: string[]): Promise<any[]> {
  if (uids.length === 0) return [];
  const db = await getParlementDb();
  return db
    .collection("acteurs")
    .find({ uid: { $in: uids } }, { projection: { _id: 0 } })
    .toArray();
}

export async function getActeurAN(uid: string): Promise<ActeurReferentiel | null> {
  return (await getActeursAN([uid]))[0] ?? null;
}

/** Acteurs trouvés dans notre base, dans un ordre quelconque. */
export async function getActeursAN(uids: string[]): Promise<ActeurReferentiel[]> {
  try {
    const bruts = await acteursBruts([...new Set(uids)]);
    return await Promise.all(bruts.map(completer));
  } catch (erreur) {
    console.warn("getActeursAN: lecture impossible", erreur);
    return [];
  }
}

/**
 * Acteur d'après le slug de son URL. Deux homonymes partageraient un slug :
 * on retient alors celui qui est en activité.
 */
export async function getActeurParSlugAN(slug: string): Promise<ActeurReferentiel | null> {
  try {
    const uids = (await chargerSlugs()).get(slug) ?? [];
    const acteurs = await getActeursAN(uids);
    return acteurs.find((a) => a.actif) ?? acteurs[0] ?? null;
  } catch (erreur) {
    console.warn("getActeurParSlugAN: lecture impossible", slug, erreur);
    return null;
  }
}

/** Mandats en cours, avec leur organe. `null` si l'acteur est absent de la base. */
export async function getMandatsActifsAN(
  acteurUid: string
): Promise<(Mandat & { organeRef: Organe | null })[] | null> {
  try {
    const [brut] = await acteursBruts([acteurUid]);
    if (!brut) return null;
    const { organes, clos } = await chargerOrganes();
    return mandatsDepuisAN(brut, clos)
      .filter((m) => m.actif)
      .map((m) => ({ ...m, organeRef: m.organeRefUid ? organes.get(m.organeRefUid) ?? null : null }));
  } catch (erreur) {
    console.warn("getMandatsActifsAN: lecture impossible", acteurUid, erreur);
    return null;
  }
}

/**
 * Périodes de mandat de député d'un acteur pendant la législature, fusionnées.
 * `null` si l'acteur est absent de la base.
 */
export async function getPeriodesMandatAN(
  acteurUid: string,
  legislature = 17
): Promise<PeriodeMandat[] | null> {
  try {
    const [brut] = await acteursBruts([acteurUid]);
    if (!brut) return null;
    const jour = (valeur: unknown) =>
      typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}/.test(valeur) ? valeur.slice(0, 10) : null;
    const mandats = [brut.mandats?.mandat].flat().filter(Boolean) as Record<string, unknown>[];
    return fusionnerPeriodes(
      mandats
        .filter((m) => m.typeOrgane === "ASSEMBLEE" && String(m.legislature) === String(legislature))
        .flatMap((m) => {
          const debut = jour(m.dateDebut);
          return debut ? [{ debut, fin: jour(m.dateFin) }] : [];
        })
    );
  } catch (erreur) {
    console.warn("getPeriodesMandatAN: lecture impossible", acteurUid, erreur);
    return null;
  }
}

/** Adresses d'un acteur. `null` si l'acteur est absent de la base. */
export async function getAdressesAN(acteurUid: string): Promise<{
  electroniques: AdresseElectronique[];
  postales: AdressePostale[];
} | null> {
  try {
    const db = await getParlementDb();
    const brut = await db
      .collection("acteurs")
      .findOne({ uid: acteurUid }, { projection: { _id: 0, uid: 1, adresses: 1 } });
    if (!brut) return null;
    return {
      electroniques: adressesElectroniquesDepuisAN(brut),
      postales: adressesPostalesDepuisAN(brut),
    };
  } catch (erreur) {
    console.warn("getAdressesAN: lecture impossible", acteurUid, erreur);
    return null;
  }
}

/**
 * Nombre d'amendements déposés à l'Assemblée sur les textes d'un dossier, et
 * nombre de scrutins rattachés à ses actes. `null` si le dossier est absent de
 * notre base (dossier trop récent pour l'import nocturne).
 */
export async function getCompteursDossierAN(
  dossierUid: string
): Promise<{ amendements: number; scrutins: number } | null> {
  try {
    const db = await getParlementDb();
    const dossier = await db
      .collection("dossiers")
      .findOne({ uid: dossierUid }, { projection: { _id: 0, actesLegislatifs: 1 } });
    if (!dossier) return null;
    const textes = await db
      .collection("documents")
      .find({ dossierRef: dossierUid }, { projection: { _id: 0, uid: 1 } })
      .toArray();
    const amendements = textes.length
      ? await db
          .collection("amendements")
          .countDocuments({ texteLegislatifRef: { $in: textes.map((t) => t.uid) } })
      : 0;
    return { amendements, scrutins: scrutinsDuDossier(dossier.actesLegislatifs).length };
  } catch (erreur) {
    console.warn("getCompteursDossierAN: lecture impossible", dossierUid, erreur);
    return null;
  }
}
