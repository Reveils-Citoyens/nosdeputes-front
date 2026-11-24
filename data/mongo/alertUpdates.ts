import type { Db } from "mongodb";
import type { AlertSubject } from "@/lib/alertTypes";
import { slugActeur } from "./conversionAN";
import { getInterventionsActeurAN } from "./interventionsActeurAN";
import { titreDebat } from "@/data/flux/elementsDepute";
import { getDebats } from "@/data/getDebats";
import { searchDossierParTitre } from "./searchDossierParTitre";
import { searchAmendementMongo } from "./searchAmendementMongo";
import { searchQuestion } from "./searchQuestion";
import { compterDebatsDepuis, searchInterventions } from "@/data/searchInterventions";
import { urlQuestion } from "@/lib/sourcesAN";

/**
 * Nouveautés calculées pour un sujet suivi, depuis une date donnée.
 * Tout est dérivé de données structurées en base — aucun appel LLM.
 */
/**
 * Ligne d'une alerte : texte simple, avec un lien quand il y a où aller.
 * `secondaire` : exemple rattaché à la ligne précédente, affiché en retrait.
 */
export type AlertLine = string | { text: string; href?: string; secondaire?: boolean };

export type SubjectUpdate = {
  subject: AlertSubject;
  /** Page du sujet sur le site (chemin relatif), si elle a pu être établie. */
  href: string | null;
  /** Lignes prêtes à afficher (texte simple, sans HTML). */
  lines: AlertLine[];
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
 * Chaîne de liaison : amendement.texteLegislatifRef → texte (collection
 * `documents`, textes de l'Assemblée) → dossierRef = dossier suivi.
 *
 * Les textes sont lus dans `documents`, alimentée par l'import nocturne, et
 * non dans `dossiers`, qui n'en contient que d'anciens. Tous les types de
 * textes AN comptent (propositions PION, projets PRJL, résolutions PNRE),
 * y compris les textes de commission : l'ancienne chaîne, limitée aux PION
 * présents dans `dossiers`, comptait 0 amendement sur les dossiers actifs.
 */
async function countNewDossierAmendements(db: Db, dossierUid: string, since: Date): Promise<number> {
  const textes = await db
    .collection("documents")
    .find(
      { dossierRef: dossierUid, uid: { $regex: /^[A-Z]{4}ANR/ } },
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

/** Débats cités par sujet ; au-delà, un lien vers la liste complète. */
const MAX_DEBATS = 5;

function jourCourt(jour: string): string {
  const d = new Date(`${jour}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? jour
    : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

/** « jeudi 19 novembre, 15 h » ; « 9 h 30 » quand la réunion ne commence pas à l'heure pile. */
function jourEtHeure(d: Date): string {
  const parties = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "numeric",
  }).formatToParts(d);
  const part = (type: string) => parties.find((p) => p.type === type)?.value ?? "";
  const heure = `${Number(part("hour"))} h${part("minute") !== "00" ? ` ${part("minute")}` : ""}`;
  return `${part("weekday")} ${part("day")} ${part("month")}, ${heure}`;
}

async function getDossierUpdate(db: Db, subject: AlertSubject, since: Date): Promise<SubjectUpdate | null> {
  const dossier = await db.collection("dossiers").findOne(
    { uid: subject.uid },
    { projection: { _id: 0, legislature: 1, dossierBadge: 1, "heatComponents.last_acte_date": 1 } }
  );
  const href = dossier ? `/${dossier.legislature ?? "17"}/dossier/${subject.uid}` : null;

  const lastActeRaw = dossier?.heatComponents?.last_acte_date as string | undefined;
  const hasRecentActe = lastActeRaw ? new Date(lastActeRaw) > since : false;

  const [newAmendements, debats] = await Promise.all([
    countNewDossierAmendements(db, subject.uid, since),
    getDebats(subject.uid).catch(() => null),
  ]);

  const lines: AlertLine[] = [];
  if (newAmendements > 0) {
    const text =
      newAmendements > 1
        ? `${newAmendements} nouveaux amendements déposés`
        : "1 nouvel amendement déposé";
    lines.push(href ? { text, href: `${href}/amendement` } : text);
  }
  // Débats de la période, en séance et en commission, du plus récent au plus
  // ancien : chacun mène à sa page sur le site.
  const recents = (debats ?? [])
    .map((d) => ({ debat: d, date: d.dateSeance ? new Date(d.dateSeance) : d.reunionDate ? new Date(d.reunionDate) : null }))
    .filter((x): x is { debat: (typeof x)["debat"]; date: Date } => !!x.date && x.date > since)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  // La réunion donne l'heure réelle de début (deux séances le même jour) et
  // l'organe réuni, dont le nom manque souvent au débat.
  const cites = recents.slice(0, MAX_DEBATS);
  const reunions = await db
    .collection("reunions")
    .find(
      { uid: { $in: cites.map(({ debat }) => debat.reunionRefUid).filter((u): u is string => !!u) } },
      { projection: { _id: 0, uid: 1, organeReuniRef: 1, timeStampDebut: 1 } }
    )
    .toArray();
  const organes = await db
    .collection("organes")
    .find(
      { uid: { $in: reunions.map((r) => r.organeReuniRef).filter(Boolean) } },
      { projection: { _id: 0, uid: 1, libelle: 1 } }
    )
    .toArray();
  for (const { debat, date } of cites) {
    const seance = debat.debateType === "seance";
    const reunion = reunions.find((r) => r.uid === debat.reunionRefUid);
    const organe = organes.find((o) => o.uid === reunion?.organeReuniRef)?.libelle as string | undefined;
    const lieu = seance ? "Séance publique" : debat.organeLibelle ?? organe ?? "Réunion de commission";
    const debut = reunion?.timeStampDebut ? new Date(reunion.timeStampDebut) : null;
    const quand = debut && !Number.isNaN(debut.getTime()) ? jourEtHeure(debut) : jourCourt(date.toISOString().slice(0, 10));
    const text = `${quand} — ${lieu}${debat.lectureLabel ? ` (${debat.lectureLabel})` : ""}`;
    // Sans paragraphes, le compte rendu n'est pas encore publié : pas de page où aller.
    lines.push(
      href && debat._count?.paragraphes > 0
        ? { text, href: `${href}/${seance ? "debat" : "commission"}/${debat.uid}` }
        : `${text}, compte rendu à paraître`
    );
  }
  if (recents.length > MAX_DEBATS && href) {
    lines.push({ text: "Voir tous les débats", href: `${href}/debat` });
  }
  if (hasRecentActe) {
    const d = frDate(lastActeRaw);
    lines.push(d ? `Dernière activité législative le ${d}` : "Nouvelle activité législative");
  }

  if (lines.length === 0) return null;
  return { subject, href, lines };
}

async function getDeputeUpdate(db: Db, subject: AlertSubject, since: Date): Promise<SubjectUpdate | null> {
  const [acteur, newAmendements, interventions] = await Promise.all([
    db.collection("acteurs").findOne(
      { uid: subject.uid },
      { projection: { _id: 0, "etatCivil.ident.prenom": 1, "etatCivil.ident.nom": 1 } }
    ),
    db.collection("amendements").countDocuments({
      "signataires.auteur.acteurRef": subject.uid,
      "cycleDeVie.dateDepot": { $gt: toDateOnly(since) },
    }),
    // Prises de parole en séance et en commission, une ligne par débat, avec
    // un lien vers la première (ancre « #p-… » de la page du débat).
    getInterventionsActeurAN(subject.uid, { limite: MAX_DEBATS + 1, depuis: toDateOnly(since) }),
  ]);
  const ident = acteur?.etatCivil?.ident;
  const href = ident?.prenom && ident?.nom ? `/depute/${slugActeur(ident.prenom, ident.nom)}` : null;

  const lines: AlertLine[] = [];
  if (newAmendements > 0) {
    const text = `${newAmendements} amendement${newAmendements > 1 ? "s" : ""} déposé${newAmendements > 1 ? "s" : ""}`;
    lines.push(href ? { text, href: `${href}/amendements` } : text);
  }
  for (const debat of interventions.debats.slice(0, MAX_DEBATS)) {
    const text = `${jourCourt(debat.date)} — ${titreDebat(debat)}`;
    lines.push(debat.lien ? { text, href: debat.lien } : text);
  }
  if (interventions.debats.length > MAX_DEBATS && href) {
    lines.push({ text: "Voir toutes ses interventions", href: `${href}/travaux` });
  }

  if (lines.length === 0) return null;
  return { subject, href, lines };
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
  return { subject, href: `/themes/${encodeURIComponent(subject.uid)}`, lines };
}

/** Exemples cités par catégorie dans l'alerte d'une recherche. */
const EXEMPLES_RECHERCHE = 3;
/** Au-delà, le nombre d'amendements est donné comme minimum. */
const AMENDEMENTS_COMPTES = 500;

/** Sujet d'un débat cité en exemple : sans les libellés génériques, et pas plus long qu'une ligne. */
function sujetCourt(sujet: string | null): string | null {
  if (!sujet || /^(séance publique|réunion de commission)$/i.test(sujet.trim())) return null;
  return sujet.length > 90 ? `${sujet.slice(0, 89).trimEnd()}…` : sujet;
}

const pluriel = (n: number, singulier: string, plurielForme: string) => (n > 1 ? plurielForme : singulier);

/**
 * Nouveautés d'une recherche suivie, par catégorie : dossiers déposés, débats
 * où l'expression est prononcée, questions, amendements. Mêmes moteurs que la
 * page /recherche (une requête de plusieurs mots y est une expression exacte).
 *
 * Les débats se comptent par séance ou réunion : un mot courant revient dans
 * des centaines d'interventions par semaine (« logement » : 928 en 27 débats).
 * Chaque catégorie est indépendante : l'API des débats en panne n'empêche pas
 * l'envoi du reste.
 */
async function getRechercheUpdate(db: Db, subject: AlertSubject, since: Date): Promise<SubjectUpdate | null> {
  const q = subject.uid.trim();
  if (q.length < 5) return null;
  const href = `/recherche?q=${encodeURIComponent(q)}`;
  const lines: AlertLine[] = [];

  const [dossiers, debats, exemplesDebats, questions, amendements] = await Promise.allSettled([
    (async () => {
      const { items } = await searchDossierParTitre(q, { limit: 300 });
      const legislature = new Map(items.map((d) => [d.uid, d.legislature]));
      const nouveaux = await db
        .collection("dossiers_enrichis")
        .find(
          { uid: { $in: [...legislature.keys()] }, date_depot: { $gt: since } },
          { projection: { _id: 0, uid: 1, titre: 1 }, sort: { date_depot: -1 } }
        )
        .toArray();
      return nouveaux.map((d) => ({ uid: d.uid as string, titre: d.titre as string, legislature: legislature.get(d.uid) ?? "17" }));
    })(),
    compterDebatsDepuis(q, since),
    searchInterventions(q, { perPage: 20, tri: "date" }),
    searchQuestion(q, { sort: "date", limit: 100 }),
    searchAmendementMongo(q, { sort: "date", limit: AMENDEMENTS_COMPTES }),
  ]);

  if (dossiers.status === "fulfilled" && dossiers.value.length > 0) {
    const n = dossiers.value.length;
    lines.push({ text: `${n} ${pluriel(n, "nouveau dossier déposé", "nouveaux dossiers déposés")}`, href });
    for (const d of dossiers.value.slice(0, EXEMPLES_RECHERCHE)) {
      lines.push({ text: `« ${d.titre} »`, href: `/${d.legislature}/dossier/${d.uid}`, secondaire: true });
    }
  }

  if (debats.status === "fulfilled" && debats.value && debats.value.interventions > 0) {
    const { interventions, debats: nDebats, complet } = debats.value;
    const combien = complet ? String(interventions) : `plus de ${interventions}`;
    lines.push({
      text: `Prononcé dans ${nDebats} ${pluriel(nDebats, "débat", "débats")} (${combien} ${pluriel(interventions, "intervention", "interventions")})`,
      href,
    });
    // Une intervention par débat, la plus récente. Celles qu'un lien permet
    // d'ouvrir passent d'abord : sans dossier ni compte rendu publié (réunion
    // du jour, transcription provisoire), l'exemple ne mène nulle part.
    const vus = new Set<string>();
    const candidats: { text: string; lien: string | null }[] = [];
    const exemples = exemplesDebats.status === "fulfilled" ? exemplesDebats.value.items : [];
    for (const i of exemples) {
      if (!i.dateSeance || new Date(i.dateSeance) <= since || !i.debatRefUid || vus.has(i.debatRefUid)) continue;
      vus.add(i.debatRefUid);
      const sujet = sujetCourt(i.dossierTitre ?? i.contexte);
      candidats.push({
        text: `${jourCourt(i.dateSeance.slice(0, 10))} — ${i.orateur?.trim() || "Intervention"}${sujet ? ` (${sujet})` : ""}`,
        lien: i.href ?? i.lienOfficiel,
      });
    }
    const retenus = [...candidats.filter((c) => c.lien), ...candidats.filter((c) => !c.lien)].slice(0, EXEMPLES_RECHERCHE);
    // Retenus dans l'ordre chronologique inverse, comme ils sont arrivés.
    for (const c of candidats.filter((x) => retenus.includes(x))) {
      lines.push(c.lien ? { text: c.text, href: c.lien, secondaire: true } : { text: c.text, secondaire: true });
    }
  }

  if (questions.status === "fulfilled") {
    const nouvelles = questions.value.items.filter((x) => x.dateDepot && new Date(x.dateDepot) > since);
    if (nouvelles.length > 0) {
      const n = nouvelles.length;
      lines.push({ text: `${n} ${pluriel(n, "nouvelle question", "nouvelles questions")}`, href });
      for (const x of nouvelles.slice(0, EXEMPLES_RECHERCHE)) {
        // `type` est déjà un libellé (« Question écrite »).
        const text = `${x.type ?? "Question"} : ${x.titre}`;
        const lien = urlQuestion(x.uid);
        lines.push(lien ? { text, href: lien, secondaire: true } : { text, secondaire: true });
      }
    }
  }

  if (amendements.status === "fulfilled") {
    const n = amendements.value.items.filter((a) => a.dateDepot && new Date(a.dateDepot) > since).length;
    if (n > 0) {
      const combien = n >= AMENDEMENTS_COMPTES ? `Plus de ${n}` : String(n);
      // La recherche triée par date les présente, du plus récent au plus ancien.
      lines.push({ text: `${combien} ${pluriel(n, "nouvel amendement déposé", "nouveaux amendements déposés")}`, href: `${href}&sort=date` });
    }
  }

  for (const r of [dossiers, debats, exemplesDebats, questions, amendements]) {
    if (r.status === "rejected") console.error(`[digest] recherche « ${q} » :`, r.reason);
  }
  if (lines.length === 0) return null;
  return { subject, href, lines };
}

/**
 * Calcule les nouveautés pour tous les sujets d'un abonnement depuis `since`.
 * Renvoie uniquement les sujets ayant du nouveau.
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
      else if (subject.type === "recherche") update = await getRechercheUpdate(db, subject, since);
      if (update) results.push(update);
    } catch (err) {
      console.error(`[digest] Erreur calcul update pour ${subject.type}/${subject.uid}:`, err);
    }
  }
  return results;
}
