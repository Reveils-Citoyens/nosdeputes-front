import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  THEME_GROUPS,
  type ThemeGroupSlug,
} from "@/data/themeGroups";
import { getThemeGroupCounts } from "@/data/mongo/getThemeGroupCounts";
import { ThemeGroupIcon } from "@/app/themes/themeIcons";

const HOME_LIMIT = 6;

export default async function Themes() {
  const counts = await getThemeGroupCounts();

  const groups = (Object.entries(THEME_GROUPS) as [
    ThemeGroupSlug,
    (typeof THEME_GROUPS)[ThemeGroupSlug],
  ][])
    .map(([slug, meta]) => ({ slug, ...meta, count: counts[slug] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, HOME_LIMIT);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "1fr 1fr",
          md: "repeat(3, 1fr)",
        },
        gap: 2,
      }}
    >
      {groups.map((group) => (
        <Link
          key={group.slug}
          href={`/themes/domaine/${group.slug}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "grey.200",
              bgcolor: "background.paper",
              transition: "border-color 0.15s, box-shadow 0.15s",
              "&:hover": {
                borderColor: "primary.main",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              },
            }}
          >
            <ThemeGroupIcon slug={group.slug} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ lineHeight: 1.3, mb: 0.25 }}
              >
                {group.label}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {group.count} dossier{group.count > 1 ? "s" : ""}
              </Typography>
            </Box>
            <ChevronRightIcon
              sx={{ color: "grey.400", fontSize: 20, flexShrink: 0 }}
            />
          </Box>
        </Link>
      ))}
    </Box>
  );
}
