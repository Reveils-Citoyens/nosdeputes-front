"use client";
import * as React from "react";
import {
  BarPlot,
  ChartsAxis,
  ChartsAxisHighlight,
  BarSeriesType,
  ChartsTooltipContainer,
  ChartDataProvider,
  ChartsSurface,
  useAxesTooltip,
} from "@mui/x-charts";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SemaineActivite } from "./useAgregateWeeklyStats";

/**
 * Une bande du graphe d'activité. La barre entière représente ce qu'il y avait
 * à faire cette semaine-là ; elle se répartit entre ce que le député a fait et
 * ce qu'il n'a pas fait.
 *
 * Les deux bandes n'ont volontairement ni la même légende ni le même
 * vocabulaire : en commission le complément est une absence constatée, en
 * séance publique c'est une incertitude. Les confondre serait accuser à tort.
 */
export type VarianteActivite = "hemicycle" | "commission";

// Noir plutôt que la couleur du groupe parlementaire : quatre des douze
// couleurs de groupe (Horizons, LIOT, SOC, DR) ne se distinguent pas des gris
// de la pile — un député Horizons verrait ses présences se confondre avec ses
// absences. Le noir sépare de 15:1 au lieu de 1,1:1, et il évite d'installer
// une lecture politique sur un graphe d'activité. La couleur du groupe reste
// portée par le badge en haut de la fiche.
// Ces trois valeurs sont celles déjà utilisées par les cartes de statistiques.
const PRESENT = "black";
const EXCUSE = "#A4A4A7";
const INCONNU = "#E4E4E7";

type Segment = { clef: keyof SemaineActivite; label: string; couleur: string };

const SEGMENTS: Record<VarianteActivite, Segment[]> = {
  hemicycle: [
    { clef: "seancePriseParole", label: "A pris la parole", couleur: PRESENT },
    { clef: "seanceSansParole", label: "Séance sans prise de parole", couleur: INCONNU },
  ],
  commission: [
    { clef: "commissionPresent", label: "Présent", couleur: PRESENT },
    { clef: "commissionExcuse", label: "Excusé", couleur: EXCUSE },
    { clef: "commissionAbsent", label: "Absent", couleur: INCONNU },
  ],
};

export default function WeeklyActivityChart(props: {
  dataset: SemaineActivite[];
  variante: VarianteActivite;
}) {
  const segments = SEGMENTS[props.variante];

  const series: BarSeriesType[] = segments.map((segment) => ({
    id: segment.clef,
    dataKey: segment.clef,
    type: "bar",
    // Une seule pile : la barre entière vaut le total de ce qui était possible.
    stack: "semaine",
    color: segment.couleur,
    label: segment.label,
  }));

  return (
    <ChartDataProvider
      height={168}
      dataset={props.dataset as unknown as Record<string, number | Date>[]}
      xAxis={[
        {
          scaleType: "band",
          dataKey: "date",
          valueFormatter: (date, ctx) =>
            ctx.location === "tick"
              ? (date as Date).toLocaleDateString("fr-FR", {
                  month: "long",
                  year: "2-digit",
                })
              : `Semaine du ${(date as Date).toLocaleDateString("fr-FR", {
                  month: "short",
                  day: "2-digit",
                })}`,
          tickInterval: (_, index) => index % 12 === 6,
          categoryGapRatio: 0.25,
        },
      ]}
      yAxis={[{ width: 24 }]}
      margin={{ left: 0, right: 0, top: 6, bottom: 0 }}
      series={series}
    >
      <Box sx={{ width: "100%" }}>
        <ChartsSurface>
          <BarPlot borderRadius={2} />
          <ChartsAxis />
          <ChartsAxisHighlight x="band" />
        </ChartsSurface>
        <ChartsTooltipContainer trigger="axis">
          <TooltipContent dataset={props.dataset} variante={props.variante} />
        </ChartsTooltipContainer>
      </Box>
    </ChartDataProvider>
  );
}

function TooltipContent(props: {
  dataset: SemaineActivite[];
  variante: VarianteActivite;
}) {
  const tooltipData = useAxesTooltip()?.[0];
  if (tooltipData == null) return null;

  const semaine = props.dataset[tooltipData.dataIndex];
  if (semaine == null) return null;

  const hemicycle = props.variante === "hemicycle";
  const total = hemicycle ? semaine.seances : semaine.convocations;
  const fait = hemicycle ? semaine.seancePriseParole : semaine.commissionPresent;

  return (
    <Paper sx={{ py: 1, px: 2 }}>
      <Typography variant="body2">{tooltipData.axisFormattedValue}</Typography>
      {total === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {hemicycle
            ? "Pas de séance publique cette semaine"
            : "Aucune réunion de commission"}
        </Typography>
      ) : (
        <Box sx={{ mt: 0.5 }}>
          <Typography>
            <strong>{fait}</strong>
            {hemicycle
              ? ` jour${fait > 1 ? "s" : ""} de prise de parole sur ${total} de séance`
              : ` présence${fait > 1 ? "s" : ""} sur ${total} convocation${
                  total > 1 ? "s" : ""
                }`}
          </Typography>
          {SEGMENTS[props.variante].slice(1).map((segment) => {
            const valeur = semaine[segment.clef] as number;
            if (!valeur) return null;
            return (
              <Stack
                key={segment.clef}
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mt: 0.5 }}
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
                <Typography variant="body2" color="text.secondary">
                  {valeur} {segment.label.toLowerCase()}
                </Typography>
              </Stack>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

export { SEGMENTS };
