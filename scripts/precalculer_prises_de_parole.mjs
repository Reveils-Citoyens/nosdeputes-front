/**
 * Précalcul nocturne des « dernières prises de parole » (vidéos) des députés.
 *
 * Usage : node scripts/precalculer_prises_de_parole.mjs [--dry-run] [--limite N] [--acteur PA…]
 *
 * Sur la fiche député, ce calcul enchaîne une quinzaine d'appels vers
 * Tricoteuses et le portail vidéo de l'Assemblée (2 à 5 s mesurées). Il est fait
 * ici une fois par nuit pour tous les députés en exercice, et la fiche lit le
 * résultat dans MongoDB (`data/getDernieresPrisesDeParole.ts`).
 *
 * Les règles de sélection ne sont pas dupliquées : ce script exécute
 * `data/prisesDeParoleVideo.ts`, comme le site (Node ≥ 23.6 lit le TypeScript).
 *
 * Une entrée existante n'est jamais remplacée par un résultat dégradé : panne
 * de l'API pour ce député, ou vérification de flux vidéo indéterminée.
 *
 * Variables : MONGO_URI (ou MONGODB_URI), TRICOTEUSES_API_URL (ou
 * NEXT_PUBLIC_TRICOTEUSES_API_URL ; défaut : API de production).
 */
import { appendFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { MongoClient } from "mongodb";
import { calculerPrisesDeParole, creerSourcesHttp } from "../data/prisesDeParoleVideo.ts";

const COLLECTION = "prises_de_parole_video";
/** Requêtes simultanées : l'API Tricoteuses ralentit nettement au-delà. */
const REQUETES_SIMULTANEES = 6;
/** Députés traités en parallèle (leurs requêtes passent par la même limite). */
const DEPUTES_SIMULTANES = 8;
/** Écriture par lots : une exécution interrompue conserve ce qui est calculé. */
const TAILLE_LOT = 50;
/** Au-delà de cette part de députés en échec, le script sort en erreur. */
const ECHECS_TOLERES = 0.2;

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    limite: { type: "string" },
    acteur: { type: "string" },
  },
});

const api = (
  process.env.TRICOTEUSES_API_URL ||
  process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL ||
  "https://parlement.tricoteuses.fr"
).replace(/\/$/, "");
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri && !args["dry-run"]) {
  console.error("MONGO_URI (ou MONGODB_URI) requis.");
  process.exit(1);
}

/** Limite le nombre de requêtes HTTP en vol, toutes sources confondues. */
function limiter(max) {
  let actives = 0;
  const attente = [];
  const suivante = () => {
    if (actives >= max || attente.length === 0) return;
    actives++;
    const { tache, resoudre, rejeter } = attente.shift();
    tache().then(resoudre, rejeter).finally(() => {
      actives--;
      suivante();
    });
  };
  return (tache) =>
    new Promise((resoudre, rejeter) => {
      attente.push({ tache, resoudre, rejeter });
      suivante();
    });
}

const limite = limiter(REQUETES_SIMULTANEES);
let requetes = 0;
/** Réponses non 2xx et erreurs réseau, par hôte, pour le diagnostic. */
const anomalies = new Map();
const noter = (url, cause) => {
  const cle = `${new URL(url).host} ${cause}`;
  anomalies.set(cle, (anomalies.get(cle) ?? 0) + 1);
};
const fetchLimite = (url, init) =>
  limite(async () => {
    requetes++;
    try {
      const reponse = await fetch(url, init);
      if (!reponse.ok) noter(url, `HTTP ${reponse.status}`);
      return reponse;
    } catch (erreur) {
      noter(url, erreur.cause?.code ?? erreur.name);
      throw erreur;
    }
  });

/**
 * Plusieurs députés interviennent dans la même séance : réunion, flux,
 * vignette et titre de dossier ne sont résolus qu'une fois par exécution.
 */
function memoiser(fn) {
  const cache = new Map();
  return (cle) => {
    if (!cache.has(cle)) cache.set(cle, fn(cle));
    return cache.get(cle);
  };
}

