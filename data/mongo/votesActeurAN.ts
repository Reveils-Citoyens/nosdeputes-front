import { getParlementDb } from "@/lib/mongodb";
import type { PaginatedResponse } from "@/data/pagination";
import { liste, valeur } from "./conversionAN";
import { normaliserTexte } from "./rechercheTexte";

/**
 * Votes d'un député (onglet « Votes » de sa page), lus dans notre base
 * (collection `scrutins`, décompte nominatif) plutôt que dans l'API
 * Tricoteuses. Serveur uniquement.
 *
 * Même liste et même ordre que l'API (`/votes?acteurRefUid=…`, date
 * décroissante) ; filtres par position et par type de scrutin (« solennels »).
 * La recherche porte sur l'objet du scrutin et le titre de son dossier, sans
 * tenir compte des accents, ainsi que sur son numéro.
 */

type Brut = Record<string, unknown>;
const objet = (brut: unknown): Brut =>
  brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Brut) : {};

/** Rubrique du décompte nominatif → position de vote, au format de l'API. */
const POSITIONS = { pours: "pour", contres: "contre", abstentions: "abstention", nonVotants: "nonVotant" } as const;
type Position = (typeof POSITIONS)[keyof typeof POSITIONS];
const CHEMIN = "ventilationVotes.organe.groupes.groupe.vote.decompteNominatif";

type VoteLeger = {
  scrutinUid: string;
  position: Position;
  numero: number;
  dateScrutin: string | null;
  codeTypeVote: string | null;
  /** Texte où chercher : objet du scrutin et titre de son dossier, normalisés. */
  recherche: string;
};

export type VoteActeur = {
  uid: string;
  acteurRefUid: string;
  positionVote: Position;
  causePositionVote: string | null;
  parDelegation: boolean | null;
  mandatRefUid: string | null;
  scrutinRefUid: string;
  codeTypeVote: string | null;
  dateVote: string | null;
  scrutinRef: {
    uid: string;
    numero: string | null;
    titre: string | null;
    dateScrutin: string | null;
    code: string | null;
    annonce: string | null;
    libelleTypeVote: string | null;
    demandeur: string | null;
    pour: number;
    contre: number;
    abstentions: number;
    nonVotants: number;
    dossierRefUid: string | null;
    dossierRef: { uid: string; titre: string | null; legislature: number | null } | null;
  };
};

const jourISO = (brut: unknown) => {
  const texte = valeur(brut);
  return texte && /^\d{4}-\d{2}-\d{2}/.test(texte) ? `${texte.slice(0, 10)}T00:00:00.000Z` : null;
};
const entier = (brut: unknown) => Number.parseInt(valeur(brut) ?? "0", 10) || 0;
const majuscule = (texte: string | null) => (texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte);

/** Liste d'un député gardée en mémoire : ses pages et filtres ne relisent pas la base. */
const DUREE_MEMOIRE_MS = 10 * 60 * 1000;
const ACTEURS_EN_MEMOIRE = 20;
const memoire = new Map<string, { liste: Promise<VoteLeger[]>; expire: number }>();

async function chargerListe(acteurUid: string): Promise<VoteLeger[]> {
  const db = await getParlementDb();
  // Une requête par position : la position se déduit de la rubrique trouvée,
  // sans relire le décompte nominatif (volumineux) de chaque scrutin.
  const parPosition = await Promise.all(
    (Object.entries(POSITIONS) as [keyof typeof POSITIONS, Position][]).map(async ([rubrique, position]) => {
      const scrutins = await db
        .collection("scrutins")
        .find(
          { [`${CHEMIN}.${rubrique}.votant.acteurRef`]: acteurUid },
          {
            projection: {
              _id: 0,
              uid: 1,
              numero: 1,
              dateScrutin: 1,
              titre: 1,
              "typeVote.codeTypeVote": 1,
              "objet.dossierLegislatif.libelle": 1,
            },
          }
        )
        .toArray();
      return scrutins.map((s) => ({
        scrutinUid: s.uid as string,
        position,
        numero: entier(s.numero),
        dateScrutin: jourISO(s.dateScrutin),
        codeTypeVote: valeur(objet(s.typeVote).codeTypeVote),
        recherche: normaliserTexte(
          `${valeur(s.titre) ?? ""} ${valeur(objet(objet(s.objet).dossierLegislatif).libelle) ?? ""}`
        ),
      }));
    })
  );
  return parPosition
    .flat()
    .sort((a, b) => String(b.dateScrutin).localeCompare(String(a.dateScrutin)) || b.numero - a.numero);
}

