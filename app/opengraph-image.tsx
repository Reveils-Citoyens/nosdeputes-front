import * as React from "react";
import { imageDePartage, couleursOg, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";

// Image de partage par défaut, héritée par toutes les pages qui n'en ont pas
// de dédiée. Sans donnée : générée une fois au build.
export const alt = "NosDéputés.fr, observatoire citoyen de l'activité parlementaire";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return imageDePartage({
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
          Ce que font vos députés à l&apos;Assemblée nationale
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: couleursOg.secondaire, maxWidth: 980, lineHeight: 1.35 }}>
          Votes, amendements, interventions et présence en commission des 577 députés.
        </div>
      </div>
    ),
  });
}
