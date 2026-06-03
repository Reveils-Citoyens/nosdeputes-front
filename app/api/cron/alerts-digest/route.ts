import { NextRequest, NextResponse } from "next/server";
import { getParlementDb } from "@/lib/mongodb";
import type { AlertSubscription } from "@/lib/alerts";
import { computeSubjectUpdates } from "@/data/mongo/alertUpdates";
import { sendDigestEmail } from "@/lib/alertEmails";

// Le calcul peut être long (requêtes par sujet) → on autorise jusqu'à 5 min.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// On ne renvoie un digest qu'aux abonnés dont le dernier envoi date de > 6 jours
// (ou jamais). Garantit "au plus un email par semaine" même en cas de rejeu.
const MIN_DAYS_BETWEEN_DIGESTS = 6;

export async function GET(request: NextRequest) {
  // Auth : Vercel Cron injecte `Authorization: Bearer $CRON_SECRET`.
  // Le mode test expose des données d'abonnés → on exige aussi l'auth.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  // Mode test : calcule et renvoie le contenu sans rien envoyer ni modifier.
  const dry = sp.get("dry") === "1" || sp.get("dry") === "true";
  const emailFilter = sp.get("email")?.trim() || null;
  // En mode test, permet d'élargir la fenêtre "depuis" pour voir du contenu.
  const daysOverride = dry ? parseInt(sp.get("days") ?? "", 10) : NaN;

  const db = await getParlementDb();
  const col = db.collection<AlertSubscription>("alert_subscriptions");

  const now = new Date();
  const cutoff = new Date(now.getTime() - MIN_DAYS_BETWEEN_DIGESTS * 24 * 60 * 60 * 1000);

  const query: Record<string, unknown> = {
    confirmed: true,
    "subjects.0": { $exists: true },
  };
  // En mode réel : on respecte l'intervalle d'1 semaine.
  // En mode test : on ignore le cutoff pour pouvoir re-tester librement.
  if (!dry) {
    query.$or = [{ lastDigestSentAt: null }, { lastDigestSentAt: { $lt: cutoff } }];
  }
  if (emailFilter) {
    query.email = emailFilter;
  }

  const subscriptions = await col.find(query).toArray();

  let processed = 0;
  let sent = 0;
  let failed = 0;
  const preview: { email: string; updates: { subject: string; lines: string[] }[] }[] = [];

  for (const sub of subscriptions) {
    processed++;
    // Fenêtre "nouveautés depuis" : override en mode test, sinon dernier envoi / création / 7 j.
    const since = !Number.isNaN(daysOverride)
      ? new Date(now.getTime() - daysOverride * 24 * 60 * 60 * 1000)
      : sub.lastDigestSentAt ??
        sub.createdAt ??
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      const updates = await computeSubjectUpdates(db, sub.subjects, since);
      if (updates.length === 0) continue; // rien de neuf → pas d'email, pas de maj de date

      if (dry) {
        preview.push({
          email: sub.email,
          updates: updates.map((u) => ({ subject: u.subject.label, lines: u.lines })),
        });
        sent++; // nombre d'emails qui *seraient* envoyés
        continue;
      }

      await sendDigestEmail(sub.email, sub.token, updates);
      await col.updateOne({ _id: sub._id }, { $set: { lastDigestSentAt: now } });
      sent++;
    } catch (err) {
      failed++;
      console.error(`[digest] Échec pour ${sub.email}:`, err);
    }
  }

  console.log(`[digest] dry=${dry} processed=${processed} sent=${sent} failed=${failed}`);
  return NextResponse.json(
    dry
      ? { dry: true, processed, wouldSend: sent, failed, preview }
      : { processed, sent, failed }
  );
}
