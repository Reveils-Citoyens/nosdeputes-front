// Helpers et types purs (sans dépendance Node/mongodb) — importables côté client.
// `lib/alerts.ts` les ré-exporte et y ajoute `AlertSubscription` (qui dépend de mongodb).

export type AlertSubjectType = "dossier" | "depute" | "recherche" | "theme";

export type AlertSubject = {
  type: AlertSubjectType;
  uid: string;
  label: string;
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function confirmTokenExpiryDate(): Date {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d;
}

/** Libellé humain pour un type de sujet d'alerte. */
export function subjectTypeLabel(type: AlertSubjectType): string {
  switch (type) {
    case "depute":
      return "Député";
    case "recherche":
      return "Recherche";
    case "theme":
      return "Thème";
    case "dossier":
    default:
      return "Dossier";
  }
}

/** Emoji associé à un type de sujet (utilisé dans les emails). */
export function subjectTypeEmoji(type: AlertSubjectType): string {
  switch (type) {
    case "depute":
      return "👤";
    case "recherche":
      return "🔍";
    case "theme":
      return "🏷️";
    case "dossier":
    default:
      return "📄";
  }
}