function listeEnMemoire(acteurUid: string): Promise<VoteLeger[]> {
  const entree = memoire.get(acteurUid);
  if (entree && entree.expire > Date.now()) return entree.liste;
  const liste = chargerListe(acteurUid);
  liste.catch(() => memoire.delete(acteurUid)); // nouvel essai au prochain appel
  memoire.set(acteurUid, { liste, expire: Date.now() + DUREE_MEMOIRE_MS });
  while (memoire.size > ACTEURS_EN_MEMOIRE) memoire.delete(memoire.keys().next().value!);
  return liste;
}

/**
 * Fragment du titre du texte cité par un scrutin : « … à l'article premier de
 * la proposition de loi pour retrouver la confiance … (deuxième lecture). »
 * → « pour retrouver la confiance … ».
 */
export function texteVise(libelle: string): string | null {
  const m = normaliserTexte(libelle).match(
    /(?:de la|du|d'une?) (?:proposition|projet) de (?:loi|resolution)(?: constitutionnelle| organique)?(?: de finances| de financement)? ?(.+?)(?: \(|\.?$)/
  );
  const fragment = m?.[1]?.replace(/^(adopte|modifie)e? par le senat,? ?/, "").trim();
  return fragment && fragment.length >= 15 ? fragment.slice(0, 60) : null;
}

/**
 * Dossier d'un scrutin. L'Assemblée ne le renseigne que pour 4 scrutins sur
 * 10 environ ; à défaut, on le cherche parmi les points de l'ordre du jour de
 * la séance, d'après le titre du texte cité par le scrutin.
 */
export function dossierDuScrutin(
  scrutin: { objet?: unknown; titre?: unknown },
  pointsOdj: { objet: string; dossierRef: string }[]
): string | null {
  const direct = valeur(objet(objet(scrutin.objet).dossierLegislatif).dossierRef);
  if (direct) return direct;
  if (pointsOdj.length === 0) return null;
  const dossiers = [...new Set(pointsOdj.map((p) => p.dossierRef))];
  const fragment = texteVise(valeur(objet(scrutin.objet).libelle) ?? valeur(scrutin.titre) ?? "");
  if (fragment) {
    const trouve = pointsOdj.find((p) => normaliserTexte(p.objet).includes(fragment));
    if (trouve) return trouve.dossierRef;
  }
  // Un seul texte à l'ordre du jour : c'est lui.
  return dossiers.length === 1 ? dossiers[0] : null;
}

/** Détails des votes de la page : décompte, dossier, délégation. */
async function detailler(acteurUid: string, page: VoteLeger[]): Promise<VoteActeur[]> {
  if (page.length === 0) return [];
  const db = await getParlementDb();
  const scrutins = await db
    .collection("scrutins")
    .find(
      { uid: { $in: page.map((v) => v.scrutinUid) } },
      {
        projection: {
          _id: 0,
          uid: 1,
          numero: 1,
          titre: 1,
          dateScrutin: 1,
          seanceRef: 1,
          objet: 1,
          sort: 1,
          demandeur: 1,
          "typeVote.libelleTypeVote": 1,
          "syntheseVote.annonce": 1,
          "syntheseVote.decompte": 1,
          ventilationVotes: 1,
        },
      }
    )
    .toArray();

  // Ordres du jour des séances, pour les scrutins sans dossier renseigné.
  const seances = [...new Set(scrutins.map((s) => valeur(s.seanceRef)).filter((s): s is string => !!s))];
  const reunions = await db
    .collection("reunions")
    .find(
      { uid: { $in: seances } },
      { projection: { _id: 0, uid: 1, "ODJ.pointsODJ.pointODJ.objet": 1, "ODJ.pointsODJ.pointODJ.dossiersLegislatifsRefs": 1 } }
    )
    .toArray();
  const pointsParSeance = new Map(
    reunions.map((r) => [
      r.uid as string,
      liste(objet(objet(r.ODJ).pointsODJ).pointODJ as unknown[]).flatMap((p) =>
        liste(objet(objet(p).dossiersLegislatifsRefs).dossierRef as unknown[])
          .map((d) => valeur(d))
          .filter((d): d is string => !!d)
          .map((dossierRef) => ({ objet: valeur(objet(p).objet) ?? "", dossierRef }))
      ),
    ])
  );
  const dossierParScrutin = new Map(
    scrutins.map((s) => [s.uid as string, dossierDuScrutin(s as Brut, pointsParSeance.get(valeur(s.seanceRef) ?? "") ?? [])])
  );
  const dossiers = await db
    .collection("dossiers")
    .find(
      { uid: { $in: [...new Set([...dossierParScrutin.values()].filter((d): d is string => !!d))] } },
      { projection: { _id: 0, uid: 1, legislature: 1, "titreDossier.titre": 1 } }
    )
    .toArray();
  const dossierParUid = new Map(
    dossiers.map((d) => {
      const legislature = Number.parseInt(valeur(d.legislature) ?? "", 10);
      return [
        d.uid as string,
        {
          uid: d.uid as string,
          titre: majuscule(valeur(objet(d.titreDossier).titre)),
          legislature: Number.isFinite(legislature) ? legislature : null,
        },
      ];
    })
  );
  const scrutinParUid = new Map(scrutins.map((s) => [s.uid as string, s]));

  return page.flatMap((v) => {
    const s = scrutinParUid.get(v.scrutinUid);
    if (!s) return [];
    // Ligne du député dans le décompte nominatif (délégation, cause).
    let ligne: Brut = {};
    for (const groupe of liste(objet(objet(objet(s.ventilationVotes).organe).groupes).groupe as unknown[])) {
      const decompte = objet(objet(objet(groupe).vote).decompteNominatif);
      for (const rubrique of Object.keys(POSITIONS)) {
        const trouve = liste(objet(decompte[rubrique]).votant as unknown[])
          .map(objet)
          .find((votant) => valeur(votant.acteurRef) === acteurUid);
        if (trouve) ligne = trouve;
      }
    }
    const delegation = valeur(ligne.parDelegation);
    const decompte = objet(objet(s.syntheseVote).decompte);
    const dossierUid = dossierParScrutin.get(v.scrutinUid) ?? null;
    return [
      {
        uid: `V-${v.scrutinUid}-${acteurUid}`,
        acteurRefUid: acteurUid,
        positionVote: v.position,
        causePositionVote: valeur(ligne.causePositionVote),
        parDelegation: delegation === null ? null : delegation === "true",
        mandatRefUid: valeur(ligne.mandatRef),
        scrutinRefUid: v.scrutinUid,
        codeTypeVote: v.codeTypeVote,
        dateVote: v.dateScrutin,
        scrutinRef: {
          uid: v.scrutinUid,
          numero: valeur(s.numero),
          titre: valeur(s.titre),
          dateScrutin: v.dateScrutin,
          code: valeur(objet(s.sort).code),
          annonce: majuscule(valeur(objet(s.syntheseVote).annonce) ?? valeur(objet(s.sort).libelle)),
          libelleTypeVote: valeur(objet(s.typeVote).libelleTypeVote),
          demandeur: valeur(objet(s.demandeur).texte),
          pour: entier(decompte.pour),
          contre: entier(decompte.contre),
          abstentions: entier(decompte.abstentions),
          nonVotants: entier(decompte.nonVotants),
          dossierRefUid: dossierUid,
          dossierRef: dossierUid ? dossierParUid.get(dossierUid) ?? null : null,
        },
      },
    ];
  });
}

export async function getVotesActeurAN(
  acteurUid: string,
  {
    page = 1,
    perPage = 10,
    positionVote = "",
    codeTypeVote = "",
    search = "",
  }: { page?: number; perPage?: number; positionVote?: string; codeTypeVote?: string; search?: string }
): Promise<PaginatedResponse<VoteActeur>> {
  let votes = await listeEnMemoire(acteurUid);
  if (positionVote) votes = votes.filter((v) => v.position === positionVote);
  if (codeTypeVote) votes = votes.filter((v) => v.codeTypeVote === codeTypeVote);
  const recherche = normaliserTexte(search).trim();
  if (recherche) {
    votes = votes.filter((v) => String(v.numero) === recherche || v.recherche.includes(recherche));
  }
  const total = votes.length;
  return {
    data: await detailler(acteurUid, votes.slice((page - 1) * perPage, page * perPage)),
    pagination: { total, totalPage: Math.ceil(total / perPage), perPage, currentPage: page },
  };
}
