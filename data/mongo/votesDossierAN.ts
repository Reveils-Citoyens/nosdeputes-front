import type { DossierVotesSummary, ScrutinSummary } from "@/data/getDossierVotesSummary";
import { getParlementDb } from "@/lib/mongodb";
import { liste, valeur } from "./conversionAN";
import { aPlat, dossierDepuisAN } from "./conversionDossierAN";
import { resumeScrutinDepuisAN } from "./scrutinsAN";
import { normaliserTexte } from "./rechercheTexte";
import { texteVise } from "./votesActeurAN";

/**
 * Résumé des votes d'un dossier (actes et scrutins rattachés) lu dans notre
 * base plutôt que dans l'API Tricoteuses : actes du dossier (conversion déjà
 * utilisée par getDossier) et scrutins de la collection `scrutins`.
 * Même forme que getDossierVotesSummary. Serveur uniquement.
 * `null` si le dossier est absent de la base.
 */
export async function getDossierVotesSummaryAN(dossierUid: string): Promise<DossierVotesSummary | null> {
  const db = await getParlementDb();
  const brut = await db
    .collection("dossiers")
    .findOne({ uid: dossierUid }, { projection: { _id: 0, heatComponents: 0, enrichmentKeywords: 0 } });
  if (!brut) return null;

  const dossier = dossierDepuisAN(brut as unknown as Parameters<typeof dossierDepuisAN>[0]);
  // Scrutins cités par chaque acte, dans l'ordre de l'open data (même liste à
  // plat, donc même ordre, que les actes convertis).
  const scrutinsParActe = aPlat(brut.actesLegislatifs).map(({ acte }) =>
    liste((acte.voteRefs as { voteRef?: unknown } | undefined)?.voteRef as unknown[])
      .map((ref) => valeur(ref))
      .filter((uid): uid is string => uid !== null)
  );

  // Votes finaux et motions que l'Assemblée rattache au dossier sans les citer
  // dans ses actes (vote sur l'ensemble du texte Corse, de la LPM…).
  const orphelins = await db
    .collection("scrutins")
    .find(
      { "objet.dossierLegislatif.dossierRef": dossierUid, uid: { $nin: [...new Set(scrutinsParActe.flat())] } },
      { projection: { _id: 0, uid: 1, numero: 1, dateScrutin: 1, seanceRef: 1, "objet.libelle": 1 } }
    )
    .toArray();
  // Séances dont l'ordre du jour cite le dossier : second indice que le
  // scrutin le concerne bien, quand son titre est trop court pour comparer.
  const seances = [...new Set(orphelins.map((s) => valeur(s.seanceRef)).filter((s): s is string => !!s))];
  const seancesDuDossier = new Set(
    seances.length
      ? (
          await db
            .collection("reunions")
            .find(
              { uid: { $in: seances }, "ODJ.pointsODJ.pointODJ.dossiersLegislatifsRefs.dossierRef": dossierUid },
              { projection: { _id: 0, uid: 1 } }
            )
            .toArray()
        ).map((r) => r.uid as string)
      : []
  );
  rattacherVotesOrphelins(
    dossier.titre ?? "",
    dossier.actesLegislatifs.map((a) => ({ codeActe: a.codeActe, dateActe: a.dateActe as unknown as string | null })),
    scrutinsParActe,
    orphelins.map((s) => ({
      uid: s.uid as string,
      numero: Number(valeur(s.numero) ?? 0),
      dateScrutin: valeur(s.dateScrutin),
      libelle: valeur((s.objet as { libelle?: unknown } | undefined)?.libelle) ?? "",
      seanceCiteLeDossier: seancesDuDossier.has(valeur(s.seanceRef) ?? ""),
    }))
  );

  const uids = [...new Set(scrutinsParActe.flat())];
  const scrutins = uids.length
    ? await db
        .collection("scrutins")
        .find(
          { uid: { $in: uids } },
          { projection: { _id: 0, uid: 1, numero: 1, titre: 1, dateScrutin: 1, "sort.code": 1, "syntheseVote.decompte": 1, "typeVote.libelleTypeVote": 1 } }
        )
        .toArray()
    : [];
  const parUid = new Map<string, ScrutinSummary>(
    scrutins.map((s) => {
      const r = resumeScrutinDepuisAN(s as unknown as Parameters<typeof resumeScrutinDepuisAN>[0]);
      return [
        r.uid,
        {
          uid: r.uid,
          numero: r.numero,
          titre: r.titre,
          dateScrutin: r.dateScrutin ? new Date(r.dateScrutin) : null,
          code: r.code,
          pour: r.pour,
          contre: r.contre,
          abstentions: r.abstentions,
          // Hors du type ScrutinSummary, mais lu par le flux RSS
          // (« Scrutin public ordinaire n° … »).
          libelleTypeVote: r.libelleTypeVote,
        } as unknown as ScrutinSummary,
      ];
    })
  );

  return {
    actesLegislatifs: dossier.actesLegislatifs.map((acte, i) => ({
      uid: acte.uid,
      codeActe: acte.codeActe,
      nomCanonique: acte.nomCanonique,
      dateActe: acte.dateActe ? new Date(acte.dateActe as unknown as string) : null,
      // Un scrutin cité mais pas encore importé reste visible comme référence vide.
      // Dans l'ordre des scrutins : motion de rejet, puis vote sur l'ensemble.
      voteRefs: (scrutinsParActe[i] ?? [])
        .map((uid) => ({ voteRef: parUid.get(uid) ?? null }))
        .sort((a, b) => Number(a.voteRef?.numero ?? 0) - Number(b.voteRef?.numero ?? 0)),
    })),
  };
}

