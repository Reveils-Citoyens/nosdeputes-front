import { subjectTypeEmoji } from "./alertTypes";
import type { AlertLine, SubjectUpdate } from "@/data/mongo/alertUpdates";

/**
 * HTML du récapitulatif hebdomadaire. Séparé de l'envoi (lib/alertEmails.ts)
 * pour être testé et prévisualisé sans client Resend.
 */

/**
 * Le libellé d'un sujet est fourni par le navigateur à l'abonnement : sans
 * échappement, n'importe qui pourrait faire partir de notre adresse un email
 * au contenu de son choix. Les titres de dossiers peuvent aussi contenir « < ».
 */
export function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Lien absolu : les chemins du site sont préfixés, le compte rendu officiel est déjà complet. */
export function urlAbsolue(href: string, baseUrl: string): string {
  return /^https?:\/\//.test(href) ? href : `${baseUrl}${href}`;
}

function ligne(l: AlertLine, baseUrl: string): string {
  const objet = typeof l === "string" ? { text: l } : l;
  const contenu = objet.href
    ? `<a href="${echapperHtml(urlAbsolue(objet.href, baseUrl))}" style="color: #1A1A1B;">${echapperHtml(objet.text)}</a>`
    : echapperHtml(objet.text);
  // Exemple rattaché à la ligne précédente : en retrait, plus discret.
  return objet.secondaire
    ? `<li style="margin: 2px 0 2px 14px; list-style: circle; color: #666; font-size: 13px; line-height: 1.5;">${contenu}</li>`
    : `<li style="margin: 2px 0; color: #444; line-height: 1.5;">${contenu}</li>`;
}

export function rendreDigestHtml(
  updates: SubjectUpdate[],
  { baseUrl, manageUrl, unsubUrl }: { baseUrl: string; manageUrl: string; unsubUrl: string }
): string {
  const sections = updates
    .map((u) => {
      const libelle = echapperHtml(u.subject.label);
      const titre = u.href
        ? `<a href="${echapperHtml(urlAbsolue(u.href, baseUrl))}" style="color: #1A1A1B;">${libelle}</a>`
        : libelle;
      return `
        <div style="margin: 0 0 20px; padding: 16px; border: 1px solid #eee; border-radius: 12px;">
          <p style="margin: 0 0 8px; font-weight: bold; font-size: 15px;">
            ${subjectTypeEmoji(u.subject.type)} ${titre}
          </p>
          <ul style="margin: 0; padding-left: 18px;">${u.lines.map((l) => ligne(l, baseUrl)).join("")}</ul>
        </div>`;
    })
    .join("");

  return `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A1B;">
        <h2 style="margin-bottom: 4px;">Votre récapitulatif</h2>
        <p style="color: #666; margin-top: 0;">
          Voici ce qui a bougé sur les sujets que vous suivez.
        </p>
        ${sections}
        <a href="${echapperHtml(manageUrl)}"
           style="display:inline-block; background:#1A1A1B; color:#fff;
                  padding: 12px 28px; border-radius: 30px; text-decoration: none;
                  font-weight: bold; margin: 8px 0;">
          Gérer mes alertes
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 11px; color: #aaa;">
          NosDéputés.fr — Observatoire citoyen de l'activité parlementaire.
          <a href="${echapperHtml(unsubUrl)}" style="color: #aaa;">Se désabonner de toutes les alertes</a>.
        </p>
      </div>
    `;
}
