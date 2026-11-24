import type { Paragraphe } from "@prisma/client";
import { getParlementDb } from "@/lib/mongodb";
import { urlCompteRendu } from "@/lib/sourcesAN";
import { decodeHtmlEntities } from "@/utils/decodeHtmlEntities";
import { liste, valeur } from "./conversionAN";
import { interventionsDepuisAN } from "./conversionInterventionsAN";
import { normaliserTexte } from "./rechercheTexte";

/**
 * Dernières interventions d'un député en séance publique et en commission
 * (onglet « Travaux » de sa fiche), une ligne par débat. Serveur uniquement.
 *
 * Les interventions sont celles que retient le calcul nocturne des
 * statistiques (statistiques_activite.py, collection
 * `statistiques_quotidiennes`) : mêmes règles que le compteur « Interventions
 * en séance et en commission », présidence comprise mais signalée à part.
 * Le compte rendu de chaque débat donne ensuite son sujet, l'extrait et le
 * dossier vers lequel renvoyer.
 */

export type TypeDebat = "seance" | "commission";

export type DebatActeur = {
  compteRenduUid: string;
  /** Jour du débat, AAAA-MM-JJ. */
  date: string;
  type: TypeDebat;
  /** « Séance publique » ou le nom de la commission. */
  lieu: string;
  /** Dossier débattu, ou à défaut le point de l'ordre du jour. */
  sujet: string | null;
  /** Interventions de fond du député dans ce débat (présidence exclue). */
  interventions: number;
  /** Le député a présidé tout ou partie du débat. */
  aPreside: boolean;
  /** Début de sa première intervention de fond, en texte brut. */
  extrait: string | null;
  /** Page du débat sur le site, positionnée sur cette intervention ; à défaut, compte rendu officiel. */
  lien: string | null;
  lienExterne: boolean;
  /** Dossier débattu, quand il a pu être établi. */
  dossierUid: string | null;
  dossierTitre: string | null;
  dossierLegislature: string | null;
};

/**
 * Une audition conjointe à plusieurs commissions est publiée une fois par
 * commission : mêmes interventions, même extrait. Une seule ligne, qui nomme
 * toutes les commissions.
 */
export function regrouperConjointes(debats: DebatActeur[]): DebatActeur[] {
  const resultat: DebatActeur[] = [];
  for (const debat of debats) {
    const meme = resultat.find(
      (d) =>
        d.type === "commission" &&
        debat.type === "commission" &&
        d.date === debat.date &&
        !!d.extrait &&
        d.extrait === debat.extrait
    );
    if (!meme) {
      resultat.push({ ...debat });
      continue;
    }
    if (!meme.lieu.split(" · ").includes(debat.lieu)) meme.lieu = `${meme.lieu} · ${debat.lieu}`;
    // Le lien vers une page du site prime sur le compte rendu officiel.
    if (meme.lienExterne && !debat.lienExterne) {
      meme.lien = debat.lien;
      meme.lienExterne = false;
      meme.sujet = debat.sujet;
      meme.dossierUid = debat.dossierUid;
      meme.dossierTitre = debat.dossierTitre;
      meme.dossierLegislature = debat.dossierLegislature;
    }
  }
  return resultat;
}

const TYPES_STATISTIQUE: Record<string, TypeDebat> = {
  interventionSeancePublique: "seance",
  interventionCommission: "commission",
};

const LONGUEUR_EXTRAIT = 220;

