import { NextRequest, NextResponse } from "next/server";
import { getParlementDb } from "@/lib/mongodb";
import {
  isValidEmail,
  confirmTokenExpiryDate,
  type AlertSubject,
  type AlertSubscription,
} from "@/lib/alerts";
import {
  sendConfirmationEmail,
  sendSubjectAddedEmail,
} from "@/lib/alertEmails";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  const { email, subjectType, subjectUid, subjectLabel } = body ?? {};

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }
  if (!subjectType || !subjectUid || !subjectLabel) {
    return NextResponse.json({ error: "Sujet manquant." }, { status: 400 });
  }
  if (subjectType !== "dossier" && subjectType !== "depute") {
    return NextResponse.json({ error: "Type de sujet invalide." }, { status: 400 });
  }

  const newSubject: AlertSubject = {
    type: subjectType,
    uid: subjectUid,
    label: subjectLabel,
  };

  const db = await getParlementDb();
  const col = db.collection<AlertSubscription>("alert_subscriptions");

  const existing = await col.findOne({ email });

  if (existing) {
    // Vérifier que le sujet n'est pas déjà suivi
    const alreadyTracked = existing.subjects.some((s) => s.uid === subjectUid);
    if (alreadyTracked) {
      return NextResponse.json({ status: "already_subscribed" });
    }

    // Ajouter le sujet
    await col.updateOne(
      { email },
      { $push: { subjects: newSubject } }
    );

    if (!existing.confirmed) {
      const allSubjects = [...existing.subjects, newSubject];
      try {
        await sendConfirmationEmail(email, existing.confirmToken!, allSubjects);
      } catch (err) {
        console.error("[alerts] Erreur envoi confirmation:", err);
        return NextResponse.json({ status: "confirmation_resent", emailError: true });
      }
      return NextResponse.json({ status: "confirmation_resent" });
    }

    try {
      await sendSubjectAddedEmail(email, existing.token, newSubject);
    } catch (err) {
      console.error("[alerts] Erreur envoi notification:", err);
      return NextResponse.json({ status: "subject_added", emailError: true });
    }
    return NextResponse.json({ status: "subject_added" });
  }

  // Nouvelle subscription
  const token = crypto.randomUUID();
  const confirmToken = crypto.randomUUID();

  const subscription: AlertSubscription = {
    email,
    token,
    confirmToken,
    confirmTokenExpiresAt: confirmTokenExpiryDate(),
    confirmed: false,
    subjects: [newSubject],
    lastDigestSentAt: null,
    createdAt: new Date(),
  };

  await col.insertOne(subscription);

  try {
    await sendConfirmationEmail(email, confirmToken, [newSubject]);
  } catch (err) {
    console.error("[alerts] Erreur envoi confirmation:", err);
    return NextResponse.json(
      { status: "confirmation_sent", emailError: true },
      { status: 201 }
    );
  }

  return NextResponse.json({ status: "confirmation_sent" }, { status: 201 });
}
