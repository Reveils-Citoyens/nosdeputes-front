import type { ActeLegislatif, Dossier, Rapporteur } from "@prisma/client";
import { liste, valeur } from "./conversionAN";

/**
 * Conversion d'un dossier législatif brut de l'Assemblée (collection
 * `dossiers`, importée chaque nuit par ND.py) vers la forme que renvoyait
 * l'API Tricoteuses pour `/dossiers/{uid}?include=actesLegislatifs,rapporteurs`.
 *
 * Les règles ont été établies en comparant les deux sources acte par acte sur
 * 152 dossiers (1 717 actes) ; elles sont fixées par conversionDossierAN.test.ts.
 *
 * - L'arbre des actes est mis à plat dans l'ordre du document, chaque acte
 *   pointant vers son parent (`parentUid`).
 * - Identifiant d'un acte : `{uid}-{codeActe}-{organe}`. D'autres réponses de
 *   l'API (votes de la chronologie) s'y réfèrent : il doit être identique.
 * - Un acte sans date (étape « 1ère lecture », « travaux de la commission »)
 *   prend la plus ancienne date de ses sous-actes directs.
 * - `adoption` : vrai si la conclusion commence par « adopt… », faux par
 *   « rejet… », inconnu sinon (« modifiée », « Accord »…).
 * - Les textes du Sénat gardent leur identifiant AN (PRJLSNR5S…) là où l'API
 *   le traduisait en identifiant du Sénat (pjl26-172) : l'API et notre base
 *   connaissent les deux.
 *
 * Dates en chaînes ISO, comme l'API : getDossier les convertit ensuite.
 */

export type DossierAN = Dossier & {
  actesLegislatifs: ActeLegislatif[];
  rapporteurs: Rapporteur[];
};

export type ActeBrut = Record<string, unknown> & {
  uid: string;
  codeActe: string;
  organeRef?: unknown;
  actesLegislatifs?: { acteLegislatif?: unknown };
};

/** "2026-11-19T00:00:00.000+01:00" ou "2026-11-03+01:00" → "2026-11-19". */
function jour(brut: unknown): string | null {
  const texte = valeur(brut);
  return texte && /^\d{4}-\d{2}-\d{2}/.test(texte) ? texte.slice(0, 10) : null;
}

const iso = (j: string | null) => (j ? `${j}T00:00:00.000Z` : null);

function objet(brut: unknown): Record<string, unknown> {
  return brut && typeof brut === "object" && !Array.isArray(brut)
    ? (brut as Record<string, unknown>)
    : {};
}

function enfants(acte: { actesLegislatifs?: unknown }): ActeBrut[] {
  return liste(objet(acte.actesLegislatifs).acteLegislatif as ActeBrut | ActeBrut[]).filter(
    (a): a is ActeBrut => !!a && typeof a === "object" && typeof (a as ActeBrut).uid === "string"
  );
}

export function uidActe(acte: ActeBrut): string {
  return `${acte.uid}-${acte.codeActe}-${valeur(acte.organeRef)}`;
}

/** Textes associés à un acte, dans l'ordre ; l'API retient le dernier. */
function textesAssocies(acte: ActeBrut): string[] {
  const seul = valeur(acte.texteAssocie);
  if (seul) return [seul];
  return liste(objet(acte.textesAssocies).texteAssocie as unknown[])
    .map((t) => valeur(objet(t).refTexteAssocie))
    .filter((t): t is string => t !== null);
}

function adoption(libelle: string | null): boolean | null {
  const texte = (libelle ?? "").toLowerCase();
  if (texte.startsWith("adopt")) return true;
  if (texte.startsWith("rejet")) return false;
  return null;
}

function chambre(codeActe: string): string | null {
  if (codeActe.startsWith("AN")) return "AN";
  if (codeActe.startsWith("SN")) return "SN";
  return null;
}

