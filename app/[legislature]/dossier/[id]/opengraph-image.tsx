import * as React from "react";
import { getDossier } from "@/data/getDossier";
import { couleursOg, imageDePartage, Pastille, tronquer, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import ImageParDefaut from "@/app/opengraph-image";
import { getCurrentStatus, statusInfo } from "./dataFunctions";

export const alt = "Dossier législatif suivi sur NosDéputés.fr";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Couleurs des statuts alignées sur StatusChip (palette du thème MUI).
const COULEURS_STATUT = {
  validated: { couleur: "#1F8E2C", fond: "#E6F4E8" },
  review: { couleur: "#006C93", fond: "#E0F0F6" },
  refused: { couleur: "#B45309", fond: "#FEF3C7" },
  dropped: { couleur: "#343A40", fond: "#F1F3F5" },
  error: { couleur: "#B91C1C", fond: "#FDE8E8" },
} as const;

export default async function Image({
  params,
}: {
  params: Promise<{ legislature: string; id: string }>;
}) {
  const { legislature, id } = await params;
  const dossier = await getDossier(id);
  if (dossier == null) return ImageParDefaut();

  const titre = tronquer(dossier.titre?.trim() || "Dossier législatif", 170);
  const taille = titre.length > 120 ? 46 : titre.length > 70 ? 54 : 64;
  const code = getCurrentStatus(dossier.actesLegislatifs ?? []);
  const statut = code ? statusInfo[code] : undefined;
  const dateDepot = dossier.dateDepot
    ? new Date(dossier.dateDepot).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Paris",
      })
    : null;

  return imageDePartage({
    rubrique: dossier.libelleProcedure?.trim() || "Dossier législatif",
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>
        <div style={{ fontSize: taille, fontWeight: 700, lineHeight: 1.15 }}>{titre}</div>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
          {statut && (
            <Pastille point={COULEURS_STATUT[statut.status].couleur} {...COULEURS_STATUT[statut.status]}>
              {statut.label}
            </Pastille>
          )}
          {dossier.procedureAcceleree && <Pastille>Procédure accélérée</Pastille>}
          <div style={{ display: "flex", fontSize: 26, color: couleursOg.secondaire, marginLeft: 8 }}>
            {[`${legislature}e législature`, dateDepot && `déposé le ${dateDepot}`]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>
      </div>
    ),
  });
}
