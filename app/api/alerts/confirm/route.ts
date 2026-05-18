import { NextRequest, NextResponse } from "next/server";
import { getParlementDb } from "@/lib/mongodb";
import { BASE_URL } from "@/lib/resend";
import type { AlertSubscription } from "@/lib/alerts";

export async function GET(request: NextRequest) {
  const confirmToken = request.nextUrl.searchParams.get("token");

  if (!confirmToken) {
    return NextResponse.redirect(`${BASE_URL}/alertes/erreur?reason=missing_token`);
  }

  const db = await getParlementDb();
  const col = db.collection<AlertSubscription>("alert_subscriptions");

  const subscription = await col.findOne({ confirmToken });

  if (!subscription) {
    return NextResponse.redirect(`${BASE_URL}/alertes/erreur?reason=invalid_token`);
  }

  if (subscription.confirmTokenExpiresAt! < new Date()) {
    return NextResponse.redirect(`${BASE_URL}/alertes/erreur?reason=expired_token`);
  }

  await col.updateOne(
    { confirmToken },
    {
      $set: { confirmed: true, confirmToken: null, confirmTokenExpiresAt: null },
    }
  );

  return NextResponse.redirect(
    `${BASE_URL}/alertes/confirme?token=${subscription.token}`
  );
}
