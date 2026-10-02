/** Lecture seule. Usage : node scripts/check-performance-contracts.mjs
 * Nécessite un build local démarré ; aucune écriture MongoDB ni appel POST.
 */
import assert from "node:assert/strict";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const local = process.env.PERF_CHECK_BASE_URL ?? "http://127.0.0.1:3000";
const upstream = process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL;
assert(upstream, "NEXT_PUBLIC_TRICOTEUSES_API_URL required");

async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  assert.equal(response.status, 200, `HTTP ${response.status} for a contract check`);
  return { body: await response.json(), headers: response.headers };
}

// Les profils sont allégés mais aucun vote ni délégation ne doit disparaître.
const scrutin = "VTANR5L17V8430";
const [originalVotes, compactVotes] = await Promise.all([
  read(`${upstream}/scrutins/${scrutin}?include=votes.acteurRef,votes.groupeVotantRef.organeRef`),
  read(`${local}/api/scrutins/${scrutin}/votes`),
]);
function voteFields(vote) {
  return {
    uid: vote.uid, positionVote: vote.positionVote, parDelegation: vote.parDelegation,
    acteurRef: vote.acteurRef && {
      uid: vote.acteurRef.uid, prenom: vote.acteurRef.prenom, nom: vote.acteurRef.nom,
      slug: vote.acteurRef.slug, urlImage: vote.acteurRef.urlImage,
    },
    groupeVotantRef: vote.groupeVotantRef && {
      uid: vote.groupeVotantRef.uid,
      organeRef: vote.groupeVotantRef.organeRef && {
        libelle: vote.groupeVotantRef.organeRef.libelle,
        libelleAbrev: vote.groupeVotantRef.organeRef.libelleAbrev,
        couleurAssociee: vote.groupeVotantRef.organeRef.couleurAssociee,
      },
    },
  };
}
const byUid = (a, b) => a.uid.localeCompare(b.uid);
assert.deepEqual(compactVotes.body.votes.map(voteFields).sort(byUid), originalVotes.body.data.votes.map(voteFields).sort(byUid));
console.log(`PASS votes : ${compactVotes.body.votes.length} positions, profils et délégations identiques`);

// Les métadonnées complètes maintiennent les filtres et compteurs par article.
const documentUid = "PRJLANR5L17B2841";
const metadataKeys = "uid,numeroLong,sortAmendement,typeAuteur,identifiantDivision,divisionArticleAdditionnel,acteurRefUid,nombreCoSignataires,dateDepot,dateSort".split(",");
const metadata = (item) => Object.fromEntries(metadataKeys.map((key) => [key, item[key]]));
let fullItems = [];
let compactItems = [];
let expectedTotal = 0;
let compactBytes = 0;
for (let page = 1; ; page++) {
  const [full, compact] = await Promise.all([
    read(`${upstream}/amendements?documentRefUid=${documentUid}&chambre=AN&perPage=500&page=${page}&sort=numeroOrdreDepot.asc`),
    read(`${local}/api/liseuse/amendements?documentRefUid=${documentUid}&perPage=500&page=${page}&compact=1`),
  ]);
  expectedTotal = Number(full.headers.get("total"));
  assert(expectedTotal > 0, "Official total required for this fixture");
  assert.equal(compact.body.total, expectedTotal);
  assert.deepEqual(compact.body.items.map(metadata), full.body.data.map(metadata));
  fullItems.push(...full.body.data);
  compactItems.push(...compact.body.items);
  compactBytes += Buffer.byteLength(JSON.stringify(compact.body));
  if (fullItems.length >= expectedTotal) break;
  assert(full.body.data.length > 0, "Missing page");
}
assert.equal(compactItems.length, expectedTotal);
assert.equal(new Set(compactItems.map((a) => a.uid)).size, expectedTotal);
console.log(`PASS liseuse : ${expectedTotal} métadonnées identiques, ${compactBytes} octets au total`);

const amendment = fullItems.find((a) => a.dispositif && a.exposeSommaire);
assert(amendment, "An amendment with both texts is required");
const detail = await read(`${local}/api/liseuse/amendements/${amendment.uid}`);
assert.deepEqual(detail.body, { dispositif: amendment.dispositif, exposeSommaire: amendment.exposeSommaire });
console.log("PASS amendement : dispositif et exposé HTML strictement identiques");

// Le déploiement actuel sert de référence pour la recherche inchangée.
for (const params of [
  "q=logement&sort=relevance&legislature=17", "q=logement&sort=date&legislature=17",
  "q=s%C3%A9curit%C3%A9&sort=relevance&legislature=16",
]) {
  const [before, after] = await Promise.all([
    read(`https://beta.nosdeputes.fr/api/search/amendements?${params}`),
    read(`${local}/api/search/amendements?${params}`),
  ]);
  assert.deepEqual(after.body, before.body);
  console.log(`PASS recherche : filtres, tri, résultats et total identiques (${params})`);
}

// Conserver les références explicites, y compris un compte rendu qui traite
// plusieurs dossiers. Ne pas déduire le rattachement du seul titre du CR.
const debates = await read(`${local}/api/dossiers/DLR5L17N54608/debats`);
const points = await read(`${upstream}/points_odj/?dossierLegislatifUid=DLR5L17N54608&include=agendaRef.compteRenduRef&perPage=100`);
const sharedUid = "CRCANR5L17S2026PO59048N131";
assert(points.body.data.some((p) => p.agendaRef?.compteRenduRef?.some((d) => d.uid === sharedUid)));
assert(debates.body.items.some((d) => d.uid === sharedUid));
console.log("PASS rattachement : les références ODJ explicites sont conservées (CR partagés possibles)");
