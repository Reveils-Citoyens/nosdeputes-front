import { NextRequest, NextResponse } from "next/server";
import { getParlementDb } from "@/lib/mongodb";
import { BASE_URL } from "@/lib/resend";
import type { AlertSubscription } from "@/lib/alerts";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const uid = request.nextUrl.searchParams.get("uid");

  if (!token) {
    return NextResponse.redirect(`${BASE_URL}/alertes/erreur?reason=missing_token`);
  }

  const db = await getParlementDb();
  const col = db.collection<AlertSubscription>("alert_subscriptions");

  if (!uid) {
    // Désabonnement total
    await col.deleteOne({ token });
    return NextResponse.redirect(`${BASE_URL}/alertes/desabonne`);
  }

  // Supprimer un seul sujet
  const result = await col.updateOne(
    { token },
    { $pull: { subjects: { uid } } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.redirect(`${BASE_URL}/alertes/erreur?reason=invalid_token`);
  }

  // Si plus aucun sujet, supprimer l'abonnement entier
  const updated = await col.findOne({ token });
  if (updated && updated.subjects.length === 0) {
    await col.deleteOne({ token });
    return NextResponse.redirect(`${BASE_URL}/alertes/desabonne`);
  }

  return NextResponse.redirect(
    `${BASE_URL}/alertes/gerer?token=${token}&removed=${uid}`
  );
}

// Désabonnement total en un clic (en-tête List-Unsubscribe-Post des clients mail).
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token manquant." }, { status: 400 });
  }
  const db = await getParlementDb();
  const col = db.collection<AlertSubscription>("alert_subscriptions");
  await col.deleteOne({ token });
  return NextResponse.json({ status: "unsubscribed" });
}

// Support DELETE pour les appels programmatiques depuis la page de gestion
export async function DELETE(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const uid = request.nextUrl.searchParams.get("uid");

  if (!token) {
    return NextResponse.json({ error: "Token manquant." }, { status: 400 });
  }

  const db = await getParlementDb();
  const col = db.collection<AlertSubscription>("alert_subscriptions");

  if (!uid) {
    await col.deleteOne({ token });
    return NextResponse.json({ status: "unsubscribed" });
  }

  await col.updateOne({ token }, { $pull: { subjects: { uid } } });

  const updated = await col.findOne({ token });
  if (updated && updated.subjects.length === 0) {
    await col.deleteOne({ token });
    return NextResponse.json({ status: "unsubscribed" });
  }

  return NextResponse.json({ status: "subject_removed" });
}
