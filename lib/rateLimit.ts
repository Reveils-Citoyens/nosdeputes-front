import { getParlementDb } from "./mongodb";

type RateLimitDoc = { _id: string; count: number; expireAt: Date };

// L'index TTL n'est créé qu'une fois par process (idempotent côté Mongo).
let indexEnsured = false;

async function getCollection() {
  const db = await getParlementDb();
  const col = db.collection<RateLimitDoc>("rate_limits");
  if (!indexEnsured) {
    indexEnsured = true;
    // Purge automatique des fenêtres écoulées.
    await col.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  }
  return col;
}

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/**
 * Compteur de requêtes par fenêtre fixe, persisté dans MongoDB (fonctionne en
 * serverless, contrairement à un compteur en mémoire). Atomique via un
 * upsert + $inc sur un document unique par (clé, fenêtre).
 *
 * Fail-open : si le store est indisponible, on n'empêche pas l'action — le
 * rate-limit est une protection contre l'abus, pas un mécanisme de sécurité dur.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const id = `${key}:${windowStart}`;
    const col = await getCollection();

    const doc = await col.findOneAndUpdate(
      { _id: id },
      {
        $inc: { count: 1 },
        $setOnInsert: { expireAt: new Date(windowStart + windowMs) },
      },
      { upsert: true, returnDocument: "after" }
    );

    const count = doc?.count ?? 1;
    if (count > limit) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)),
      };
    }
    return { ok: true, retryAfterSec: 0 };
  } catch (err) {
    console.error("[rateLimit] erreur:", err);
    return { ok: true, retryAfterSec: 0 };
  }
}

/** Adresse IP du client derrière le proxy Vercel. */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Réponse 429 normalisée avec en-tête Retry-After. */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response(
    JSON.stringify({ error: "Trop de requêtes. Réessayez plus tard." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSec),
      },
    }
  );
}
