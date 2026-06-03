import { resend, FROM, BASE_URL } from "./resend";
import { subjectTypeEmoji, type AlertSubject } from "./alerts";
import type { SubjectUpdate } from "@/data/mongo/alertUpdates";

export async function sendConfirmationEmail(
  email: string,
  confirmToken: string,
  subjects: AlertSubject[]
) {
  const confirmUrl = `${BASE_URL}/api/alerts/confirm?token=${confirmToken}`;
  const subjectLines = subjects
    .map((s) => `<li>${subjectTypeEmoji(s.type)} ${s.label}</li>`)
    .join("");

  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Confirmez vos alertes NosDéputés.fr",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A1B;">
        <h2 style="color: #1A1A1B;">Confirmez votre abonnement aux alertes</h2>
        <p>Vous avez demandé à recevoir des alertes hebdomadaires pour :</p>
        <ul style="line-height: 1.8;">${subjectLines}</ul>
        <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email :</p>
        <a href="${confirmUrl}"
           style="display:inline-block; background:#1A1A1B; color:#fff;
                  padding: 12px 28px; border-radius: 30px; text-decoration: none;
                  font-weight: bold; margin: 16px 0;">
          Confirmer mon alerte
        </a>
        <p style="font-size: 12px; color: #888;">
          Ce lien expire dans 24h. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 11px; color: #aaa;">NosDéputés.fr — Observatoire citoyen de l'activité parlementaire</p>
      </div>
    `,
  });

  console.log("[Resend] sendConfirmationEmail →", JSON.stringify(result));

  if (result.error) {
    throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
  }
}

export async function sendSubjectAddedEmail(
  email: string,
  manageToken: string,
  newSubject: AlertSubject
) {
  const manageUrl = `${BASE_URL}/alertes/gerer?token=${manageToken}`;
  const unsubUrl = `${BASE_URL}/api/alerts/unsubscribe?token=${manageToken}&uid=${newSubject.uid}`;
  const icon = subjectTypeEmoji(newSubject.type);

  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Nouvelle alerte ajoutée — ${newSubject.label}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A1B;">
        <h2>Alerte ajoutée ✓</h2>
        <p>Vous recevrez désormais des alertes hebdomadaires pour :</p>
        <p style="font-size: 16px; font-weight: bold;">${icon} ${newSubject.label}</p>
        <a href="${manageUrl}"
           style="display:inline-block; background:#1A1A1B; color:#fff;
                  padding: 12px 28px; border-radius: 30px; text-decoration: none;
                  font-weight: bold; margin: 16px 0;">
          Gérer mes alertes
        </a>
        <p style="font-size: 12px; color: #888; margin-top: 24px;">
          <a href="${unsubUrl}" style="color: #888;">Se désabonner de cette alerte</a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 11px; color: #aaa;">NosDéputés.fr — Observatoire citoyen de l'activité parlementaire</p>
      </div>
    `,
  });

  console.log("[Resend] sendSubjectAddedEmail →", JSON.stringify(result));

  if (result.error) {
    throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
  }
}

/**
 * Renvoie à l'utilisateur son lien de gestion (magic link) à partir de son email.
 * Utilisé par la page /alertes de récupération de lien.
 */
export async function sendManageLinkEmail(
  email: string,
  manageToken: string,
  subjects: AlertSubject[]
) {
  const manageUrl = `${BASE_URL}/alertes/gerer?token=${manageToken}`;
  const subjectLines = subjects
    .map((s) => `<li>${subjectTypeEmoji(s.type)} ${s.label}</li>`)
    .join("");

  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Votre lien de gestion des alertes NosDéputés.fr",
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A1B;">
        <h2>Gérer vos alertes</h2>
        <p>Voici votre lien personnel pour consulter et gérer vos alertes :</p>
        ${subjects.length > 0 ? `<ul style="line-height: 1.8;">${subjectLines}</ul>` : ""}
        <a href="${manageUrl}"
           style="display:inline-block; background:#1A1A1B; color:#fff;
                  padding: 12px 28px; border-radius: 30px; text-decoration: none;
                  font-weight: bold; margin: 16px 0;">
          Gérer mes alertes
        </a>
        <p style="font-size: 12px; color: #888;">
          Conservez cet email : ce lien reste valable et vous permet d'accéder à vos alertes à tout moment.
          Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 11px; color: #aaa;">NosDéputés.fr — Observatoire citoyen de l'activité parlementaire</p>
      </div>
    `,
  });

  console.log("[Resend] sendManageLinkEmail →", JSON.stringify(result));

  if (result.error) {
    throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
  }
}

/**
 * Email récapitulatif hebdomadaire : une seule synthèse par abonné, agrégeant
 * tous ses sujets ayant du nouveau. Contenu 100% issu de données structurées
 * (aucun appel LLM). Pied de page : magic link de gestion + désabonnement.
 */
export async function sendDigestEmail(
  email: string,
  token: string,
  updates: SubjectUpdate[]
) {
  const manageUrl = `${BASE_URL}/alertes/gerer?token=${token}`;
  const unsubUrl = `${BASE_URL}/api/alerts/unsubscribe?token=${token}`;

  const sections = updates
    .map((u) => {
      const items = u.lines
        .map(
          (l) =>
            `<li style="margin: 2px 0; color: #444; line-height: 1.5;">${l}</li>`
        )
        .join("");
      return `
        <div style="margin: 0 0 20px; padding: 16px; border: 1px solid #eee; border-radius: 12px;">
          <p style="margin: 0 0 8px; font-weight: bold; font-size: 15px;">
            ${subjectTypeEmoji(u.subject.type)} ${u.subject.label}
          </p>
          <ul style="margin: 0; padding-left: 18px;">${items}</ul>
        </div>`;
    })
    .join("");

  const result = await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Votre récapitulatif hebdomadaire — NosDéputés.fr",
    headers: {
      // Désabonnement natif du client mail (conformité Gmail/Yahoo).
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1A1A1B;">
        <h2 style="margin-bottom: 4px;">Votre récapitulatif</h2>
        <p style="color: #666; margin-top: 0;">
          Voici ce qui a bougé sur les sujets que vous suivez.
        </p>
        ${sections}
        <a href="${manageUrl}"
           style="display:inline-block; background:#1A1A1B; color:#fff;
                  padding: 12px 28px; border-radius: 30px; text-decoration: none;
                  font-weight: bold; margin: 8px 0;">
          Gérer mes alertes
        </a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="font-size: 11px; color: #aaa;">
          NosDéputés.fr — Observatoire citoyen de l'activité parlementaire.
          <a href="${unsubUrl}" style="color: #aaa;">Se désabonner de toutes les alertes</a>.
        </p>
      </div>
    `,
  });

  console.log("[Resend] sendDigestEmail →", JSON.stringify(result));

  if (result.error) {
    throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
  }
}
