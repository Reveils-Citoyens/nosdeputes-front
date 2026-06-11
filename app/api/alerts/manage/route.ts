import { NextRequest, NextResponse } from "next/server";
import { getParlementDb } from "@/lib/mongodb";
import type { AlertSubscription } from "@/lib/alerts";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token manquant." }, { status: 400 });
  }

  const db = await getParlementDb();
  const col = db.collection<AlertSubscription>("alert_subscriptions");

  const subscription = await col.findOne(
    { token },
    { projection: { _id: 0, email: 1, confirmed: 1, subjects: 1, lastDigestSentAt: 1 } }
  );

  if (!subscription) {
    return NextResponse.json({ error: "Abonnement introuvable." }, { status: 404 });
  }

  return NextResponse.json(subscription);
}