const http = creerSourcesHttp({ api, fetch: fetchLimite });
const sources = {
  // Une nouvelle tentative après une pause : un épisode de surcharge passager
  // de l'API (observé : 248 échecs sur 591 lors d'un essai, 0 au suivant) ne
  // doit pas priver le député de son entrée du jour.
  async interventions(acteurUid) {
    const premiere = await http.interventions(acteurUid);
    if (premiere !== null) return premiere;
    await new Promise((r) => setTimeout(r, 2000));
    return http.interventions(acteurUid);
  },
  reunionDuCompteRendu: memoiser(http.reunionDuCompteRendu),
  videoReunion: memoiser(http.videoReunion),
  fluxDisponible: memoiser(http.fluxDisponible),
  vignette: memoiser(http.vignette),
  titreDossier: memoiser(http.titreDossier),
};

async function deputesEnExercice() {
  if (args.acteur) return [args.acteur];
  const reponse = await fetch(`${api}/acteurs/?chambre=AN&actif=true&perPage=1000&select=uid`);
  if (!reponse.ok) throw new Error(`Liste des députés indisponible (HTTP ${reponse.status})`);
  const { data } = await reponse.json();
  const uids = data.map((acteur) => acteur.uid).filter(Boolean);
  // Garde-fou : une liste tronquée ne doit pas passer pour un import complet.
  if (uids.length < 500) throw new Error(`Liste des députés incomplète (${uids.length})`);
  return args.limite ? uids.slice(0, Number(args.limite)) : uids;
}

const debut = Date.now();
const client = mongoUri ? await new MongoClient(mongoUri).connect() : null;
try {
  const collection = client?.db("parlement").collection(COLLECTION);
  const uids = await deputesEnExercice();
  const existants = new Set(
    collection ? await collection.distinct("_id", { _id: { $in: uids } }) : []
  );

  const bilan = { ecrits: 0, avecVideos: 0, conserves: 0, echecs: 0 };
  const operations = [];
  let apercu = null;
  async function ecrire() {
    const lot = operations.splice(0);
    if (lot.length === 0) return;
    apercu ??= lot[0].replaceOne.replacement;
    if (!args["dry-run"]) await collection.bulkWrite(lot, { ordered: false });
  }
  let suivant = 0;
  async function travailleur() {
    while (suivant < uids.length) {
      const acteurUid = uids[suivant++];
      let resultat = null;
      try {
        resultat = await calculerPrisesDeParole(acteurUid, sources);
      } catch (erreur) {
        console.error(`[${acteurUid}]`, erreur);
      }
      if (resultat === null) {
        bilan.echecs++;
        continue;
      }
      if (resultat.incomplet && existants.has(acteurUid)) {
        bilan.conserves++;
        continue;
      }
      bilan.ecrits++;
      if (resultat.prises.length > 0) bilan.avecVideos++;
      operations.push({
        replaceOne: {
          filter: { _id: acteurUid },
          replacement: {
            prises: resultat.prises,
            incomplet: resultat.incomplet,
            calculeLe: new Date(),
          },
          upsert: true,
        },
      });
      if (operations.length >= TAILLE_LOT) await ecrire();
    }
  }
  await Promise.all(Array.from({ length: DEPUTES_SIMULTANES }, travailleur));

  await ecrire();

  const duree = Math.round((Date.now() - debut) / 1000);
  const resume =
    `Prises de parole vidéo : ${uids.length} députés, ${bilan.ecrits} écrits ` +
    `(${bilan.avecVideos} avec vidéos), ${bilan.conserves} conservés (vérification indéterminée), ` +
    `${bilan.echecs} en échec — ${requetes} requêtes, ${duree} s` +
    (args["dry-run"] ? " (dry-run, aucune écriture)" : "");
  console.log(resume);
  for (const [cle, nombre] of anomalies) console.log(`  ${cle} : ${nombre}`);
  if (args["dry-run"]) console.log(JSON.stringify(apercu, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${resume}\n`);

  if (bilan.echecs > uids.length * ECHECS_TOLERES) {
    console.error(`Trop d'échecs (${bilan.echecs}/${uids.length}) : vérifier l'API Tricoteuses.`);
    process.exitCode = 1;
  }
} finally {
  await client?.close();
}
