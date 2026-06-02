import React from "react";
import Link from "next/link";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DossierBadge from "@/components/folders/DossierBadge";
import { THEMES, isThemeSlug } from "@/data/themes";
import { THEME_ICONS } from "@/app/themes/themeIcons";

const MAX_THEMES = 3;

type DossierCardProps = {
  href: string;
  titre: string | null;
  typeLabel: string | null;
  badge: string | null;
  tldr: string | null;
  themes: string[];
};

const DossierCard = ({ href, titre, typeLabel, badge, tldr, themes }: DossierCardProps) => {
  const visibleThemes = themes.slice(0, MAX_THEMES);

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        height: "100%",
        transition: "box-shadow 0.3s",
        "&:hover": { boxShadow: "0px 4px 20px rgba(0,0,0,0.08)" },
      }}
    >
      <CardActionArea
        component={Link}
        href={href}
        sx={{
          p: 2.5,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 1.5,
        }}
      >
        {/* Ligne haute : badge gauche, type droit */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
          <DossierBadge badge={badge} />
          {typeLabel && (
            <Chip
              label={typeLabel}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.68rem",
                height: 22,
                borderColor: "grey.300",
                color: "text.secondary",
                maxWidth: 180,
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              }}
            />
          )}
        </Stack>

        {/* Titre */}
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {titre}
        </Typography>

        {/* TLDR */}
        {tldr && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontStyle: "italic",
              lineHeight: 1.55,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {tldr}
          </Typography>
        )}

        {/* Thèmes */}
        {visibleThemes.length > 0 && (
          <Stack direction="row" gap={0.75} sx={{ flexWrap: "nowrap", minWidth: 0, width: "100%", mt: "auto" }}>
            {visibleThemes.map((slug) => {
              const isValid = isThemeSlug(slug);
              const Icon = isValid ? THEME_ICONS[slug] : null;
              return (
                <Chip
                  key={slug}
                  label={isValid ? THEMES[slug].label : slug}
                  size="small"
                  variant="outlined"
                  icon={Icon ? <Icon style={{ fontSize: 13 }} /> : undefined}
                  sx={{
                    fontSize: "0.75rem",
                    height: 26,
                    borderColor: "grey.300",
                    color: "text.secondary",
                    pointerEvents: "none",
                    flexShrink: 1,
                    minWidth: 0,
                    "& .MuiChip-icon": { color: "primary.main", ml: 0.75 },
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              );
            })}
          </Stack>
        )}
      </CardActionArea>
    </Card>
  );
};

export default DossierCard;
