import type {
  Acteur,
  AdresseElectronique,
  AdressePostale,
  Mandat,
  Organe,
} from "@prisma/client";

/**
 * Conversion des données brutes de l'Assemblée (collections `acteurs` et
 * `organes`, importées chaque nuit par ND.py) vers la forme que renvoyait
 * l'API Tricoteuses (modèles Prisma). Les composants n'ont pas à savoir d'où
 * viennent les données.
 *
 * Fonctions pures, sans accès à la base : elles se testent sur des documents
 * bruts et se comparent à l'API (cf. conversionAN.test.ts).
 *
 * Les dates sont rendues comme l'API les rendait, en chaînes ISO, mais au bon
 * jour : l'API Tricoteuses les décale d'un jour vers le passé (fuseau horaire),
 * l'open data de l'Assemblée porte la date exacte.
 */

/** Couleurs des groupes, celles qu'affichait le site (choisies par Tricoteuses). */
export type CouleursGroupes = Record<string, string>;

/** Un champ absent est `{"@xsi:nil": "true"}` dans l'export AN, pas `null`. */
export function valeur(brut: any): string | null {
  if (brut === null || brut === undefined) return null;
  if (typeof brut === "object") return null;
  const texte = String(brut).trim();
  return texte === "" ? null : texte;
}

/** Entier en tête de chaîne : « 2A » (Corse-du-Sud) donne 2, comme l'API. */
function entier(brut: any): number | null {
  const texte = valeur(brut);
  if (texte === null) return null;
  const nombre = parseInt(texte, 10);
  return Number.isFinite(nombre) ? nombre : null;
}

/** "2024-07-07" → "2024-07-07T00:00:00.000Z", comme l'API. */
export function dateISO(brut: any): string | null {
  const texte = valeur(brut);
  if (!texte || !/^\d{4}-\d{2}-\d{2}/.test(texte)) return null;
  return `${texte.slice(0, 10)}T00:00:00.000Z`;
}

export function liste<T = any>(brut: T | T[] | null | undefined): T[] {
  if (brut === null || brut === undefined) return [];
  return Array.isArray(brut) ? brut : [brut];
}

/**
 * Slug d'URL d'un député : « Boris Vallaud » → « boris-vallaud ». Même règle
 * que Tricoteuses, pour que les adresses existantes restent valides : accents
 * retirés, apostrophes supprimées (« Prud'homme » → « prudhomme »), tout le
 * reste remplacé par des tirets ; idem pour la barre oblique (« K/Bidi » → « kbidi »).
 */
export function slugActeur(prenom: string, nom: string): string {
  return `${prenom} ${nom}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’ʼ`/]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function urlPhoto(acteurUid: string): string {
  return `https://tricoteuses-assets.s3.fr-par.scw.cloud/photos/${acteurUid.replace(/^PA/, "")}_124x124.jpg`;
}

const LIBELLES_TYPE_ORGANE: Record<string, string> = {
  ASSEMBLEE: "Assemblée nationale",
  GP: "Groupe politique",
  COMPER: "Commission permanente",
  CMP: "Commission mixte paritaire",
  CNPE: "Commission d'enquête",
  CNPS: "Commission spéciale",
  DELEG: "Délégation",
  DELEGBUREAU: "Délégation du Bureau",
  GA: "Groupe d'amitié",
  GE: "Groupe d'études",
  GEVI: "Groupe d'études à vocation internationale",
  MISINFO: "Mission d'information",
  OFFPAR: "Office parlementaire",
  ORGEXTPARL: "Organisme extra-parlementaire",
  PARPOL: "Parti politique",
  GOUVERNEMENT: "Gouvernement",
};

export function organeDepuisAN(brut: any, couleurs: CouleursGroupes = {}): Organe {
  const vie = brut?.viMoDe ?? {};
  const dateFin = dateISO(vie.dateFin);
  const codeType = valeur(brut?.codeType);
  const organe = {
    uid: brut.uid,
    senatCode: null,
    dataset: 0,
    codeType,
    type: codeType ? LIBELLES_TYPE_ORGANE[codeType] ?? null : null,
    libelle: valeur(brut?.libelle) ?? "",
    libelleEdition: valeur(brut?.libelleEdition),
    libelleAbrege: valeur(brut?.libelleAbrege) ?? "",
    libelleAbrev: valeur(brut?.libelleAbrev) ?? "",
    libelleTronque: null,
    organeParentRefUid: valeur(brut?.organeParent),
    regime: valeur(brut?.regime),
    chambre: "AN",
    actif: dateFin === null,
    legislature: entier(brut?.legislature),
    numCirco: entier(brut?.lieu?.numCirco),
    numDepartement: entier(brut?.lieu?.departement?.code),
    secretaire01: valeur(brut?.secretariat?.secretaire01),
    secretaire02: valeur(brut?.secretariat?.secretaire02),
    regimeJuridique: valeur(brut?.regimeJuridique),
    siteInternet: valeur(brut?.siteInternet),
    positionPolitique: valeur(brut?.positionPolitique),
    preseance: entier(brut?.preseance),
    // Les couleurs de l'open data sont des teintes pastel peu lisibles sous un
    // texte blanc : on garde celles que le site affichait.
    couleurAssociee: couleurs[brut.uid] ?? valeur(brut?.couleurAssociee),
    dateDebut: dateISO(vie.dateDebut),
    dateAgrement: dateISO(vie.dateAgrement),
    dateFin,
    urlImage: null,
    xsiType: valeur(brut?.["@xsi:type"]),
  };
  return organe as unknown as Organe;
}