function acteDepuisAN(
  acte: ActeBrut,
  parent: ActeBrut | null,
  dossierUid: string,
  legislature: number | null
): ActeLegislatif {
  const libelle = objet(acte.libelleActe);
  const conclusion = objet(acte.statutConclusion);
  const saisine = objet(acte.casSaisine);
  const jo = objet(acte.infoJO);
  const contribution = objet(acte.contributionInternaute);
  const sousDates = enfants(acte)
    .map((e) => jour(e.dateActe))
    .filter((d): d is string => d !== null)
    .sort();
  const texteAssocie = textesAssocies(acte).at(-1) ?? null;
  const texteAdopte = valeur(acte.texteAdopte);
  const libelleConclusion = valeur(conclusion.libelle);

  // Législature de l'acte (« L17-… ») : un dossier ancien peut recevoir des
  // actes de la législature en cours (rapport d'application…).
  const legislatureActe = Number(acte.uid.match(/^L(\d+)-/)?.[1] ?? legislature);
  const resultat = {
    uid: uidActe(acte),
    dataset: legislatureActe,
    chambre: chambre(acte.codeActe),
    legislature: legislatureActe,
    parentUid: parent ? uidActe(parent) : null,
    codeActe: acte.codeActe,
    etape: null,
    adoption: adoption(libelleConclusion),
    nomCanonique: valeur(libelle.nomCanonique),
    libelleCourtActe: valeur(libelle.libelleCourt),
    xsiType: valeur(acte["@xsi:type"]),
    dateActe: iso(jour(acte.dateActe) ?? sousDates[0] ?? null),
    organeRefUid: valeur(acte.organeRef),
    organeProvenanceRefUid: valeur(acte.provenance),
    famCodeStatutConclusion: valeur(conclusion.fam_code),
    libelleStatutConclusion: libelleConclusion,
    famCodeCasSaisine: valeur(saisine.fam_code),
    libelleCasSaisine: valeur(saisine.libelle),
    anneeDecisionConseilConstitutionnel: valeur(acte.anneeDecision),
    urlConclusionConseilConstitutionnel: valeur(acte.urlConclusion),
    motifConseilConstitutionnel: valeur(acte.motif),
    numDecisionConseilConstitutionnel: valeur(acte.numDecision),
    auteurMotionRefUid: null,
    famCodeTypeMotion: null,
    libelleTypeMotion: null,
    famCodeTypeMotionCensure: null,
    libelleTypeMotionCensure: null,
    famCodeDecision: null,
    libelleDecision: null,
    formuleDecision: null,
    codeLoiRefUid: valeur(acte.codeLoi),
    dateJo: iso(jour(jo.dateJO)),
    numJo: valeur(jo.numJO),
    referenceNor: null,
    typeJo: valeur(jo.typeJO),
    urlLegifrance: null,
    titreLoi: valeur(acte.titreLoi),
    urlEcheancierLoi: valeur(acte.urlEcheancierLoi),
    dateFermetureContributionInternaute: iso(jour(contribution.dateFermeture)),
    dateOuvertureContributionInternaute: iso(jour(contribution.dateOuverture)),
    dateJoce: null,
    refJoce: null,
    titreTexteEuropeen: null,
    typeTexteEuropeen: null,
    reunionRefUid: valeur(acte.reunionRef),
    famCodeStatutAdoption: null,
    libelleStatutAdoption: null,
    texteAdopteRefUid: texteAdopte,
    texteAssocieRefUid: texteAssocie,
    famCodeStatutTypeDeclaration: null,
    libelleStatutTypeDeclaration: null,
    dossierRefUid: dossierUid,
    documentRefUid: texteAssocie ?? texteAdopte ?? valeur(acte.texteLoiRef),
    pointOdjUid: null,
    etapeLegislativeRefUid: null,
  };
  return resultat as unknown as ActeLegislatif;
}

/** Actes à plat, dans l'ordre du document, avec leur parent. */
export function aPlat(racine: unknown): { acte: ActeBrut; parent: ActeBrut | null }[] {
  const resultat: { acte: ActeBrut; parent: ActeBrut | null }[] = [];
  const parcourir = (noeud: { actesLegislatifs?: unknown }, parent: ActeBrut | null) => {
    for (const acte of enfants(noeud)) {
      resultat.push({ acte, parent });
      parcourir(acte, acte);
    }
  };
  parcourir({ actesLegislatifs: racine }, null);
  return resultat;
}

