import { getParlementDb } from "@/lib/mongodb";
import type { PaginatedResponse } from "@/data/pagination";
import { valeur } from "./conversionAN";
import { amendementLiseuseDepuisAN, texteAmendementDepuisAN } from "./conversionAmendementAN";
import { motifRechercheHtml, normaliserTexte } from "./rechercheTexte";

/**
 * Amendements déposés par un député (onglet « Amendements » de sa page), lus
 * dans notre base plutôt que dans l'API Tricoteuses. Serveur uniquement.
 *
 * Même périmètre que l'API (`/amendements?acteurRefUid=…&chambre=AN`) : les
 * amendements dont le député est l'auteur, cosignés exclus. L'ordre, lui,
 * diffère : du plus récent au plus ancien (l'API suivait le numéro d'ordre
 * de dépôt croissant). La recherche diffère aussi, volontairement :
 * l'API cherchait des mots racinisés et ignorait les numéros ; on cherche le
 * texte tel que saisi, sans tenir compte des accents, et le numéro.
 */

export type AmendementActeur = {
  uid: string;
  numeroLong: string | null;
  numeroOrdreDepot: number | null;
  typeAuteur: string | null;
  sortAmendement: string | null;
  nombreCoSignataires: number;
  acteurRefUid: string | null;
  dateDepot: string | null;
  dateSort: string | null;
  dispositif: string | null;
  exposeSommaire: string | null;
  dossierRefUid: string | null;
  dossierRef: { uid: string; titre: string | null; legislature: number | null } | null;
};

type Resume = Omit<AmendementActeur, "dispositif" | "exposeSommaire" | "dossierRefUid" | "dossierRef"> & {
  texteLegislatifRef: string | null;
};

/** Liste d'un député gardée en mémoire : ses pages et filtres ne relisent pas la base. */
const DUREE_MEMOIRE_MS = 5 * 60 * 1000;
const ACTEURS_EN_MEMOIRE = 20;
const memoire = new Map<string, { liste: Promise<Resume[]>; expire: number }>();

async function chargerListe(acteurUid: string): Promise<Resume[]> {
  const db = await getParlementDb();
  const bruts = await db
    .collection("amendements")
    .find(
      { "signataires.auteur.acteurRef": acteurUid },
      {
        projection: {
          _id: 0,
          uid: 1,
          texteLegislatifRef: 1,
          "identification.numeroLong": 1,
          "identification.numeroOrdreDepot": 1,
          "cycleDeVie.sort": 1,
          "cycleDeVie.dateDepot": 1,
          "cycleDeVie.dateSort": 1,
          "cycleDeVie.etatDesTraitements.etat.libelle": 1,
          "signataires.auteur": 1,
          "signataires.cosignataires": 1,
        },
      }
    )
    .toArray();
  return bruts
    .map((brut) => {
      const a = amendementLiseuseDepuisAN(brut as unknown as Parameters<typeof amendementLiseuseDepuisAN>[0]);
      const numero = Number(valeur((brut.identification as Record<string, unknown> | undefined)?.numeroOrdreDepot));
      return {
        uid: a.uid,
        numeroLong: a.numeroLong,
        numeroOrdreDepot: Number.isFinite(numero) ? numero : null,
        typeAuteur: a.typeAuteur,
        sortAmendement: a.sortAmendement,
        nombreCoSignataires: a.nombreCoSignataires,
        acteurRefUid: a.acteurRefUid,
        dateDepot: a.dateDepot,
        dateSort: a.dateSort,
        texteLegislatifRef: valeur(brut.texteLegislatifRef),
      };
    })
    // Du plus récent au plus ancien, comme les questions et les votes ; le
    // numéro d'ordre départage les dépôts d'un même jour.
    .sort(
      (a, b) =>
        String(b.dateDepot ?? "").localeCompare(String(a.dateDepot ?? "")) ||
        (b.numeroOrdreDepot ?? 0) - (a.numeroOrdreDepot ?? 0) ||
        b.uid.localeCompare(a.uid)
    );
}

function listeEnMemoire(acteurUid: string): Promise<Resume[]> {
  const entree = memoire.get(acteurUid);
  if (entree && entree.expire > Date.now()) return entree.liste;
  const liste = chargerListe(acteurUid);
  liste.catch(() => memoire.delete(acteurUid)); // nouvel essai au prochain appel
  memoire.set(acteurUid, { liste, expire: Date.now() + DUREE_MEMOIRE_MS });
  while (memoire.size > ACTEURS_EN_MEMOIRE) memoire.delete(memoire.keys().next().value!);
  return liste;
}

