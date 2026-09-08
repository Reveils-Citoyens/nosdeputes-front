"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import InfoDialogIcon from "@/components/InfoDialog/InfoDialogIcon";
import WeeklyActivityChart, {
  SEGMENTS,
  type VarianteActivite,
} from "./WeeklyActivityChart";
import {
  FENETRES,
  useAgregateWeeklyStats,
  type FenetreActivite,
} from "./useAgregateWeeklyStats";
import type { StatistiqueHebdomadaire } from "@/data/mongo/getStatistiquesHebdomadaires";

/**
 * Deux bandes plutôt qu'un menu déroulant par indicateur : voir les deux en même
 * temps est ce qui permet de comprendre un député actif en commission et discret
 * en séance.
 *
 * Tout le texte explicatif vit dans le (i), comme pour les cartes de
 * statistiques. Seule reste à l'écran la légende, qui n'est pas du commentaire
 * mais la clé de lecture : le gris ne veut pas dire la même chose dans les deux
 * bandes — une absence constatée en commission, une présence inconnue en séance.
 */
const BANDES: { variante: VarianteActivite; titre: string; info: string }[] = [
  {
    variante: "hemicycle",
    titre: "Séance publique",
    info: "activite_seance_publique",
  },
  {
    variante: "commission",
    titre: "Commissions",
    info: "activite_commission",
  },
];

const FENETRES_ORDONNEES = Object.keys(FENETRES) as FenetreActivite[];

export default function WeeklyActivitySectionClient(props: {
  acteurUid: string;
  statistiques: StatistiqueHebdomadaire[];
}) {
  const [fenetre, setFenetre] = React.useState<FenetreActivite>("LAST_YEAR");
  const { dataset } = useAgregateWeeklyStats(props, fenetre);

  return (
    <Box sx={{ mt: 1 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.5 }}
      >
        <Typography variant="subtitle1" fontWeight="bold" component="h2">
          Activité hebdomadaire
        </Typography>
        <Select
          value={fenetre}
          onChange={(event) => setFenetre(event.target.value as FenetreActivite)}
          disableUnderline
          variant="standard"
          sx={{
            minWidth: 180,
            backgroundColor: "white",
            borderRadius: "50px",
            fontSize: "0.9rem",
            color: "#666",
            "& .MuiSelect-select": {
              py: 1,
              px: 2,
              backgroundColor: "transparent !important",
            },
            "& .MuiSvgIcon-root": { right: "12px", color: "#888" },
          }}
        >
          {FENETRES_ORDONNEES.map((clef) => (
            <MenuItem key={clef} value={clef}>
              {FENETRES[clef].label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack spacing={1.5}>
        {BANDES.map((bande) => (
          <Box key={bande.variante}>
            <Stack
              direction="row"
              alignItems="center"
              flexWrap="wrap"
              sx={{ columnGap: 1.5, rowGap: 0.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={0.25}>
                <Typography variant="body2" fontWeight={600}>
                  {bande.titre}
                </Typography>
                <InfoDialogIcon category="depute" item={bande.info} />
              </Stack>

              {SEGMENTS[bande.variante].map((segment) => (
                <Stack
                  key={segment.clef}
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "2px",
                      bgcolor: segment.couleur,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {segment.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <WeeklyActivityChart dataset={dataset} variante={bande.variante} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
