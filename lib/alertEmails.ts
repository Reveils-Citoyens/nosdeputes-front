import { resend, FROM, BASE_URL } from "./resend";
import type { AlertSubject } from "./alerts";

export async function sendConfirmationEmail(
  email: string,
  confirmToken: string,
  subjects: AlertSubject[]
) {
  const confirmUrl = `${BASE_URL}/api/alerts/confirm?token=${confirmToken}`;
  const subjectLines = subjects
    .map((s) => `<li>${s.type === "depute" ? "👤" : "📄"} ${s.label}</li>`)
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
  const icon = newSubject.type === "depute" ? "👤" : "📄";

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
