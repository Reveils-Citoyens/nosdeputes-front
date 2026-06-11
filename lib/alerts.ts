import { ObjectId } from "mongodb";

// Types et helpers purs ré-exportés depuis alertTypes (importables côté client).
export {
  isValidEmail,
  confirmTokenExpiryDate,
  subjectTypeLabel,
  subjectTypeEmoji,
} from "./alertTypes";
export type { AlertSubjectType, AlertSubject } from "./alertTypes";

import type { AlertSubject } from "./alertTypes";

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
