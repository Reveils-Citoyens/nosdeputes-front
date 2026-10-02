/**
 * Les dernières prises de parole d'un député en séance publique, dont la vidéo
 * est réellement consultable.
 *
 * Ce module est la seule implémentation des règles de sélection. Il est partagé
 * par le site (repli à la demande) et par le précalcul nocturne
 * (`scripts/precalculer_prises_de_parole.mjs`), qui l'exécute directement avec
 * Node : il ne doit donc importer aucun module à l'exécution (ni alias `@/`, ni
 * React, ni Next). Les accès réseau sont injectés via `SourcesPrisesDeParole`.
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

/**
 * Liens vidéo d'une réunion : le flux HLS et la page du portail de l'Assemblée.
 *
 * ⚠️ L'archive du diffuseur ne conserve qu'environ l'année en cours : passé ce
 * délai le flux répond 404 alors que `page` reste accessible. Le lecteur bascule
 * seul sur le lien, encore faut-il le lui fournir.
 */
export type Video = {
  /** Flux HLS, lisible dans le navigateur. */
  flux: string | null;
  /** Page de la vidéo sur le site de l'Assemblée, qui survit à l'archivage. */
  page: string | null;
  /**
   * Seconde à laquelle les débats commencent réellement.
   *
   * La captation démarre avant l'ouverture : sur une réunion de commission,
   * l'écart va de quelques secondes à plus d'une demi-heure de salle vide.
   * Ouvrir la vidéo à zéro donne l'impression d'un lecteur cassé.
   */
  secondeDebut: number | null;
};

/** Champs vidéo d'une réunion dans l'API Tricoteuses. */
export const CHAMPS_VIDEO = "uid,urlVideo,urlPageVideo,timecodeDebutVideo";

/** Réunion telle que l'API la rend, réduite aux champs vidéo. */
export type ReunionApi = {
  uid?: string;
  urlVideo?: string | null;
  urlPageVideo?: string | null;
  timecodeDebutVideo?: number | null;
};

/** Une réunion telle que l'API la rend → notre type, ou null si sans vidéo. */
export function versVideo(donnees: ReunionApi | null | undefined): Video | null {
  if (!donnees?.urlVideo && !donnees?.urlPageVideo) return null;
  return {
    flux: donnees.urlVideo ?? null,
    page: donnees.urlPageVideo ?? null,
    secondeDebut: donnees.timecodeDebutVideo ?? null,
  };
}

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