export function mandatDepuisAN(brut: any): Mandat {
  const election = brut?.election ?? {};
  const lieu = election.lieu ?? {};
  const mandature = brut?.mandature ?? {};
  const qualite = brut?.infosQualite ?? {};
  const dateFin = dateISO(brut?.dateFin);
  const mandat = {
    uid: brut.uid,
    dataset: 0,
    acteurRefUid: valeur(brut?.acteurRef),
    organeRefUid: valeur(liste(brut?.organes?.organeRef)[0]),
    legislature: entier(brut?.legislature),
    chambre: "AN",
    typeOrgane: valeur(brut?.typeOrgane),
    actif: dateFin === null,
    dateDebut: dateISO(brut?.dateDebut),
    datePublication: dateISO(brut?.datePublication),
    dateFin,
    causeMandat: valeur(election.causeMandat),
    causeFin: valeur(mandature.causeFin),
    preseance: entier(brut?.preseance),
    nominPrincipale: valeur(brut?.nominPrincipale) === "1",
    codeQualite: valeur(qualite.codeQualite),
    libQualite: valeur(qualite.libQualite) ?? "",
    libQualiteSex: valeur(qualite.libQualiteSex),
    libelle: valeur(brut?.libelle),
    refCirconscription: valeur(election.refCirconscription),
    region: valeur(lieu.region),
    regionType: valeur(lieu.regionType),
    departement: valeur(lieu.departement),
    numDepartement: entier(lieu.numDepartement),
    numCirco: entier(lieu.numCirco),
    datePriseFonction: dateISO(mandature.datePriseFonction),
    premiereElection: valeur(mandature.premiereElection),
    placeHemicycle: valeur(mandature.placeHemicycle),
    xsiType: valeur(brut?.["@xsi:type"]),
    mandatRemplaceRefUid: valeur(mandature.mandatRemplaceRef),
    missionPrecedenteRefUid: valeur(brut?.missionPrecedenteRef),
  };
  return mandat as unknown as Mandat;
}

/** Le plus récent d'abord. */
const parDebutDecroissant = (a: Mandat, b: Mandat) =>
  String(b.dateDebut ?? "").localeCompare(String(a.dateDebut ?? ""));

/**
 * Mandats d'un acteur, le plus récent d'abord.
 *
 * `organesClos` : organes dont l'Assemblée a fixé la date de fin. Un mandat
 * n'est en cours que si son organe l'est aussi : l'open data garde des doublons
 * « sans date de fin » de mandats terminés (un ministre d'un gouvernement
 * démissionnaire y figure encore deux fois, une fois clos, une fois ouvert),
 * alors que l'organe, lui, est bien clos.
 */
export function mandatsDepuisAN(brut: any, organesClos: ReadonlySet<string> = new Set()): Mandat[] {
  return liste(brut?.mandats?.mandat)
    .filter((m: any) => m?.uid)
    .map((m: any) => {
      const mandat = mandatDepuisAN(m);
      if (mandat.actif && mandat.organeRefUid && organesClos.has(mandat.organeRefUid)) {
        (mandat as { actif: boolean }).actif = false;
      }
      return mandat;
    })
    .sort(parDebutDecroissant);
}

export type ActeurAN = Acteur & {
  mandatPrincipal: Mandat | null;
  auGouvernement: boolean;
};

/**
 * Acteur au format de l'API, avec son mandat principal.
 *
 * - Actif : un mandat de député en cours, ou un mandat au Gouvernement en
 *   cours (un député devenu ministre voit son siège occupé par son suppléant).
 * - Mandat principal : le mandat de député en cours. Pour un ministre, le
 *   mandat de député s'il est encore ouvert (circonscription), sinon le mandat
 *   au Gouvernement ; `auGouvernement` est vrai. C'est ce que produisait
 *   resolveAuGouvernement à partir de l'API.
 * - Groupe et commission permanente : ceux des mandats en cours.
 * - Ancien député : pas de mandat principal, de groupe ni de commission,
 *   comme dans l'API, dont l'affichage dépend.
 */