/** Texte affichable : sans balises ni entités, espaces normalisés. */
export function texteBrut(texte: string | null | undefined): string {
  if (!texte) return "";
  return decodeHtmlEntities(texte.replace(/<[^>]*>/g, " "))
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Coupe au dernier mot entier avant `longueur` caractères. */
export function extraire(texte: string, longueur = LONGUEUR_EXTRAIT): string {
  if (texte.length <= longueur) return texte;
  const coupe = texte.slice(0, longueur);
  const espace = coupe.lastIndexOf(" ");
  return `${(espace > longueur * 0.6 ? coupe.slice(0, espace) : coupe).replace(/[\s,;:.]+$/, "")}…`;
}

/** Numéro de texte cité par un titre : « (n° 3379) », « n[[o]] 3379 », « (n° 3172) ». */
export function numeroTexte(texte: string | null | undefined): string | null {
  return texte?.match(/n\s*(?:°s?|\[\[os?\]\]|os?)\s*(\d{1,5})/i)?.[1] ?? null;
}

type ParagrapheDepute = { ordre: number; presidence: boolean };

/** Titres d'un texte discuté en séance ; les projets de loi de finances ont les leurs. */
const CODES_TITRE = /^(TITRE_TEXTE_DISCUSSION|APPEL_PLF\w*_1_20)$/;

export type ResumeDebat = {
  sujet: string | null;
  numeroTexte: string | null;
  extrait: string | null;
  premierOrdre: number | null;
};

/**
 * Sujet et extrait d'un débat, à partir de ses paragraphes et de ceux du
 * député. Le sujet est le dernier titre qui précède sa première intervention :
 * titre de discussion en séance, didascalie en italiques en commission
 * (« La commission a examiné la proposition de loi… »).
 */
export function resumerDebat(paragraphes: Paragraphe[], duDepute: ParagrapheDepute[]): ResumeDebat {
  const ordres = [...duDepute].sort((a, b) => a.ordre - b.ordre);
  const premier = (ordres.find((p) => !p.presidence) ?? ordres[0])?.ordre ?? null;
  if (premier === null) return { sujet: null, numeroTexte: null, extrait: null, premierOrdre: null };

  const avant = paragraphes.filter((p) => (p.ordreAbsoluSeance ?? 0) <= premier);
  const titre = [...avant].reverse().find((p) => CODES_TITRE.test(p.codeGrammaire ?? ""));
  const didascalie = [...avant]
    .reverse()
    .find(
      (p) =>
        !p.codeGrammaire &&
        /italique/i.test(p.codeStyle ?? "") &&
        texteBrut(p.texte).length > 20 &&
        // « Présidence de M. X, président. » : qui préside, pas de quoi il s'agit.
        !/^(co-?)?pr[ée]sidence d/i.test(texteBrut(p.texte)) &&
        !/^la s[ée]ance est ouverte/i.test(texteBrut(p.texte))
    );
  const reference = titre ?? didascalie;

  const intervention = paragraphes.find((p) => p.ordreAbsoluSeance === premier);
  const texte = texteBrut(intervention?.texte);
  // Questions au Gouvernement : le titre de la question (« Événements du
  // 17 octobre ») dit de quoi il s'agit, pas l'intitulé générique de la partie.
  const question =
    titre && /questions au gouvernement/i.test(texteBrut(titre.texte))
      ? [...avant]
          .reverse()
          .find((p) => p.codeGrammaire === "QG_1_1" && (p.ordreAbsoluSeance ?? 0) > (titre.ordreAbsoluSeance ?? 0))
      : undefined;
  const sujet = question
    ? `Questions au Gouvernement : ${texteBrut(question.texte)}`
    : reference
      ? texteBrut(reference.texte).replace(/^[IVX]+\.\s*[-–]?\s*/, "")
      : null;
  return {
    sujet: sujet ? extraire(sujet, 160) || null : null,
    numeroTexte: numeroTexte(reference?.valeur) ?? numeroTexte(reference?.texte),
    extrait: texte ? extraire(texte) : null,
    premierOrdre: premier,
  };
}

export type EntreeDebat = {
  compteRenduUid: string;
  date: string;
  type: TypeDebat;
  /** Prises de parole à situer ; vide si inconnues (sujet et extrait alors absents). */
  paragraphes: ParagrapheDepute[];
  /**
   * Réunion du débat, quand le compte rendu n'est pas (encore) dans la base :
   * transcriptions provisoires « TR-… ». Sert alors seule au lieu, au sujet et
   * au dossier.
   */
  reunionRefUid?: string | null;
};
type Entree = EntreeDebat;

/**
 * Titres des dossiers de la législature, normalisés : dernier recours pour
 * rattacher un débat de séance dont le titre ne cite ni numéro de texte ni
 * point d'ordre du jour (« Refonder l'espace Schengen »).
 */
let titresDossiers: { liste: Promise<{ uid: string; titre: string }[]>; expire: number } | null = null;

function titresDesDossiers(): Promise<{ uid: string; titre: string }[]> {
  if (titresDossiers && titresDossiers.expire > Date.now()) return titresDossiers.liste;
  const liste = getParlementDb().then((db) =>
    db
      .collection("dossiers")
      .find({ legislature: "17" }, { projection: { _id: 0, uid: 1, "titreDossier.titre": 1 } })
      .toArray()
      .then((dossiers) =>
        dossiers
          .map((d) => ({ uid: d.uid as string, titre: normaliserTexte(valeur(objet(d.titreDossier).titre)).trim() }))
          .filter((d) => d.titre.length > 0)
      )
  );
  liste.catch(() => (titresDossiers = null));
  titresDossiers = { liste, expire: Date.now() + 60 * 60 * 1000 };
  return liste;
}

/** Débats de séance qui ne portent sur aucun texte : pas de dossier à chercher. */
const SANS_TEXTE = /^(questions au gouvernement|questions orales|debat sur|declaration du gouvernement)/;

/** Résumés déjà calculés : un compte rendu publié ne change plus. */
const DUREE_MEMOIRE_MS = 6 * 60 * 60 * 1000;
const RESUMES_EN_MEMOIRE = 2000;
const memoire = new Map<string, { debat: DebatActeur; expire: number }>();

const majuscule = (texte: string | null) => (texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte);

const objet = (brut: unknown): Record<string, unknown> =>
  brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Record<string, unknown>) : {};

