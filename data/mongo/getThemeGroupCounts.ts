import { getThemeCounts } from "./getThemeCounts";
import {
  THEME_GROUPS,
  type ThemeGroupSlug,
} from "@/data/themeGroups";

export async function getThemeGroupCounts(): Promise<
  Record<ThemeGroupSlug, number>
> {
  const themeCounts = await getThemeCounts();
  const entries = Object.entries(THEME_GROUPS) as [
    ThemeGroupSlug,
    (typeof THEME_GROUPS)[ThemeGroupSlug],
  ][];

  return Object.fromEntries(
    entries.map(([slug, group]) => [
      slug,
      group.themes.reduce((acc, t) => acc + (themeCounts[t] ?? 0), 0),
    ])
  ) as Record<ThemeGroupSlug, number>;
}