/** « visant à… » → « Visant à… », comme l'API. */
const majuscule = (texte: string | null) =>
  texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : texte;

/** Signet du Sénat (« ppl25-311 ») tiré de l'adresse de son dossier. */
function signetSenat(chemin: string | null): string | null {
  return chemin?.match(/dossier-legislatif\/([^/.]+)\.html/)?.[1] ?? null;
}

export function dossierDepuisAN(brut: Record<string, unknown> & { uid: string }): DossierAN {
  const legislature = Number.parseInt(valeur(brut.legislature) ?? "", 10);
  const leg = Number.isFinite(legislature) ? legislature : null;
  const titres = objet(brut.titreDossier);
  const procedure = objet(brut.procedureParlementaire);
  const initiateur = objet(brut.initiateur);
  const plat = aPlat(brut.actesLegislatifs);
  const actesLegislatifs = plat.map(({ acte, parent }) => acteDepuisAN(acte, parent, brut.uid, leg));

  const brutsParCode = (fin: string) => plat.filter(({ acte }) => acte.codeActe.endsWith(fin));
  const depot = brutsParCode("-DEPOT")[0]?.acte;
  const procAcc = brutsParCode("PROCACC")[0]?.acte;
  const dates = actesLegislatifs
    .map((a) => (a.dateActe as unknown as string | null)?.slice(0, 10) ?? null)
    .filter((d): d is string => d !== null)
    .sort();
  const commission = (prefixe: string) =>
    valeur(plat.find(({ acte }) => acte.codeActe.startsWith(prefixe) && acte.codeActe.endsWith("-COM-FOND"))?.acte.organeRef);
  const auteur = liste(objet(objet(initiateur.acteurs)).acteur as unknown[])[0];
  const organeInitiateur = objet(objet(initiateur.organes).organe);
  const senatChemin = valeur(titres.senatChemin);

  const rapporteurs = plat.flatMap(({ acte }) =>
    liste(objet(acte.rapporteurs).rapporteur as unknown[]).flatMap((r) => {
      const acteur = valeur(objet(r).acteurRef);
      if (!acteur) return [];
      return [
        {
          id: 0,
          dataset: leg,
          acteurRefUid: acteur,
          typeRapporteur: valeur(objet(r).typeRapporteur) ?? "",
          acteLegislatifRefUid: uidActe(acte),
          dossierRefUid: brut.uid,
        } as unknown as Rapporteur,
      ];
    })
  );

  const dossier = {
    uid: brut.uid,
    senatSignet: signetSenat(senatChemin),
    dataset: leg,
    chambre: "AN",
    numero: brut.uid.match(/N\d(\d+)$/)?.[1] ?? null,
    xsiType: valeur(brut["@xsi:type"]),
    legislature: leg,
    dateDepot: iso(jour(depot?.dateActe)),
    dateDernierActe: iso(dates.at(-1) ?? null),
    codeDernierActe: null,
    uidDernierActe: null,
    senatChemin,
    titre: majuscule(valeur(titres.titre)),
    titreChemin: valeur(titres.titreChemin),
    theme: null,
    procedureAcceleree: procAcc !== undefined,
    dateProcedureAcceleree: iso(jour(procAcc?.dateActe)),
    retraitInitiative: false,
    dateRetraitInitiative: null,
    codeProcedure: valeur(procedure.code),
    libelleProcedure: valeur(procedure.libelle),
    statut: null,
    typeInitiative: null,
    typeProcedure: null,
    causeFusionDossier: null,
    dossierAbsorbantRefUid: null,
    organeRefUid: valeur(organeInitiateur.organeRef),
    documentDeposeRefUid: depot ? textesAssocies(depot).at(-1) ?? null : null,
    commissionANRefUid: commission("AN"),
    commissionSNRefUid: commission("SN"),
    acteurPrincipalRefUid: valeur(objet(auteur).acteurRef),
    actesLegislatifs,
    rapporteurs,
  };
  return dossier as unknown as DossierAN;
}