/** En deçà, la prise de parole est une interjection sans intérêt à citer. */
export const LONGUEUR_MINIMALE = 200;
/** Au-delà, on cesse de chercher : les vidéos anciennes ne répondent plus. */
export const SUJETS_A_TESTER = 8;
export const A_AFFICHER = 3;

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Le balisage de l'Assemblée n'a pas sa place dans un aperçu tronqué. */
export function enTexteBrut(texte: string): string {
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

type Candidate = {
  uid?: string;
  dateSeance: string;
  debatRefUid: string;
  dossierRefUid?: string | null;
  stime: string | number;
  texte: string;
  longueur: number;
};

/**
 * Une intervention par sujet — la plus substantielle, celle qui vaut d'être
 * citée — puis les sujets les plus récents d'abord. Le préfixe CRS distingue la
 * séance publique de la commission.
 */
export function choisirCandidates(interventions: any[]): Candidate[] {
  const parSujet = new Map<string, Candidate>();
  for (const ligne of interventions) {
    const debat = ligne.debatRefUid as string | null;
    if (!debat?.startsWith("CRS") || !ligne.stime) continue;
    const texte = enTexteBrut(ligne.texte ?? "");
    if (texte.length < LONGUEUR_MINIMALE) continue;

    const sujet = ligne.dossierRefUid ?? String(ligne.dateSeance).slice(0, 10);
    const retenue = parSujet.get(sujet);
    if (!retenue || texte.length > retenue.longueur) {
      parSujet.set(sujet, { ...ligne, texte, longueur: texte.length });
    }
  }

  return [...parSujet.values()]
    .sort((a, b) => String(b.dateSeance).localeCompare(String(a.dateSeance)))
    .slice(0, SUJETS_A_TESTER);
}

/**
 * Accès aux données. Chaque source renvoie `null` quand la donnée est absente ;
 * `fluxDisponible` distingue en plus « absent » (`false`, ex. 404) de
 * « indéterminé » (`null`, panne réseau ou délai dépassé).
 */
export type SourcesPrisesDeParole = {
  /** Interventions récentes du député, ou `null` si l'API n'a pas répondu. */
  interventions(acteurUid: string): Promise<any[] | null>;
  reunionDuCompteRendu(debatUid: string): Promise<string | null>;
  videoReunion(reunionUid: string | null): Promise<Video | null>;
  fluxDisponible(url: string | null): Promise<boolean | null>;
  vignette(page: string | null): Promise<string | null>;
  titreDossier(dossierUid: string | null): Promise<string | null>;
};

export type ResultatPrisesDeParole = {
  prises: PriseDeParole[];
  /**
   * Vrai si une vérification de flux n'a pas pu aboutir : le résultat peut
   * omettre une vidéo pourtant disponible. Le précalcul ne remplace alors pas
   * un résultat antérieur.
   */
  incomplet: boolean;
};

/**
 * Calcule les prises de parole à afficher, ou `null` si les interventions du
 * député n'ont pas pu être lues.
 *
 * Les candidates sont vérifiées en parallèle, puis retenues dans l'ordre
 * chronologique : le résultat est le même qu'une vérification une à une, sans
 * en additionner les allers-retours.
 */
export async function calculerPrisesDeParole(
  acteurUid: string,
  sources: SourcesPrisesDeParole
): Promise<ResultatPrisesDeParole | null> {
  if (!acteurUid) return { prises: [], incomplet: false };

  const interventions = await sources.interventions(acteurUid);
  if (interventions === null) return null;

  const candidates = choisirCandidates(interventions);
  const verifiees = await Promise.all(
    candidates.map(async (candidate) => {
      const reunionUid = await sources.reunionDuCompteRendu(candidate.debatRefUid);
      const video = await sources.videoReunion(reunionUid);
      const disponible = video ? await sources.fluxDisponible(video.flux) : false;
      return { candidate, video, disponible };
    })
  );

  let incomplet = false;
  const retenues: { candidate: Candidate; video: Video }[] = [];
  for (const { candidate, video, disponible } of verifiees) {
    if (retenues.length >= A_AFFICHER) break;
    if (disponible === null) incomplet = true;
    if (video && disponible) retenues.push({ candidate, video });
  }

  // Vignette et titre ne sont cherchés que pour les retenues : inutile de les
  // charger pour des candidates que la vidéo élimine.
  const prises = await Promise.all(
    retenues.map(async ({ candidate, video }) => {
      const [vignette, dossierTitre] = await Promise.all([
        sources.vignette(video.page),
        sources.titreDossier(candidate.dossierRefUid ?? null),
      ]);
      return {
        dateSeance: candidate.dateSeance,
        extrait: candidate.texte,
        seconde: Number(candidate.stime),
        video,
        compteRenduUid: candidate.debatRefUid,
        dossierUid: candidate.dossierRefUid ?? null,
        dossierTitre,
        vignette,
      };
    })
  );

  return { prises, incomplet };
}

/**
 * Sources HTTP (Tricoteuses et portail de l'Assemblée).
 *
 * `options(ttl)` complète chaque requête : le site y passe la durée de cache de
 * Next (`{ next: { revalidate } }`), le précalcul n'en a pas besoin.
 */
export function creerSourcesHttp({
  api,
  fetch: fetchImpl = fetch,
  options = () => ({}),
}: {
  api: string;
  fetch?: typeof fetch;
  options?: (ttlSecondes: number) => Record<string, unknown>;
}): SourcesPrisesDeParole {
  const lireJson = async (url: string, ttl: number): Promise<any> => {
    const reponse = await fetchImpl(url, options(ttl));
    if (!reponse.ok) return null;
    return (await reponse.json())?.data ?? null;
  };

  return {
    async interventions(acteurUid) {
      const parametres = new URLSearchParams({
        acteurRefUid: acteurUid,
        codeGrammaire: "PAROLE_GENERIQUE",
        sort: "dateSeance.desc",
        perPage: "200",
        select: "uid,dateSeance,debatRefUid,dossierRefUid,stime,texte",
      });
      try {
        const reponse = await fetchImpl(`${api}/interventions/?${parametres}`, options(3600));
        if (!reponse.ok) return null;
        const { data } = await reponse.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return null;
      }
    },

    async reunionDuCompteRendu(debatUid) {
      try {
        const data = await lireJson(`${api}/debats/${debatUid}?select=uid,reunionRefUid`, 86400);
        return data?.reunionRefUid ?? null;
      } catch {
        return null;
      }
    },

    async videoReunion(reunionUid) {
      if (!reunionUid) return null;
      try {
        return versVideo(await lireJson(`${api}/reunions/${reunionUid}?select=${CHAMPS_VIDEO}`, 86400));
      } catch {
        return null;
      }
    },

    async fluxDisponible(url) {
      if (!url) return false;
      try {
        const reponse = await fetchImpl(url, {
          method: "HEAD",
          signal: AbortSignal.timeout(4000),
          ...options(86400),
        });
        if (reponse.ok) return true;
        // Une erreur serveur ne prouve pas que la vidéo a été retirée.
        return reponse.status >= 500 ? null : false;
      } catch {
        return null;
      }
    },

    /**
     * Vignette de la vidéo, déclarée en `og:image` sur la page du portail.
     *
     * Elle n'est pas déductible de l'URL : les noms de fichier varient d'une
     * séance à l'autre — « seances.jpg », « Séance 21h30 lundi.jpg »… — et
     * certaines pages n'en déclarent aucune. Il faut donc lire la page.
     */
    async vignette(page) {
      if (!page) return null;
      try {
        const reponse = await fetchImpl(page, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; NosDeputes)" },
          signal: AbortSignal.timeout(6000),
          ...options(86400),
        });
        if (!reponse.ok) return null;
        const html = await reponse.text();
        const trouve = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
        // Le portail déclare ses images en http : on force https, sinon le
        // navigateur bloque la ressource comme contenu mixte.
        return trouve ? trouve[1].replace(/^http:\/\//, "https://") : null;
      } catch {
        return null;
      }
    },

    async titreDossier(dossierUid) {
      if (!dossierUid) return null;
      try {
        const data = await lireJson(`${api}/dossiers/${dossierUid}?select=uid,titre`, 86400);
        return data?.titre ?? null;
      } catch {
        return null;
      }
    },
  };
}
