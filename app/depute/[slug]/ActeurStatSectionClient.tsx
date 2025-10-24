"use client";
import * as React from "react";
import { Metrique, Stats, StatsPeriode } from "@prisma/client";
import Select from "@mui/material/Select";
import {
  Box,
  Card,
  CardContent,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoDialogIcon from "@/components/InfoDialog/InfoDialogIcon";
import { infoDialogContents } from "@/components/contents";

const DEPUTE_STATS_METRICS = [
  "interventions",
  "presence-commission",
  "amendements",
  "documents-publies",
  "questions-ecrites",
  "questions-orales",
];
const periodes: StatsPeriode[] = [
  "LEGISLATURE",
  "LAST_YEAR",
  "LAST_SIX_MONTHS",
];

const quantilesSentences = [
  "Dans les 20% moins actifs",
  "Dans les 40% moins actifs",
  "Dans les 60% moins actifs",
  "Dans les 40% plus actifs",
  "Dans les 20% plus actifs",
];

const baselineTypeToInfo: Record<string, string> = {
  "questions-ecrites": "nb_questions_ecrite",
  "questions-orales": "nb_questions_orale",
  interventions: "presences",
  amendements: "nb_amendements",
  "presence-commission": "presences_commission",
  "documents-publies": "nb_amendements",
};

const MetriqueCard = (props: Stats & { valeurDepute: number }) => {
  const quantiles = [props.q20, props.q40, props.q60, props.q80, props.q100];

  const quantileIndex = Math.min(
    4,
    quantiles.findLastIndex((v) => props.valeurDepute > v) + 1
  );

  return (
    <Card key={props.id}>
      <CardContent>
        <Typography variant="h1" sx={{ textAlign: "right" }}>
          {props.valeurDepute}
        </Typography>
        <Typography variant="body1" sx={{ textAlign: "right" }}>
          {infoDialogContents.depute[baselineTypeToInfo[props.mesure]]
            ?.translation ?? props.mesure}
          <InfoDialogIcon
            category="depute"
            item={baselineTypeToInfo[props.mesure]}
          />
        </Typography>
        <Box
          sx={{
            width: "100%",
            height: 48,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 2,
          }}
        >
          {quantiles.map((q, index) => {
            return (
              <Tooltip
                key={index}
                title={`Entre ${index == 0 ? 0 : quantiles[index - 1]} et ${q}`}
              >
                <Box
                  sx={{
                    "&:hover": {
                      bgcolor: "#f3f3f3",

                      "&>div": {
                        bgColor: quantileIndex === index ? "black" : "#A4A4A7",
                      },
                    },
                    position: "relative",
                    flexGrow: 1,
                  }}
                >
                  <Box
                    sx={{
                      height: `${Math.max(
                        10,
                        Math.ceil((100 * q) / props.maximum)
                      )}%`,
                      width: "100%",
                      bgcolor: quantileIndex === index ? "black" : "#E4E4E7",
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                    }}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
        <Typography variant="caption">
          {quantilesSentences[quantileIndex]}
        </Typography>
      </CardContent>
    </Card>
  );
};

export function ActeurStatSectionClient({
  deputeMetriquesData,
  deputeStatsData,
}: {
  deputeMetriquesData: Metrique[];
  deputeStatsData: Stats[];
}) {
  const [periode, setPeriode] = React.useState<StatsPeriode>("LEGISLATURE");

  const metriquesValues = React.useMemo(() => {
    const rep: Record<StatsPeriode, Record<string, number>> = {
      LEGISLATURE: {},
      LAST_YEAR: {},
      LAST_SIX_MONTHS: {},
    };

    for (const metrique of deputeMetriquesData) {
      rep[metrique.periode][metrique.mesure] = metrique.valeur;
    }
    return rep;
  }, [deputeMetriquesData]);

  const statsWithMetrique = React.useMemo(() => {
    const metricToStats: Record<string, Stats & { valeurDepute: number }> = {};
    deputeStatsData
      ?.filter((item) => item.periode === periode)
      .forEach((item) => {
        metricToStats[item.mesure] = {
          ...item,
          valeurDepute: metriquesValues[item.periode][item.mesure] ?? 0,
        };
      });
    return DEPUTE_STATS_METRICS.map((mesure) => metricToStats[mesure]);
  }, [deputeStatsData, metriquesValues, periode]);

  return (
    <div>
      <Select
        value={periode}
        onChange={(event) => setPeriode(event.target.value)}
      >
        <MenuItem value="LEGISLATURE">Legislature</MenuItem>
        <MenuItem value="LAST_YEAR">Un an</MenuItem>
        <MenuItem value="LAST_SIX_MONTHS">Six mois</MenuItem>
      </Select>

      <div>
        {statsWithMetrique.map((item) => (
          <MetriqueCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}
