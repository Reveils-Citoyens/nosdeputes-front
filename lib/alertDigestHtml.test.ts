import { describe, expect, it } from "vitest";
import { rendreDigestHtml } from "./alertDigestHtml";

const options = {
  baseUrl: "https://www.nosdeputes.fr",
  manageUrl: "https://www.nosdeputes.fr/alertes/gerer?token=t",
  unsubUrl: "https://www.nosdeputes.fr/api/alerts/unsubscribe?token=t",
};

describe("rendreDigestHtml", () => {
  it("relie le sujet à sa page et chaque débat à l'intervention", () => {
    const html = rendreDigestHtml(
      [
        {
          subject: { type: "depute", uid: "PA793218", label: "Jordan Guitton" },
          href: "/depute/jordan-guitton",
          lines: [
            { text: "2 amendements déposés", href: "/depute/jordan-guitton/amendements" },
            { text: "jeudi 19 novembre — 4 interventions en séance : Rapports locatifs", href: "/17/dossier/D1/debat/CR1#p-675" },
            { text: "Intervention en commission : Audition", href: "https://www.assemblee-nationale.fr/dyn/opendata/CRC.html" },
          ],
        },
      ],
      options,
    );
    expect(html).toContain('<a href="https://www.nosdeputes.fr/depute/jordan-guitton" style="color: #1A1A1B;">Jordan Guitton</a>');
    expect(html).toContain('href="https://www.nosdeputes.fr/17/dossier/D1/debat/CR1#p-675"');
    // Le compte rendu officiel garde son adresse complète.
    expect(html).toContain('href="https://www.assemblee-nationale.fr/dyn/opendata/CRC.html"');
  });

  it("échappe le libellé fourni par l'abonné et les lignes", () => {
    const html = rendreDigestHtml(
      [
        {
          subject: { type: "dossier", uid: "D1", label: '<a href="https://piege.example">Cliquez</a>' },
          href: null,
          lines: ["Titre avec < et &"],
        },
      ],
      options,
    );
    expect(html).not.toContain("piege.example\">");
    expect(html).toContain("&lt;a href=&quot;https://piege.example&quot;&gt;Cliquez&lt;/a&gt;");
    expect(html).toContain("Titre avec &lt; et &amp;");
  });

  it("affiche les exemples en retrait, avec ou sans lien", () => {
    const html = rendreDigestHtml(
      [
        {
          subject: { type: "recherche", uid: "logement", label: "Recherche « logement »" },
          href: "/recherche?q=logement",
          lines: [
            { text: "Prononcé dans 27 débats (928 interventions)", href: "/recherche?q=logement" },
            { text: "mardi 24 novembre — Julien Rancoule", secondaire: true },
            { text: "Question écrite : Saturation immobilière à Toulouse", href: "https://www.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE19893", secondaire: true },
          ],
        },
      ],
      options,
    );
    expect(html).toContain('list-style: circle; color: #666; font-size: 13px; line-height: 1.5;">mardi 24 novembre — Julien Rancoule</li>');
    expect(html).toContain('href="https://www.assemblee-nationale.fr/dyn/17/questions/QANR5L17QE19893"');
  });
});