/**
 * Lieu, sujet, extrait et dossier de débats (compte rendu + prises de parole
 * situées par leur numéro d'ordre). Partagé par l'onglet Travaux des députés
 * et les résultats « Débats » de la recherche.
 */
export async function resumerDebats(entrees: EntreeDebat[]): Promise<DebatActeur[]> {
  return resumerEntrees(entrees);
}

async function resumerEntrees(entrees: Entree[]): Promise<DebatActeur[]> {
  const cle = (e: Entree) => `${e.compteRenduUid}|${e.paragraphes.map((p) => p.ordre).join(",")}`;
  const aCalculer = entrees.filter((e) => {
    const entree = memoire.get(cle(e));
    return !entree || entree.expire < Date.now();
  });

  if (aCalculer.length) {
    const db = await getParlementDb();
    const comptesRendus = await db
      .collection("comptes_rendus")
      .find({ uid: { $in: aCalculer.map((e) => e.compteRenduUid) } }, { projection: { _id: 0 } })
      .toArray();
    const crParUid = new Map(comptesRendus.map((cr) => [cr.uid as string, cr]));

    // Réunions : commission qui siège et dossiers cités à l'ordre du jour.
    const reunions = await db
      .collection("reunions")
      .find(
        {
          uid: {
            $in: [
              ...comptesRendus.map((cr) => valeur(cr.seanceRef)),
              ...aCalculer.map((e) => e.reunionRefUid ?? null),
            ].filter((u): u is string => !!u),
          },
        },
        {
          projection: {
            _id: 0,
            uid: 1,
            organeReuniRef: 1,
            "ODJ.resumeODJ": 1,
            "ODJ.pointsODJ.pointODJ.dossiersLegislatifsRefs": 1,
          },
        }
      )
      .toArray();
    const reunionParUid = new Map(reunions.map((r) => [r.uid as string, r]));
    const organes = await db
      .collection("organes")
      .find(
        { uid: { $in: reunions.map((r) => valeur(r.organeReuniRef)).filter((u): u is string => !!u) } },
        { projection: { _id: 0, uid: 1, libelle: 1 } }
      )
      .toArray();
    const libelleOrgane = new Map(organes.map((o) => [o.uid as string, valeur(o.libelle)]));

    const resumes = aCalculer.map((entree) => {
      const cr = crParUid.get(entree.compteRenduUid);
      const paragraphes = cr
        ? interventionsDepuisAN(cr as unknown as Parameters<typeof interventionsDepuisAN>[0], null, null)
        : [];
      const reunion = reunionParUid.get(valeur(cr?.seanceRef) ?? entree.reunionRefUid ?? "");
      const pointsOdj = liste(objet(objet(reunion?.ODJ).pointsODJ).pointODJ as unknown[]).flatMap((p) =>
        liste(objet(objet(p).dossiersLegislatifsRefs).dossierRef as unknown[])
          .map((d) => valeur(d))
          .filter((d): d is string => !!d)
          .map((dossier) => ({ objet: normaliserTexte(valeur(objet(p).objet)), dossier }))
      );
      const dossiersOdj = [...new Set(pointsOdj.map((point) => point.dossier))];
      // Résumé officiel de l'ordre du jour (« audition de Mme X, ministre… ») :
      // plus parlant que la didascalie du compte rendu, quand il n'y a qu'un point.
      // Points de procédure (nominations, communications…) écartés : reste le
      // sujet de fond, une audition ou une table ronde par exemple.
      const resumesOdj = liste(objet(objet(reunion?.ODJ).resumeODJ).item as unknown[])
        .map((item) => valeur(item))
        .filter((item): item is string => !!item)
        .filter(
          (item) =>
            !/^\s*(nomination|d[ée]signation|communication|questions? diverses|vote|ratification|information relative)/i.test(
              item
            )
        );
      return { entree, resume: resumerDebat(paragraphes, entree.paragraphes), reunion, dossiersOdj, pointsOdj, resumesOdj };
    });

    // Numéro de texte → document → dossier ; à défaut, l'unique dossier de l'ordre du jour.
    const numeros = [...new Set(resumes.map((r) => r.resume.numeroTexte).filter((n): n is string => !!n))];
    const candidats = numeros.flatMap((n) => {
      const numero = n.padStart(4, "0");
      // Projets et propositions de loi, propositions de résolution (dont européennes).
      return ["PION", "PRJL", "PNRE"].flatMap((p) => [`${p}ANR5L17B${numero}`, `${p}ANR5L17BTC${numero}`]);
    });
    const documents = candidats.length
      ? await db
          .collection("documents")
          .find({ uid: { $in: candidats } }, { projection: { _id: 0, uid: 1, dossierRef: 1 } })
          .toArray()
      : [];
    const dossierParNumero = new Map<string, string>();
    for (const document of documents) {
      const numero = String(Number((document.uid as string).match(/(\d+)$/)?.[1]));
      const dossier = valeur(document.dossierRef);
      // Le texte initial (B) prime sur le texte de la commission (BTC).
      if (dossier && (!dossierParNumero.has(numero) || /B\d+$/.test(document.uid as string))) {
        dossierParNumero.set(numero, dossier);
      }
    }
    // Le numéro de texte cité par le titre ; à défaut, et en commission
    // seulement, l'unique dossier de l'ordre du jour. En séance, l'ordre du
    // jour couvre toute la journée (questions au Gouvernement comprises) : son
    // seul dossier n'est pas forcément celui du débat.
    const titres = await titresDesDossiers();
    const parTitre = (sujet: string | null): string | undefined => {
      const cible = normaliserTexte(sujet).trim();
      if (cible.length < 15 || SANS_TEXTE.test(cible)) return undefined;
      const trouves = titres.filter((d) => d.titre === cible || d.titre.startsWith(`${cible} `));
      return trouves.length === 1 ? trouves[0].uid : undefined;
    };
    const dossierDe = (r: (typeof resumes)[number]) =>
      (r.resume.numeroTexte ? dossierParNumero.get(String(Number(r.resume.numeroTexte))) : undefined) ??
      // Point de l'ordre du jour dont l'objet cite le titre du débat
      // (« Discussion de la proposition de résolution visant à refonder… »).
      (r.resume.sujet && !/^questions au gouvernement/i.test(r.resume.sujet)
        ? r.pointsOdj.find((point) => point.objet.includes(normaliserTexte(r.resume.sujet).slice(0, 40)))?.dossier
        : undefined) ??
      (r.entree.type === "commission" && r.dossiersOdj.length === 1 ? r.dossiersOdj[0] : undefined) ??
      (r.entree.type === "seance" ? parTitre(r.resume.sujet) : undefined) ??
      null;
    const dossiers = await db
      .collection("dossiers")
      .find(
        { uid: { $in: [...new Set(resumes.map(dossierDe).filter((d): d is string => !!d))] } },
        { projection: { _id: 0, uid: 1, legislature: 1, "titreDossier.titre": 1 } }
      )
      .toArray();
    const dossierParUid = new Map(dossiers.map((d) => [d.uid as string, d]));

    for (const r of resumes) {
      const { entree, resume, reunion } = r;
      const dossier = dossierParUid.get(dossierDe(r) ?? "");
      const titreDossier = valeur(objet(dossier?.titreDossier).titre);
      const ancre = resume.premierOrdre !== null ? `#p-${resume.premierOrdre}` : "";
      const lienInterne = dossier
        ? `/${valeur(dossier.legislature) ?? "17"}/dossier/${dossier.uid}/${
            entree.type === "seance" ? "debat" : "commission"
          }/${entree.compteRenduUid}${ancre}`
        : null;
      const debat: DebatActeur = {
        compteRenduUid: entree.compteRenduUid,
        date: entree.date,
        type: entree.type,
        lieu:
          entree.type === "seance"
            ? "Séance publique"
            : libelleOrgane.get(valeur(reunion?.organeReuniRef) ?? "") ?? "Commission",
        sujet: majuscule(
          titreDossier ??
            (r.resumesOdj.length === 1 ? extraire(r.resumesOdj[0].replace(/\s*[;.]\s*$/, ""), 160) : resume.sujet)
        ),
        interventions: entree.paragraphes.filter((p) => !p.presidence).length,
        aPreside: entree.paragraphes.some((p) => p.presidence),
        extrait: resume.extrait,
        lien: lienInterne ?? urlCompteRendu(entree.compteRenduUid),
        lienExterne: !lienInterne,
        dossierUid: dossier ? (dossier.uid as string) : null,
        dossierTitre: titreDossier ? majuscule(titreDossier) : null,
        dossierLegislature: dossier ? valeur(dossier.legislature) ?? "17" : null,
      };
      memoire.set(cle(entree), { debat, expire: Date.now() + DUREE_MEMOIRE_MS });
    }
    while (memoire.size > RESUMES_EN_MEMOIRE) memoire.delete(memoire.keys().next().value!);
  }

  return entrees.map((e) => memoire.get(cle(e))!.debat);
}

