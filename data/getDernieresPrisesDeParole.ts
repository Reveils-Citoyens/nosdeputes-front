import * as React from "react";
import { getVideoReunion, type Video } from "./getVideoReunion";

/**
 * Les dernières prises de parole d'un député en séance publique, dont la vidéo
 * est réellement consultable.
 *
 * Trois contraintes façonnent cette sélection :
 *
 *  - **Des sujets distincts.** On regroupe par dossier législatif plutôt que
 *    par séance : la séance du matin et celle de l'après-midi portent sur le
 *    même texte, et deux extraits du même débat n'apprennent rien de plus qu'un
 *    seul. À défaut de dossier rattaché, on retombe sur la journée.
 *  - **Une vidéo qui répond.** Le diffuseur ne conserve qu'environ l'année en
 *    cours : un lien peut exister et renvoyer 404. On le vérifie avant de
 *    proposer le bouton, plutôt que d'offrir une lecture qui échoue.
 *  - **La séance publique seulement.** Les comptes rendus de commission n'ont
 *    ni horodatage d'intervention ni dossier rattaché, donc ni calage vidéo ni
 *    lien vers le débat.
 */

export type PriseDeParole = {
  /** Horodatage de la séance, pas de l'intervention. */
  dateSeance: string;
  /** Extrait en texte brut, pour l'aperçu. */
  extrait: string;
  /** Position dans la vidéo, en secondes. */
  seconde: number;
  video: Video;
  compteRenduUid: string;
  /** Dossier législatif discuté, s'il est rattaché : permet le lien vers le débat. */
  dossierUid: string | null;
  /** Intitulé du texte débattu, plus parlant qu'un identifiant de dossier. */
  dossierTitre: string | null;
  /** Image d'illustration de la vidéo, publiée par le portail de l'Assemblée. */
  vignette: string | null;
};

const API = process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL;

/** En deçà, la prise de parole est une interjection sans intérêt à citer. */
const LONGUEUR_MINIMALE = 200;
/** Au-delà, on cesse de chercher : les vidéos anciennes ne répondent plus. */
const SUJETS_A_TESTER = 8;
const A_AFFICHER = 3;

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Le balisage de l'Assemblée n'a pas sa place dans un aperçu tronqué. */
function enTexteBrut(texte: string): string {
  return texte
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?(?:italique|exposant|indice)>/gi, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Le flux répond-il ? Une URL peut exister dans les métadonnées alors que le
 * média a été retiré de l'archive.
 */
async function fluxDisponible(url: string | null): Promise<boolean> {
  if (!url) return false;
  try {
    const reponse = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 86400 },
    });
    return reponse.ok;
  } catch {
    return false;
  }
}

/**
 * Vignette de la vidéo, déclarée en `og:image` sur la page du portail.
 *
 * Elle n'est pas déductible de l'URL : les noms de fichier varient d'une séance
 * à l'autre — « seances.jpg », « Séance 21h30 lundi.jpg »… — et certaines pages
 * n'en déclarent aucune. Il faut donc lire la page.
 */
async function vignetteDeLaPage(page: string | null): Promise<string | null> {
  if (!page) return null;
  try {
    const reponse = await fetch(page, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NosDeputes)" },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!reponse.ok) return null;

    const html = await reponse.text();
    const trouve = html.match(
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i
    );
    // Le portail déclare ses images en http : on force https, sinon le
    // navigateur bloque la ressource comme contenu mixte.
    return trouve ? trouve[1].replace(/^http:\/\//, "https://") : null;
  } catch {
    return null;
  }
}

/** Intitulé du dossier législatif, pour nommer le texte plutôt que son code. */
async function titreDuDossier(dossierUid: string | null): Promise<string | null> {
  if (!dossierUid) return null;
  try {
    const reponse = await fetch(`${API}/dossiers/${dossierUid}?select=uid,titre`, {
      next: { revalidate: 86400 },
    });
    if (!reponse.ok) return null;
    const { data } = await reponse.json();
    return data?.titre ?? null;
  } catch {
    return null;
  }
}

/** Réunion associée à un compte rendu, seule porteuse des liens vidéo. */
async function reunionDuCompteRendu(debatUid: string): Promise<string | null> {
  try {
    const reponse = await fetch(`${API}/debats/${debatUid}`, {
      next: { revalidate: 86400 },
    });
    if (!reponse.ok) return null;
    const { data } = await reponse.json();
    return data?.reunionRefUid ?? null;
  } catch {
    return null;
  }
}

async function getDernieresPrisesDeParoleUnCached(
  acteurUid: string
): Promise<PriseDeParole[]> {
  if (!acteurUid) return [];

  try {
    const parametres = new URLSearchParams({
      acteurRefUid: acteurUid,
      codeGrammaire: "PAROLE_GENERIQUE",
      "sort": "dateSeance.desc",
      perPage: "200",
      select: "uid,dateSeance,debatRefUid,dossierRefUid,stime,texte",
    });
    const reponse = await fetch(`${API}/interventions/?${parametres}`, {
      next: { revalidate: 3600 },
    });
    if (!reponse.ok) return [];
    const { data } = (await reponse.json()) as { data: any[] };

    // Une intervention par sujet : la plus substantielle, celle qui vaut d'être
    // citée. Le préfixe CRS distingue la séance publique de la commission.
    const parSujet = new Map<string, any>();
    for (const ligne of data) {
      const debat = ligne.debatRefUid as string | null;
      if (!debat?.startsWith("CRS") || !ligne.stime) continue;
      const texte = enTexteBrut(ligne.texte ?? "");
      if (texte.length < LONGUEUR_MINIMALE) continue;

      const sujet = ligne.dossierRefUid ?? String(ligne.dateSeance).slice(0, 10);
      const retenue = parSujet.get(sujet);
      if (!retenue || texte.length > retenue.longueur) {
        parSujet.set(sujet, {
          ...ligne,
          texte,
          longueur: texte.length,
        });
      }
    }

    const candidates = [...parSujet.values()]
      .sort((a, b) => String(b.dateSeance).localeCompare(String(a.dateSeance)))
      .slice(0, SUJETS_A_TESTER);

    const retenues: PriseDeParole[] = [];
    for (const candidate of candidates) {
      if (retenues.length >= A_AFFICHER) break;

      const reunionUid = await reunionDuCompteRendu(candidate.debatRefUid);
      const video = await getVideoReunion(reunionUid);
      if (!video || !(await fluxDisponible(video.flux))) continue;

      // Vignette et titre ne sont cherchés que pour les retenues : inutile de
      // les charger pour des candidates que la vidéo va éliminer.
      const [vignette, dossierTitre] = await Promise.all([
        vignetteDeLaPage(video.page),
        titreDuDossier(candidate.dossierRefUid ?? null),
      ]);

      retenues.push({
        dateSeance: candidate.dateSeance,
        extrait: candidate.texte,
        seconde: Number(candidate.stime),
        video,
        compteRenduUid: candidate.debatRefUid,
        dossierUid: candidate.dossierRefUid ?? null,
        dossierTitre,
        vignette,
      });
    }

    return retenues;
  } catch (error) {
    console.error("Error fetching dernières prises de parole:", error);
    return [];
  }
}

export const getDernieresPrisesDeParole = React.cache(
  getDernieresPrisesDeParoleUnCached
);
