import type { AuteurDocument, CoSignataireDocument, Document } from "@prisma/client";
import { liste, valeur } from "./conversionAN";

/**
 * Conversion d'un document brut de l'Assemblée (collection `documents`,
 * importée chaque nuit par ND.py) vers la forme que renvoyait l'API Tricoteuses
 * pour `/documents/{uid}?include=auteurs,coSignataires,_count.amendements`.
 *
 * Règles établies en comparant les deux sources sur 120 documents ; elles sont
 * fixées par conversionDocumentAN.test.ts. Le lien vers le PDF (`pdfUrl`) se
 * calcule à part (urlPdfCandidate) : il faut vérifier que le fichier existe.
 */

export type DocumentAN = Document & {
  auteurs: AuteurDocument[];
  coSignataires: CoSignataireDocument[];
  _count: { amendements: number };
};

type Brut = Record<string, unknown>;

function objet(brut: unknown): Brut {
  return brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Brut) : {};
}

/** "2026-09-15T00:00:00.000+02:00" ou "2026-11-03+01:00" → ISO du même jour. */
function dateISO(brut: unknown): string | null {
  const texte = valeur(brut);
  return texte && /^\d{4}-\d{2}-\d{2}/.test(texte) ? `${texte.slice(0, 10)}T00:00:00.000Z` : null;
}

const vrai = (brut: unknown) => valeur(brut) === "true";

const majuscule = (texte: string | null) =>
  texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte;

/**
 * Adresse de la copie PDF que Tricoteuses publie pour un document de
 * l'Assemblée : documents/{chambre}/{type}/{chambre}/R5/{législature}/
 * {suffixe}/{millier}/{uid}/dyn-docs.pdf. Tous les documents n'en ont pas
 * (textes du Sénat, rapports récents) : l'existence se vérifie à part.
 */
export function urlPdfCandidate(uid: string): string | null {
  const m = uid.match(/^([A-Z]{4})(AN|SN)R5([LS])(\d+)([A-Z]+?)(\d+)$/);
  if (!m) return null;
  const [, type, chambre, , legislature, suffixe, numero] = m;
  const millier = String(Math.floor(Number(numero) / 1000)).padStart(3, "0");
  return `https://tricoteuses-assets.s3.fr-par.scw.cloud/documents/${chambre}/${type}/${chambre}/R5/${legislature}/${suffixe}/${millier}/${uid}/dyn-docs.pdf`;
}

