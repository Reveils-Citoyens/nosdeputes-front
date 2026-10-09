/**
 * Crée les index utilisés par les flux RSS des députés (data/flux/fluxDepute.ts).
 *
 * Usage : node --env-file=.env scripts/creer_index_flux_rss.mjs [--dry-run]
 *
 * Idempotent : un index déjà présent avec la même clé n'est pas recréé. Sans
 * ces index, les flux fonctionnent mais parcourent toute la collection des
 * amendements (environ 0,2 s à chaud, plusieurs secondes à froid), une fois
 * par heure et par flux consulté. La construction se fait en arrière-plan.
 * Suppression éventuelle : `db.<collection>.dropIndex("<nom>")`.
 */
import { parseArgs } from "node:util";
import { MongoClient } from "mongodb";

export const INDEX = [
  {
    collection: "amendements",
    nom: "auteur_dateDepot",
    // Amendements d'un député, du plus récent au plus ancien. Sert aussi au
    // compte hebdomadaire des alertes (data/mongo/alertUpdates.ts).
    cle: { "signataires.auteur.acteurRef": 1, "cycleDeVie.dateDepot": -1 },
  },
  {
    collection: "questions",
    nom: "auteur_dateJO",
    cle: { "auteur.identite.acteurRef": 1, "textesQuestion.texteQuestion.infoJO.dateJO": -1 },
  },
];

const { values: args } = parseArgs({
  options: { "dry-run": { type: "boolean", default: false } },
});
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGO_URI (ou MONGODB_URI) requis.");
  process.exit(1);
}
const client = await new MongoClient(uri).connect();
try {
  const db = client.db("parlement");
  for (const { collection, nom, cle } of INDEX) {
    const existants = await db.collection(collection).indexes();
    const meme = existants.find((i) => JSON.stringify(i.key) === JSON.stringify(cle));
    if (meme) {
      console.log(`${collection}.${meme.name} existe déjà.`);
      continue;
    }
    console.log(`Création de ${collection}.${nom}${args["dry-run"] ? " (dry-run : rien n'est fait)" : ""}`);
    if (!args["dry-run"]) await db.collection(collection).createIndex(cle, { name: nom });
  }
} finally {
  await client.close();
}
