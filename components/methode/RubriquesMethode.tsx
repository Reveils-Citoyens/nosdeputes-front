import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { remplir, type Rubrique, type ValeursMethode } from "@/data/methodeStatistiques";

/**
 * Affiche des rubriques d'explication (« Ce qui est compté », « Limites »…),
 * valeurs remplacées. Commun aux fenêtres « ⓘ » et à /methodologie.
 */
export default function RubriquesMethode({
  rubriques,
  valeurs,
  niveauTitre = "h3",
}: {
  rubriques: Rubrique[];
  valeurs: ValeursMethode;
  niveauTitre?: "h3" | "h4";
}) {
  return (
    <>
      {rubriques.map((rubrique) => {
        const paragraphes = (rubrique.paragraphes ?? [])
          .map((p) => remplir(p, valeurs))
          .filter((p): p is string => p !== null);
        const liste = (rubrique.liste ?? [])
          .map((p) => remplir(p, valeurs))
          .filter((p): p is string => p !== null);
        if (paragraphes.length === 0 && liste.length === 0) return null;
        return (
          <Box key={rubrique.titre} sx={{ mb: 2.5 }}>
            <Typography
              component={niveauTitre}
              variant="subtitle2"
              sx={{ fontWeight: 700, mb: 0.75, color: "text.primary" }}
            >
              {rubrique.titre}
            </Typography>
            {paragraphes.map((p, i) => (
              <Typography key={i} variant="body2" color="text.secondary" sx={{ lineHeight: 1.65, mb: 1 }}>
                {p}
              </Typography>
            ))}
            {liste.length > 0 && (
              // Puces explicites : la base Tailwind (preflight) les retire de
              // toutes les listes, ne laissant qu'un retrait inexpliqué.
              <Box component="ul" sx={{ m: 0, pl: 2.5, listStyleType: "disc", "& li::marker": { color: "text.disabled" } }}>
                {liste.map((p, i) => (
                  <Typography
                    key={i}
                    component="li"
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.65, mb: 0.75 }}
                  >
                    {p}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </>
  );
}
