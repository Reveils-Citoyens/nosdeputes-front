import { ObjectId } from "mongodb";

export type AlertSubjectType = "dossier" | "depute";

export type AlertSubject = {
  type: AlertSubjectType;
  uid: string;
  label: string;
};

export type AlertSubscription = {
  _id?: ObjectId;
  email: string;
  /** Token permanent inclus dans tous les liens de gestion envoyés par email. */
  token: string;
  /** Token temporaire (24h) pour la confirmation de l'adresse email. */
  confirmToken: string | null;
  confirmTokenExpiresAt: Date | null;
  confirmed: boolean;
  subjects: AlertSubject[];
  lastDigestSentAt: Date | null;
  createdAt: Date;
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function confirmTokenExpiryDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d;
}