export async function getInterventionsActeurAN(
  acteurUid: string,
  {
    type,
    limite = 10,
    depuis,
  }: {
    type?: TypeDebat;
    limite?: number;
    /** Jour AAAA-MM-JJ : seuls les débats postérieurs (alertes par email). */
    depuis?: string;
  }
): Promise<{ debats: DebatActeur[]; total: number }> {
  const db = await getParlementDb();
  const types = Object.entries(TYPES_STATISTIQUE)
    .filter(([, t]) => !type || t === type)
    .map(([statistique]) => statistique);
  const lignes = await db
    .collection("statistiques_quotidiennes")
    .find(
      { legislature: 17, acteurUid, type: { $in: types }, ...(depuis ? { date: { $gt: depuis } } : {}) },
      { projection: { _id: 0, date: 1, type: 1, "details.compteRenduUid": 1, "details.paragraphes": 1 } }
    )
    .toArray();

  const entrees: Entree[] = lignes
    .flatMap((ligne) =>
      liste(ligne.details as unknown[]).map((d) => ({
        compteRenduUid: valeur(objet(d).compteRenduUid) ?? "",
        date: String(ligne.date),
        type: TYPES_STATISTIQUE[ligne.type as string],
        paragraphes: liste(objet(d).paragraphes as unknown[]).map((p) => ({
          ordre: Number(objet(p).ordre),
          presidence: objet(p).presidence === true,
        })),
      }))
    )
    .filter((e) => e.compteRenduUid && e.paragraphes.length)
    // Plus récent d'abord ; même jour : la séance la plus tardive d'abord.
    .sort((a, b) => b.date.localeCompare(a.date) || b.compteRenduUid.localeCompare(a.compteRenduUid));

  return {
    debats: regrouperConjointes(await resumerEntrees(entrees.slice(0, limite))),
    // Avant regroupement des réunions conjointes : sert à savoir s'il en reste.
    total: entrees.length,
  };
}