export function acteurDepuisAN(brut: any, organesClos: ReadonlySet<string> = new Set()): ActeurAN {
  const ident = brut?.etatCivil?.ident ?? {};
  const naissance = brut?.etatCivil?.infoNaissance ?? {};
  const mandats = mandatsDepuisAN(brut, organesClos);
  const enCours = (type: string) => mandats.find((m) => m.typeOrgane === type && m.actif);

  const depute = enCours("ASSEMBLEE") ?? null;
  // Membre du Gouvernement en exercice, ancien député ou non : l'API le compte
  // parmi les acteurs actifs de l'Assemblée (il y prend la parole).
  const ministre = enCours("GOUVERNEMENT") ?? null;
  const principal = depute ?? ministre;
  const groupe = depute ? enCours("GP") : undefined;
  const commission = depute ? enCours("COMPER") : undefined;
  const prenom = valeur(ident.prenom) ?? "";
  const nom = valeur(ident.nom) ?? "";
  const adresses = liste(brut?.adresses?.adresse);
  const reseau = (type: string) =>
    valeur(adresses.find((a: any) => valeur(a?.type) === type)?.valElec);

  const acteur = {
    uid: brut.uid,
    dataset: 0,
    prenom,
    nom,
    civ: valeur(ident.civ) ?? "",
    dateNais: dateISO(naissance.dateNais),
    dateDeces: dateISO(brut?.etatCivil?.dateDeces),
    villeNais: valeur(naissance.villeNais),
    depNais: valeur(naissance.depNais),
    paysNais: valeur(naissance.paysNais),
    profession: valeur(brut?.profession?.libelleCourant),
    catSocPro: valeur(brut?.profession?.socProcINSEE?.catSocPro),
    famSocPro: valeur(brut?.profession?.socProcINSEE?.famSocPro),
    slug: slugActeur(prenom, nom),
    uriHatvp: valeur(brut?.uri_hatvp),
    actif: principal !== null,
    groupeParlementaireUid: groupe?.organeRefUid ?? null,
    mandatPrincipalUid: principal?.uid ?? null,
    circonscriptionUid: depute?.refCirconscription ?? null,
    placeHemicycle: depute?.placeHemicycle ?? null,
    commissionPermanenteRefUid: commission?.organeRefUid ?? null,
    fonctionCommissionPermanente: commission?.libQualite ?? null,
    urlImage: urlPhoto(brut.uid),
    chambre: "AN",
    compteTwitter: reseau("24"),
    compteBluesky: null,
    senatMatricule: null,
    nombreAmendements: 0,
    nombreAmendementsAdoptes: 0,
    nombreInterventions: 0,
    nombreQuestions: 0,
    nombreQuestionsRepondues: 0,
    nombreMandats: mandats.length,
    nombreDocumentsPublies: 0,
    mandatPrincipal: principal,
    auGouvernement: ministre !== null,
  };
  return acteur as unknown as ActeurAN;
}

/** Types d'adresse postale dans l'export AN (`@xsi:type`). */
const ADRESSE_POSTALE = "AdressePostale_Type";

export function adressesElectroniquesDepuisAN(brut: any): AdresseElectronique[] {
  return liste(brut?.adresses?.adresse)
    .filter((a: any) => a?.uid && valeur(a?.["@xsi:type"]) !== ADRESSE_POSTALE)
    .map(
      (a: any) =>
        ({
          uid: a.uid,
          dataset: 0,
          type: valeur(a.type) ?? "",
          typeLibelle: valeur(a.typeLibelle) ?? "",
          poids: valeur(a.poids),
          adresseDeRattachement: valeur(a.adresseDeRattachement),
          valElec: valeur(a.valElec),
          xsiType: valeur(a["@xsi:type"]),
          acteurRefUid: brut.uid,
        }) as unknown as AdresseElectronique
    );
}

export function adressesPostalesDepuisAN(brut: any): AdressePostale[] {
  return liste(brut?.adresses?.adresse)
    .filter((a: any) => a?.uid && valeur(a?.["@xsi:type"]) === ADRESSE_POSTALE)
    .map(
      (a: any) =>
        ({
          uid: a.uid,
          dataset: 0,
          type: valeur(a.type) ?? "",
          typeLibelle: valeur(a.typeLibelle) ?? "",
          poids: valeur(a.poids),
          intitule: valeur(a.intitule),
          adresseDeRattachement: valeur(a.adresseDeRattachement),
          valElec: null,
          numeroRue: valeur(a.numeroRue),
          nomRue: valeur(a.nomRue),
          complementAdresse: valeur(a.complementAdresse),
          codePostal: valeur(a.codePostal),
          ville: valeur(a.ville),
          xsiType: valeur(a["@xsi:type"]),
          acteurRefUid: brut.uid,
        }) as unknown as AdressePostale
    );
}

/** Scrutins rattachés aux actes d'un dossier (`voteRefs`), sans doublon. */
export function scrutinsDuDossier(actesLegislatifs: any): string[] {
  const uids = new Set<string>();
  const parcourir = (noeud: any) => {
    if (Array.isArray(noeud)) noeud.forEach(parcourir);
    else if (noeud && typeof noeud === "object") {
      if (noeud.codeActe) {
        for (const ref of liste(noeud.voteRefs?.voteRef)) {
          const uid = valeur(ref);
          if (uid) uids.add(uid);
        }
      }
      Object.values(noeud).forEach(parcourir);
    }
  };
  parcourir(actesLegislatifs);
  return [...uids];
}