/** Amendements du député dont l'exposé sommaire ou le dispositif contient `recherche`. */
async function uidsParTexte(acteurUid: string, recherche: string): Promise<Set<string>> {
  const motif = { $regex: motifRechercheHtml(recherche), $options: "i" };
  const db = await getParlementDb();
  const trouves = await db
    .collection("amendements")
    .find(
      {
        "signataires.auteur.acteurRef": acteurUid,
        $or: [{ "corps.contenuAuteur.exposeSommaire": motif }, { "corps.contenuAuteur.dispositif": motif }],
      },
      { projection: { _id: 0, uid: 1 } }
    )
    .toArray();
  return new Set(trouves.map((a) => a.uid as string));
}

/** « visant à… » → « Visant à… », comme l'API. */
const majuscule = (texte: string | null) => (texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte);

/** Texte et dossier des amendements d'une page. */
async function completer(page: Resume[]): Promise<AmendementActeur[]> {
  if (page.length === 0) return [];
  const db = await getParlementDb();
  const textes = [...new Set(page.map((a) => a.texteLegislatifRef).filter((t): t is string => !!t))];
  const [corps, documents] = await Promise.all([
    db
      .collection("amendements")
      .find({ uid: { $in: page.map((a) => a.uid) } }, { projection: { _id: 0, uid: 1, corps: 1 } })
      .toArray(),
    db
      .collection("documents")
      .find({ uid: { $in: textes } }, { projection: { _id: 0, uid: 1, dossierRef: 1 } })
      .toArray(),
  ]);
  const dossierDuTexte = new Map(documents.map((d) => [d.uid as string, valeur(d.dossierRef)]));
  const dossiersUids = [...new Set([...dossierDuTexte.values()].filter((d): d is string => !!d))];
  const dossiers = await db
    .collection("dossiers")
    .find({ uid: { $in: dossiersUids } }, { projection: { _id: 0, uid: 1, legislature: 1, "titreDossier.titre": 1 } })
    .toArray();
  const dossierParUid = new Map(
    dossiers.map((d) => {
      const legislature = Number.parseInt(valeur(d.legislature) ?? "", 10);
      return [
        d.uid as string,
        {
          uid: d.uid as string,
          titre: majuscule(valeur((d.titreDossier as Record<string, unknown> | undefined)?.titre)),
          legislature: Number.isFinite(legislature) ? legislature : null,
        },
      ];
    })
  );
  const texteParUid = new Map(corps.map((c) => [c.uid as string, texteAmendementDepuisAN(c)]));

  return page.map(({ texteLegislatifRef, ...a }) => {
    const dossierUid = texteLegislatifRef ? dossierDuTexte.get(texteLegislatifRef) ?? null : null;
    const texte = texteParUid.get(a.uid);
    return {
      ...a,
      dispositif: texte?.dispositif ?? null,
      exposeSommaire: texte?.exposeSommaire ?? null,
      dossierRefUid: dossierUid,
      dossierRef: dossierUid ? dossierParUid.get(dossierUid) ?? null : null,
    };
  });
}

export async function getAmendementsActeurAN(
  acteurUid: string,
  { page = 1, perPage = 10, sortAmendement = "", search = "" }: {
    page?: number;
    perPage?: number;
    sortAmendement?: string;
    search?: string;
  }
): Promise<PaginatedResponse<AmendementActeur>> {
  let liste = await listeEnMemoire(acteurUid);
  if (sortAmendement) liste = liste.filter((a) => a.sortAmendement === sortAmendement);

  const recherche = search.trim();
  if (recherche) {
    // « 9 », « AS9 », « I-35 » : un numéro, cherché seulement parmi les numéros
    // (sinon tout amendement citant un « 9 » dans son texte remonterait).
    const estNumero = /^[a-z]{0,5}-?\d+$/i.test(recherche.replace(/\s/g, ""));
    const parTexte = estNumero ? new Set<string>() : await uidsParTexte(acteurUid, recherche);
    const numero = normaliserTexte(recherche).replace(/\s/g, "");
    liste = liste.filter(
      (a) =>
        parTexte.has(a.uid) ||
        normaliserTexte(a.numeroLong).replace(/\s/g, "") === numero ||
        String(a.numeroOrdreDepot) === numero
    );
  }

  const total = liste.length;
  const data = await completer(liste.slice((page - 1) * perPage, page * perPage));
  return {
    data,
    pagination: { total, totalPage: Math.ceil(total / perPage), perPage, currentPage: page },
  };
}