export function documentDepuisAN(
  brut: Brut & { uid: string },
  nombreAmendements: number,
  pdfUrl: string | null
): DocumentAN {
  const uid = brut.uid;
  const classification = objet(brut.classification);
  const famille = objet(classification.famille);
  const sousType = objet(classification.sousType);
  const chrono = objet(objet(brut.cycleDeVie).chrono);
  const notice = objet(brut.notice);
  const imprimerie = objet(brut.imprimerie);
  const correction = objet(brut.correction);
  const seance = objet(objet(brut.depotAmendements).amendementsSeance);
  const legislature = Number.parseInt(valeur(brut.legislature) ?? "", 10);
  const leg = Number.isFinite(legislature) ? legislature : null;

  const auteurs = liste(objet(brut.auteurs).auteur as unknown[]).flatMap((a) => {
    const acteur = objet(objet(a).acteur);
    const acteurRef = valeur(acteur.acteurRef);
    const organeRef = valeur(objet(objet(a).organe).organeRef);
    const qualite = valeur(acteur.qualite);
    if (!acteurRef && !organeRef) return [];
    return [
      {
        uid: `${uid}-${acteurRef ?? organeRef}-${qualite ?? "auteur"}`,
        dataset: leg,
        organeRefUid: organeRef,
        acteurRefUid: acteurRef,
        qualite,
        documentRefUid: uid,
      } as unknown as AuteurDocument,
    ];
  });

  const coSignataires = liste(objet(brut.coSignataires).coSignataire as unknown[]).flatMap((c) => {
    const acteurRef = valeur(objet(objet(c).acteur).acteurRef);
    const organe = objet(objet(c).organe);
    const organeRef = valeur(organe.organeRef);
    if (!acteurRef && !organeRef) return [];
    return [
      {
        uid: `${uid}-${acteurRef ?? organeRef}`,
        dataset: leg,
        acteurRefUid: acteurRef,
        dateCosignature: dateISO(objet(c).dateCosignature),
        dateRetraitCosignature: dateISO(objet(c).dateRetraitCosignature),
        edite: vrai(objet(c).edite),
        organeRefUid: organeRef,
        etApparentes: organeRef ? vrai(organe.etApparentes) : null,
        documentRefUid: uid,
      } as unknown as CoSignataireDocument,
    ];
  });

  const document = {
    uid,
    dataset: leg,
    chambre: uid.match(/^[A-Z]{4}(AN|SN)/)?.[1] ?? null,
    legislature: leg,
    session: null,
    titrePrincipal: majuscule(valeur(objet(brut.titres).titrePrincipal)) ?? "",
    titrePrincipalCourt: majuscule(valeur(objet(brut.titres).titrePrincipalCourt)) ?? "",
    classeCode: valeur(objet(famille.classe).code),
    classeLibelle: valeur(objet(famille.classe).libelle),
    texteLoi: valeur(brut["@xsi:type"]) === "texteLoi_Type",
    depotCode: valeur(objet(famille.depot).code),
    depotLibelle: valeur(objet(famille.depot).libelle),
    especeCode: valeur(objet(famille.espece).code),
    especeLibelle: valeur(objet(famille.espece).libelle),
    typeCode: valeur(objet(classification.type).code),
    typeLibelle: valeur(objet(classification.type).libelle),
    sousTypeCode: valeur(sousType.code),
    sousTypeLibelle: valeur(sousType.libelle),
    sousTypeLibelleEdition: valeur(sousType.libelleEdition),
    statutAdoption: valeur(classification.statutAdoption),
    niveauCorrection: valeur(correction.niveauCorrection),
    typeCorrection: valeur(correction.typeCorrection),
    dateCreation: dateISO(chrono.dateCreation),
    dateDepot: dateISO(chrono.dateDepot),
    datePublication: dateISO(chrono.datePublication),
    datePublicationWeb: dateISO(chrono.datePublicationWeb),
    denominationStructurelle: valeur(brut.denominationStructurelle) ?? "",
    amendable: vrai(seance.amendable),
    dian: valeur(imprimerie.DIAN),
    isbn: valeur(imprimerie.ISBN),
    nbPage: valeur(imprimerie.nbPage),
    prix: valeur(imprimerie.prix),
    adoptionConforme: vrai(notice.adoptionConforme),
    formule: valeur(notice.formule),
    numNotice: valeur(notice.numNotice),
    provenance: valeur(brut.provenance),
    exposeMotifsHtml: null,
    exposeMotifsTexte: null,
    pdfUrl,
    estDisponible: pdfUrl !== null,
    xsiType: valeur(brut["@xsi:type"]),
    auteurPrincipalUid: auteurs.find((a) => a.acteurRefUid)?.acteurRefUid ?? null,
    documentParentRefUid: valeur(brut.documentParent),
    etapeLegislativePrincipaleRefUid: null,
    dossierRefUid: valeur(brut.dossierRef),
    organeRefUid: valeur(liste(objet(brut.organesReferents).organeRef as unknown[])[0]),
    auteurs,
    coSignataires,
    _count: { amendements: nombreAmendements },
  };
  return document as unknown as DocumentAN;
}

/** Préfixes des identifiants du Sénat, par type de document et suffixe AN. */
const PREFIXES_SENAT: Record<string, string> = {
  "PION-B": "ppl",
  "PRJL-B": "pjl",
  "PION-BTA": "tas",
  "PRJL-BTA": "tas",
  "RAPP-B": "l",
};

/**
 * Identifiant propre au Sénat d'un document du Sénat connu sous son
 * identifiant AN : PIONSNR5S479B0311 → ppl25-311 (session 2024-2025).
 * C'est sous cet identifiant que Tricoteuses publie le texte et son PDF.
 * `null` si le type n'a pas d'équivalent connu.
 */
export function identifiantSenat(uid: string): string | null {
  const m = uid.match(/^([A-Z]{4})SNR5S(\d+)([A-Z]+?)(\d+)$/);
  if (!m) return null;
  const [, type, session, suffixe, numero] = m;
  const prefixe = PREFIXES_SENAT[`${type}-${suffixe}`];
  if (!prefixe) return null;
  // Les numéros de session du Sénat avancent de 20 par an : S479 = 2024-2025.
  const annee = Math.floor((Number(session) - 479) / 20) + 25;
  return `${prefixe}${String(annee).padStart(2, "0")}-${String(Number(numero)).padStart(3, "0")}`;
}