/** Scrutins qui tranchent un texte (et non un amendement ou un article). */
const VOTE_FINAL = /^(l['’]ensemble|la motion|la proposition de r[ée]solution|la d[ée]claration)/i;

/**
 * Le texte voté correspond-il au dossier ? La moitié au moins des mots
 * significatifs du titre cité par le scrutin doivent figurer dans le titre du
 * dossier. L'open data rattache parfois un scrutin au mauvais dossier (le vote
 * sur la « vie chère outre-mer » à « Territoires zéro chômeur »).
 */
export function texteDuDossier(libelleScrutin: string, titreDossier: string): boolean {
  const fragment = texteVise(libelleScrutin);
  if (!fragment) return true; // déclaration, motion de censure… : rien à comparer
  const titre = normaliserTexte(titreDossier);
  const mots = fragment.split(/[^a-z0-9]+/).filter((m) => m.length >= 5);
  if (mots.length === 0) return true;
  return mots.filter((m) => titre.includes(m)).length / mots.length >= 0.5;
}

/**
 * Rattache aux actes du dossier les votes finaux et motions que l'open data
 * ne cite pas (23 sur 109 à la 17e législature) : à la décision de
 * l'Assemblée du jour du vote, à défaut à sa séance du même jour. Jamais à
 * un acte du Sénat, ni un scrutin qui porte sur un autre texte : la séance du
 * scrutin doit avoir le dossier à son ordre du jour, ou son libellé citer le
 * titre du dossier.
 * Modifie `scrutinsParActe` en place.
 */
export function rattacherVotesOrphelins(
  titreDossier: string,
  actes: { codeActe: string; dateActe: string | null }[],
  scrutinsParActe: string[][],
  orphelins: {
    uid: string;
    numero: number;
    dateScrutin: string | null;
    libelle: string;
    /** L'ordre du jour de la séance du scrutin cite le dossier. */
    seanceCiteLeDossier?: boolean;
  }[]
): void {
  const deLAssemblee = (code: string) => /^AN/.test(code) || /-AN-/.test(code);
  const tries = orphelins
    .filter(
      (s) =>
        s.dateScrutin &&
        VOTE_FINAL.test(s.libelle.trim()) &&
        (s.seanceCiteLeDossier || texteDuDossier(s.libelle, titreDossier))
    )
    .sort((a, b) => a.numero - b.numero); // motion de rejet avant vote sur l'ensemble
  for (const scrutin of tries) {
    const jour = scrutin.dateScrutin!.slice(0, 10);
    const candidats = actes
      .map((acte, i) => ({ ...acte, i }))
      .filter((a) => deLAssemblee(a.codeActe) && a.dateActe?.slice(0, 10) === jour);
    const cible =
      candidats.find((a) => /-DEC$/.test(a.codeActe)) ??
      candidats.filter((a) => /-DEBATS(-AN)?-SEANCE$/.test(a.codeActe)).at(-1);
    if (cible) scrutinsParActe[cible.i].push(scrutin.uid);
  }
}
