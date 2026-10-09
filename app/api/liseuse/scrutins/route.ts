import { NextRequest, NextResponse } from "next/server";
import { startServerTiming } from "@/lib/serverTiming";
import { estUidScrutin, versResume, type ScrutinResume } from "@/data/liseuse/scrutinsAmendements";

const CHAMPS = "uid,numero,titre,dateScrutin,code,pour,contre,abstentions,libelleTypeVote";
const PAR_PAGE = 500;
/** Garde-fou : le PLF 2025 compte 335 scrutins sur son texte. */
const PAGES_MAX = 10;
/** Scrutins demandés un par un (ceux sans document rattaché en amont). */
const UIDS_MAX = 50;

async function lireDocument(api: string, documentRefUid: string): Promise<ScrutinResume[]> {
  const resumes: ScrutinResume[] = [];
  for (let page = 1; page <= PAGES_MAX; page++) {
    const url = new URL(`${api}/scrutins`);
    url.searchParams.set("documentRefUid", documentRefUid);
    url.searchParams.set("perPage", String(PAR_PAGE));
    url.searchParams.set("page", String(page));
    url.searchParams.set("select", CHAMPS);
    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
    const { data } = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid scrutin list");
    for (const brut of data) {
      const r = versResume(brut);
      if (r) resumes.push(r);
    }
    if (data.length < PAR_PAGE) return resumes;
  }
  throw new Error("Too many scrutin pages");
}

/**
 * Quelques scrutins n'ont pas de document rattaché en amont (8 sur 324 pour
 * le PLF 2025) : la liste par document ne les contient pas.
 */
async function lireUids(api: string, uids: string[]): Promise<ScrutinResume[]> {
  const resultats = await Promise.all(
    uids.map(async (uid) => {
      const res = await fetch(`${api}/scrutins/${uid}?select=${CHAMPS}`, { next: { revalidate: 300 } });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`);
      const { data } = await res.json();
      return data ? versResume(data) : null;
    }),
  );
  return resultats.filter((r): r is ScrutinResume => r !== null);
}

export async function GET(req: NextRequest) {
  const finishTiming = startServerTiming("liseuse-scrutins");
  const sp = req.nextUrl.searchParams;
  const documentRefUid = sp.get("documentRefUid");
  const uids = (sp.get("uids") ?? "").split(",").filter(Boolean);
  const api = process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL ?? "";

  if (documentRefUid ? !/^[A-Z0-9]{8,40}$/.test(documentRefUid) : uids.length === 0) {
    return NextResponse.json({ error: "documentRefUid or uids required" }, { status: 400 });
  }
  if (uids.length > UIDS_MAX || !uids.every(estUidScrutin)) {
    return NextResponse.json({ error: "Invalid uids" }, { status: 400 });
  }

  try {
    const scrutins = documentRefUid ? await lireDocument(api, documentRefUid) : await lireUids(api, uids);
    return NextResponse.json(
      { scrutins },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600", "Server-Timing": finishTiming() } },
    );
  } catch (e) {
    // Sans en-tête de cache : une panne amont n'est pas figée.
    console.error("[liseuse/scrutins]", e);
    return NextResponse.json({ error: "Scrutins unavailable" }, { status: 502 });
  }
}
