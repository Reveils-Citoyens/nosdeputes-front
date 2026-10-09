import * as React from "react";
import { THEMES, isThemeSlug } from "@/data/themes";
import { THEME_GROUPS, THEME_TO_GROUP } from "@/data/themeGroups";
import { couleursOg, imageDePartage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import ImageParDefaut from "@/app/opengraph-image";

export const alt = "Thème suivi sur NosDéputés.fr";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isThemeSlug(slug)) return ImageParDefaut();

  const theme = THEMES[slug];
  const groupe = THEME_GROUPS[THEME_TO_GROUP[slug]].label;

  return imageDePartage({
    rubrique: `Thème · ${groupe}`,
    children: (
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ fontSize: 80, fontWeight: 700, lineHeight: 1.1 }}>{theme.label}</div>
        <div style={{ fontSize: 34, fontWeight: 500, color: couleursOg.secondaire, maxWidth: 1000, lineHeight: 1.35 }}>
          {theme.description}
        </div>
        <div style={{ fontSize: 28, fontWeight: 500, color: couleursOg.accent }}>
          Les textes examinés à l&apos;Assemblée nationale sur ce thème
        </div>
      </div>
    ),
  });
}
