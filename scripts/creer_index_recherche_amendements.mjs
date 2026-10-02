/**
 * Crée (ou met à jour) l'index Atlas Search `amendements_search`.
 *
 * Usage : node --env-file=.env scripts/creer_index_recherche_amendements.mjs [--dry-run] [--attendre] [--mettre-a-jour]
 *
 * Idempotent : crée l'index s'il manque. Une définition modifiée n'est appliquée
 * qu'avec `--mettre-a-jour`, car elle déclenche une reconstruction complète. La construction
 * se fait en arrière-plan sur le cluster ; tant que l'index n'est pas
 * interrogeable, le site continue d'utiliser la recherche par regex
 * (`data/mongo/searchAmendementMongo.ts`). Suppression éventuelle :
 * `db.amendements.dropSearchIndex("amendements_search")`.
 *
 * Analyse des contenus d'amendements, stockés en HTML avec entités numériques
 * (`premi&#x00E8;re`) :
 *  - `htmlStrip` retire les balises et décode les entités ;
 *  - minuscules, accents repliés (`icuFolding`) : « reforme » trouve « réforme » ;
 *  - élisions retirées (« l’alinéa » → « alinéa ») ;
 *  - sous-champ `racines` avec racinisation française (pluriels, flexions).
 */
import { parseArgs } from "node:util";
import { isDeepStrictEqual } from "node:util";
import { MongoClient } from "mongodb";

const NOM = "amendements_search";

const ELISION = {
  type: "regex",
  pattern: "^(l|d|j|m|n|s|t|c|qu|jusqu|lorsqu|puisqu)['’]",
  replacement: "",
  matches: "first",
};
const BASE = {
  charFilters: [{ type: "htmlStrip" }],
  tokenizer: { type: "standard" },
};

const contenu = {
  type: "string",
  analyzer: "contenu_html",
  multi: { racines: { type: "string", analyzer: "contenu_html_racines" } },
};

export const DEFINITION = {
  analyzers: [
    { name: "contenu_html", ...BASE, tokenFilters: [{ type: "lowercase" }, { type: "icuFolding" }, ELISION] },
    {
      name: "contenu_html_racines",
      ...BASE,
      tokenFilters: [
        { type: "lowercase" },
        { type: "icuFolding" },
        ELISION,
        { type: "snowballStemming", stemmerName: "french" },
      ],
    },
  ],
  mappings: {
    dynamic: false,
    fields: {
      legislature: { type: "token" },
      cycleDeVie: {
        type: "document",
        fields: { dateSort: { type: "token" }, dateDepot: { type: "token" } },
      },
      corps: {
        type: "document",
        fields: {
          contenuAuteur: {
            type: "document",
            fields: { exposeSommaire: contenu, dispositif: contenu },
          },
        },
      },
    },
  },
};

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    attendre: { type: "boolean", default: false },
    "mettre-a-jour": { type: "boolean", default: false },
  },
});

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGO_URI (ou MONGODB_URI) requis.");
  process.exit(1);
}

const client = await new MongoClient(uri).connect();
try {
  const collection = client.db("parlement").collection("amendements");
  const [existant] = await collection.listSearchIndexes(NOM).toArray();

  if (!existant) {
    console.log(`Création de ${NOM}${args["dry-run"] ? " (dry-run : rien n'est fait)" : ""}`);
    if (!args["dry-run"]) await collection.createSearchIndex({ name: NOM, definition: DEFINITION });
  } else if (args["mettre-a-jour"] && !isDeepStrictEqual(existant.latestDefinition, DEFINITION)) {
    console.log(`Mise à jour de ${NOM}${args["dry-run"] ? " (dry-run : rien n'est fait)" : ""}`);
    if (!args["dry-run"]) await collection.updateSearchIndex(NOM, DEFINITION);
  } else {
    console.log(`${NOM} existe (statut ${existant.status}, interrogeable : ${existant.queryable}).`);
  }

  if (args.attendre && !args["dry-run"]) {
    for (;;) {
      const [index] = await collection.listSearchIndexes(NOM).toArray();
      console.log(`${new Date().toISOString()} statut ${index?.status}, interrogeable : ${index?.queryable}`);
      if (index?.status === "READY" || index?.status === "FAILED") break;
      await new Promise((r) => setTimeout(r, 15_000));
    }
  }
} finally {
  await client.close();
}
