import type { Db } from "mongodb";
import type { AlertSubject } from "@/lib/alertTypes";

/**
 * Nouveautés calculées pour un sujet suivi, depuis une date donnée.
 * Tout est dérivé de données structurées en base — aucun appel LLM.
 */
export type SubjectUpdate = {
  subject: AlertSubject;
  /** Lignes prêtes à afficher (texte simple, sans HTML). */
  lines: string[];
};

/** Date au format YYYY-MM-DD (les dates d'amendements sont stockées en string). */
function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function frDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Compte les amendements AN déposés sur un dossier depuis `since`.
 * Chaîne de liaison : amendement.texteLegislatifRef → texte (dossiers, leg "17",
 * uid AN) → dossierRef = dossier suivi.
 */
async function countNewDossierAmendements(db: Db, dossierUid: string, since: Date): Promise<number> {
  const textes = await db
    .collection("dossiers")
    .find(
      { dossierRef: dossierUid, legislature: "17", uid: { $regex: /^PIONANR/ } },
      { projection: { _id: 0, uid: 1 } }
    )
    .toArray();
  const texteUids = textes.map((t) => t.uid).filter(Boolean);
  if (texteUids.length === 0) return 0;

  return db.collection("amendements").countDocuments({
    texteLegislatifRef: { $in: texteUids },
    "cycleDeVie.dateDepot": { $gt: toDateOnly(since) },
  });
}

async function getDossierUpdate(db: Db, subject: AlertSubject, since: Date): Promise<SubjectUpdate | null> {
  const dossier = await db.collection("dossiers").findOne(
    { uid: subject.uid },
    { projection: { _id: 0, dossierBadge: 1, "heatComponents.last_acte_date": 1 } }
  );

  const lastActeRaw = dossier?.heatComponents?.last_acte_date as string | undefined;
  const hasRecentActe = lastActeRaw ? new Date(lastActeRaw) > since : false;

  const newAmendements = await countNewDossierAmendements(db, subject.uid, since);

  const lines: string[] = [];
  if (newAmendements > 0) {
    lines.push(`${newAmendements} nouvel${newAmendements > 1 ? "s" : ""} amendement${newAmendements > 1 ? "s" : ""} déposé${newAmendements > 1 ? "s" : ""}`);
  }
  if (hasRecentActe) {
    const d = frDate(lastActeRaw);
    lines.push(d ? `Dernière activité législative le ${d}` : "Nouvelle activité législative");
  }

  if (lines.length === 0) return null;
  return { subject, lines };
}

async function getDeputeUpdate(db: Db, subject: AlertSubject, since: Date): Promise<SubjectUpdate | null> {
  const newAmendements = await db.collection("amendements").countDocuments({
    "signataires.auteur.acteurRef": subject.uid,
    "cycleDeVie.dateDepot": { $gt: toDateOnly(since) },
  });

  if (newAmendements === 0) return null;
  return {
    subject,
    lines: [
      `${newAmendements} amendement${newAmendements > 1 ? "s" : ""} déposé${newAmendements > 1 ? "s" : ""}`,
    ],
  };
}

const MAX_THEME_DOSSIERS = 5;

async function getThemeUpdate(db: Db, subject: AlertSubject, since: Date): Promise<SubjectUpdate | null> {
  const docs = await db
    .collection("dossiers_enrichis")
    .find(
      {
        "dossier_summary_enrichment.qualification.themes_senat": subject.uid,
        date_depot: { $gt: since },
      },
      { projection: { _id: 0, titre: 1 }, sort: { date_depot: -1 }, limit: MAX_THEME_DOSSIERS + 1 }
    )
    .toArray();

  if (docs.length === 0) return null;

  const titres = docs.slice(0, MAX_THEME_DOSSIERS).map((d) => `« ${d.titre} »`);
  const extra = docs.length - MAX_THEME_DOSSIERS;
  const lines = [
    `${docs.length > MAX_THEME_DOSSIERS ? `${MAX_THEME_DOSSIERS}+` : docs.length} nouveau${docs.length > 1 ? "x" : ""} dossier${docs.length > 1 ? "s" : ""}`,
    ...titres,
  ];
  if (extra > 0) lines.push(`… et ${extra} autre${extra > 1 ? "s" : ""}`);
  return { subject, lines };
}

/**
 * Calcule les nouveautés pour tous les sujets d'un abonnement depuis `since`.
 * Renvoie uniquement les sujets ayant du nouveau. Le type "recherche" est
 * ignoré en v1 (pas de filtre date fiable côté source).
 */
export async function computeSubjectUpdates(
  db: Db,
  subjects: AlertSubject[],
  since: Date
): Promise<SubjectUpdate[]> {
  const results: SubjectUpdate[] = [];
  for (const subject of subjects) {
    try {
      let update: SubjectUpdate | null = null;
      if (subject.type === "dossier") update = await getDossierUpdate(db, subject, since);
      else if (subject.type === "depute") update = await getDeputeUpdate(db, subject, since);
      else if (subject.type === "theme") update = await getThemeUpdate(db, subject, since);
      // "recherche" : ignoré en v1
      if (update) results.push(update);
    } catch (err) {
      console.error(`[digest] Erreur calcul update pour ${subject.type}/${subject.uid}:`, err);
    }
  }
  return results;
}
