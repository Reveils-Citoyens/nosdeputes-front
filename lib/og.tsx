import * as React from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

// Images de partage (Open Graph / Twitter) générées par les fichiers
// `opengraph-image.tsx`. Format recommandé par Facebook, X, LinkedIn,
// Bluesky et WhatsApp : 1200×630.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const COULEURS = {
  fond: "#FFFFFF",
  texte: "#171B1E",
  secondaire: "#5C6670",
  bordure: "#E9ECEF",
  fondDoux: "#F4F6F8",
  accent: "#006C93",
};

// Satori ne sait pas choisir une graisse dans une police variable : il
// prendrait l'instance par défaut de Raleway, Thin (100). On charge donc des
// instances statiques dérivées de Raleway-Variable.ttf (cf. app/fonts/README.md).
let policesPromise: Promise<{ medium: Buffer; bold: Buffer; logo: string }> | null = null;

function chargerRessources() {
  if (!policesPromise) {
    const racine = process.cwd();
    policesPromise = Promise.all([
      readFile(path.join(racine, "app/fonts/Raleway-Medium.ttf")),
      readFile(path.join(racine, "app/fonts/Raleway-Bold.ttf")),
      readFile(path.join(racine, "public/logo-nav.png")),
    ])
      .then(([medium, bold, logo]) => ({
        medium,
        bold,
        logo: `data:image/png;base64,${logo.toString("base64")}`,
      }))
      .catch((error) => {
        // Ne pas garder en cache un échec de lecture : réessayer au prochain appel.
        policesPromise = null;
        throw error;
      });
  }
  return policesPromise;
}

/**
 * Télécharge une photo et la renvoie en data URI. Satori ne gère que JPEG et
 * PNG, et une image distante en échec ferait échouer toute la génération :
 * on renvoie null (repli sur les initiales) plutôt que de casser l'aperçu.
 * Le format est détecté sur les octets, le stockage S3 ne renvoyant pas
 * toujours un Content-Type fiable.
 */
export async function chargerPhoto(url: string | null | undefined): Promise<string | null> {
  if (!url || !url.startsWith("https://")) return null;
  try {
    const rep = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 86400 },
    });
    if (!rep.ok) return null;
    const octets = Buffer.from(await rep.arrayBuffer());
    let type: string | null = null;
    if (octets[0] === 0xff && octets[1] === 0xd8) type = "image/jpeg";
    else if (octets[0] === 0x89 && octets[1] === 0x50) type = "image/png";
    if (!type) return null;
    return `data:${type};base64,${octets.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Coupe un texte trop long au dernier mot entier, avec une ellipse. */
export function tronquer(texte: string, max: number): string {
  const propre = texte.replace(/\s+/g, " ").trim();
  if (propre.length <= max) return propre;
  const coupe = propre.slice(0, max - 1);
  const dernierEspace = coupe.lastIndexOf(" ");
  return `${coupe.slice(0, dernierEspace > max * 0.6 ? dernierEspace : coupe.length).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** Pastille de texte (statut, groupe, procédure…). */
export function Pastille({
  children,
  couleur = COULEURS.texte,
  fond = COULEURS.fondDoux,
  point,
}: {
  children: React.ReactNode;
  couleur?: string;
  fond?: string;
  point?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 22px",
        borderRadius: 999,
        backgroundColor: fond,
        color: couleur,
        fontSize: 26,
        fontWeight: 500,
      }}
    >
      {point && (
        <div style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: point }} />
      )}
      {children}
    </div>
  );
}

type CarteProps = {
  /** Libellé en haut à droite (ex. « Dossier législatif »). */
  rubrique?: string;
  /** Couleur du liseré inférieur (couleur du groupe pour un député). */
  lisere?: string;
  children: React.ReactNode;
};

/** Mise en page commune : en-tête de marque, contenu, pied avec le domaine. */
function Carte({ rubrique, lisere = COULEURS.accent, logo, children }: CarteProps & { logo: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: COULEURS.fond,
        color: COULEURS.texte,
        fontFamily: "Raleway",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "48px 64px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={52} height={52} alt="" />
          <div style={{ fontSize: 32, fontWeight: 500, letterSpacing: 1 }}>NOS DÉPUTÉS</div>
        </div>
        {rubrique && (
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: COULEURS.secondaire,
            }}
          >
            {rubrique}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, padding: "0 64px", alignItems: "center" }}>
        {children}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 64px 36px",
          fontSize: 24,
          color: COULEURS.secondaire,
        }}
      >
        <div style={{ fontWeight: 700, color: COULEURS.texte }}>nosdeputes.fr</div>
        <div>Observatoire citoyen de l&apos;activité parlementaire</div>
      </div>
      <div style={{ display: "flex", height: 14, backgroundColor: lisere }} />
    </div>
  );
}

/** Rend une carte de partage au format PNG 1200×630. */
export async function imageDePartage(props: CarteProps): Promise<ImageResponse> {
  const { medium, bold, logo } = await chargerRessources();
  return new ImageResponse(<Carte {...props} logo={logo} />, {
    ...OG_SIZE,
    fonts: [
      { name: "Raleway", data: medium, weight: 500, style: "normal" },
      { name: "Raleway", data: bold, weight: 700, style: "normal" },
    ],
    // Par défaut, ImageResponse déclare l'image immuable pour un an. Le groupe
    // d'un député ou l'étape d'un dossier changent : une journée suffit.
    headers: { "cache-control": "public, max-age=86400, stale-while-revalidate=86400" },
  });
}

export const couleursOg = COULEURS;
