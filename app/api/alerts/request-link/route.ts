import { NextRequest, NextResponse } from "next/server";
import { getParlementDb } from "@/lib/mongodb";
import { isValidEmail, type AlertSubscription } from "@/lib/alerts";
import { sendManageLinkEmail } from "@/lib/alertEmails";

/**
 * POST /api/alerts/request-link
 * Renvoie par email le lien de gestion (magic link) associé à une adresse.
 * Réponse toujours générique : on ne révèle jamais si l'email existe ou non
 * (protection contre l'énumération d'adresses).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const db = await getParlementDb();
  const col = db.collection<AlertSubscription>("alert_subscriptions");

  const subscription = await col.findOne({ email });

  // On n'envoie un email que si un abonnement confirmé existe et a des sujets,
  // mais on renvoie toujours la même réponse au client.
  if (subscription && subscription.confirmed && subscription.subjects.length > 0) {
    try {
      await sendManageLinkEmail(email, subscription.token, subscription.subjects);
    } catch (err) {
      console.error("[alerts] Erreur envoi lien de gestion:", err);
      // On reste générique côté client malgré l'erreur serveur.
    }
  }

  return NextResponse.json({ status: "ok" });
}
