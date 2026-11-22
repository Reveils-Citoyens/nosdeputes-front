import type { VoteWithActeur } from "@/app/[legislature]/dossier/[id]/votes/votes.type";
import { getParlementDb } from "@/lib/mongodb";
import { liste, slugActeur, urlPhoto, valeur } from "./conversionAN";
import { getOrganesAN } from "./referentielAN";

/**
 * Détail nominatif d'un scrutin (vote de chaque député, groupe, délégation),
 * lu dans notre base (collection `scrutins`, ventilationVotes) plutôt que dans
 * l'API Tricoteuses. Même forme que getScrutinVotes. Serveur uniquement.
 */

type Brut = Record<string, unknown>;

const objet = (brut: unknown): Brut =>
  brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Brut) : {};

/** Rubrique du décompte nominatif → position de vote, au format de l'API. */
const POSITIONS: Record<string, VoteWithActeur["positionVote"]> = {
  pours: "pour",
  contres: "contre",
  abstentions: "abstention",
  nonVotants: "nonVotant",
} as Record<string, VoteWithActeur["positionVote"]>;

type Identite = { prenom: string; nom: string };

/** Votes d'un scrutin brut. `identites` : prénom et nom de chaque député cité. */
export function votesDepuisAN(
  scrutin: Brut & { uid: string },
  identites: Map<string, Identite>,
  groupes: Map<string, { libelle: string; libelleAbrev: string; couleurAssociee: string | null }>
): VoteWithActeur[] {
  const jour = valeur(scrutin.dateScrutin);
  const dateVote = jour && /^\d{4}-\d{2}-\d{2}/.test(jour) ? `${jour.slice(0, 10)}T00:00:00.000Z` : null;
  const codeTypeVote = valeur(objet(scrutin.typeVote).codeTypeVote);
  const votes: VoteWithActeur[] = [];

  const organe = objet(objet(scrutin.ventilationVotes).organe);
  for (const groupe of liste(objet(organe.groupes).groupe as unknown[])) {
    const organeUid = valeur(objet(groupe).organeRef);
    const groupeUid = organeUid ? `GV-${scrutin.uid}-${organeUid}` : null;
    const infosGroupe = organeUid ? groupes.get(organeUid) : undefined;
    const decompte = objet(objet(objet(groupe).vote).decompteNominatif);

    for (const [rubrique, position] of Object.entries(POSITIONS)) {
      for (const votant of liste(objet(decompte[rubrique]).votant as unknown[])) {
        const v = objet(votant);
        const acteurUid = valeur(v.acteurRef);
        if (!acteurUid) continue;
        const identite = identites.get(acteurUid);
        const delegation = valeur(v.parDelegation);
        votes.push({
          uid: `V-${scrutin.uid}-${acteurUid}`,
          dataset: 17,
          acteurRefUid: acteurUid,
          positionVote: position,
          causePositionVote: valeur(v.causePositionVote),
          mandatRefUid: valeur(v.mandatRef),
          parDelegation: delegation === null ? null : delegation === "true",
          groupeVotantRefId: groupeUid,
          scrutinRefUid: scrutin.uid,
          dateVote,
          codeTypeVote,
          acteurRef: identite
            ? {
                uid: acteurUid,
                slug: slugActeur(identite.prenom, identite.nom),
                prenom: identite.prenom,
                nom: identite.nom,
                urlImage: urlPhoto(acteurUid),
              }
            : null,
          groupeVotantRef: groupeUid
            ? { uid: groupeUid, organeRef: infosGroupe ?? null }
            : null,
        } as unknown as VoteWithActeur);
      }
    }
  }
  return votes;
}

/** `null` si le scrutin est absent de notre base (l'appelant se replie sur l'API). */
export async function getScrutinVotesAN(uid: string): Promise<VoteWithActeur[] | null> {
  const db = await getParlementDb();
  const scrutin = await db
    .collection("scrutins")
    .findOne({ uid }, { projection: { _id: 0, uid: 1, dateScrutin: 1, typeVote: 1, ventilationVotes: 1 } });
  if (!scrutin) return null;

  // Identités et groupes de tous les votants, en deux requêtes.
  const groupesBruts = liste(
    objet(objet(objet(scrutin.ventilationVotes).organe).groupes).groupe as unknown[]
  );
  const acteurs = new Set<string>();
  for (const groupe of groupesBruts) {
    const decompte = objet(objet(objet(groupe).vote).decompteNominatif);
    for (const rubrique of Object.keys(POSITIONS)) {
      for (const votant of liste(objet(decompte[rubrique]).votant as unknown[])) {
        const uidActeur = valeur(objet(votant).acteurRef);
        if (uidActeur) acteurs.add(uidActeur);
      }
    }
  }
  const [identitesBrutes, organes] = await Promise.all([
    db
      .collection("acteurs")
      .find({ uid: { $in: [...acteurs] } }, { projection: { _id: 0, uid: 1, "etatCivil.ident": 1 } })
      .toArray(),
    getOrganesAN(groupesBruts.map((g) => valeur(objet(g).organeRef)).filter((u): u is string => !!u)),
  ]);
  const identites = new Map<string, Identite>(
    identitesBrutes.map((a) => {
      const ident = objet(objet(a.etatCivil).ident);
      return [a.uid as string, { prenom: valeur(ident.prenom) ?? "", nom: valeur(ident.nom) ?? "" }];
    })
  );
  const groupes = new Map(
    [...organes].map(([uidOrgane, o]) => [
      uidOrgane,
      { libelle: o.libelle, libelleAbrev: o.libelleAbrev, couleurAssociee: o.couleurAssociee },
    ])
  );
  return votesDepuisAN(scrutin as unknown as Brut & { uid: string }, identites, groupes);
}
