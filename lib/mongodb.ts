import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Initialisation paresseuse : on ne lit MONGODB_URI et on ne se connecte qu'au
// PREMIER appel réel (au runtime), pas au moment de l'import du module. Sinon
// `next build` — qui charge les modules des routes pour collecter leurs métadonnées
// — planterait avec « MONGODB_URI is not defined » alors qu'aucune requête n'a
// encore eu lieu (l'URI n'est fournie qu'à l'exécution du conteneur).
let clientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  // En développement, on réutilise le client entre les hot reloads pour éviter
  // d'épuiser les connexions.
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri).connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    clientPromise = new MongoClient(uri).connect();
  }

  return clientPromise;
}

export async function getParlementDb(): Promise<Db> {
  const c = await getClientPromise();
  return c.db("parlement");
}
