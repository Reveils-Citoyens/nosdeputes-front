"use client";
import * as React from "react";
import type {
  DistributionMesure,
  MetriqueActeur,
  PeriodeStatistique,
} from "@/data/mongo/getStatistiquesMetriques";
import Select from "@mui/material/Select";
import {
  Box,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
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
const periodes: PeriodeStatistique[] = [
  "LEGISLATURE",
  "LAST_YEAR",
  "LAST_SIX_MONTHS",
];

const quantilesSentences = [
  "Dans les 20% les moins actifs",
  "Dans les 40% les moins actifs",
  "Dans les 60% les plus actifs",
  "Dans les 40% les plus actifs",
  "Dans les 20% les plus actifs",
];

const baselineTypeToInfo: Record<string, string> = {
  "questions-ecrites": "nb_questions_ecrite",
  "questions-orales": "nb_questions_orale",
  interventions: "presences",
  amendements: "nb_amendements",
  "presence-commission": "presences_commission",
  "documents-publies": "nb_documents_publie",
};

type CarteMetrique = DistributionMesure & {
  valeurDepute: number;
  /** Prises de parole écartées parce que faites en présidant la séance. */
  interventionsPresidence?: number;
};

/**
 * Indique si le libellé occupe plus d'une ligne.
 *
 * Le retour à la ligne dépend de la largeur de la carte, donc de la grille
 * responsive : aucun sélecteur CSS ne permet de le cibler, il faut le mesurer.
 * Un libellé sur deux lignes remonte vers le nombre et s'y colle — c'est ce que
 * l'espacement conditionnel vient corriger.
 */
function useLibelleSurPlusieursLignes() {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [surPlusieursLignes, setSurPlusieursLignes] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const mesurer = () => {
      const hauteurLigne = parseFloat(
        window.getComputedStyle(element).lineHeight
      );
      if (!Number.isFinite(hauteurLigne)) return;
      setSurPlusieursLignes(element.offsetHeight > hauteurLigne * 1.5);
    };

    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(element);
    return () => observateur.disconnect();
  }, []);

  return { ref, surPlusieursLignes };
}

const MetriqueCard = (props: CarteMetrique) => {
  const quantiles = [props.q20, props.q40, props.q60, props.q80, props.q100];
  const libelle = useLibelleSurPlusieursLignes();

  const quantileIndex = Math.min(
    4,
    quantiles.findLastIndex((v) => props.valeurDepute > v) + 1
  );

  return (
    <Card
      key={props.mesure}
      variant="outlined"
      sx={{ borderRadius: 3, borderColor: "#e0e0e0", boxShadow: "none" }}
    >
      <CardContent>
        <Stack
          direction="row"
          alignItems="baseline"
          justifyContent="flex-end"
          spacing={1}
        >
          {props.interventionsPresidence ? (
            // Sur la même ligne que le nombre : placé en dessous, ce complément
            // décalait le libellé et désalignait la grille de cartes.
            <Tooltip title="Interventions faites en présidant les débats">
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: "help", whiteSpace: "nowrap" }}
              >
                +{props.interventionsPresidence}
              </Typography>
            </Tooltip>
          ) : null}
          <Typography
            variant="h1"
            fontWeight="medium"
            sx={{ textAlign: "right", lineHeight: 1, mb: 0 }}
          >
            {props.valeurDepute}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="flex-end"
          sx={{ mb: 1.5, pt: libelle.surPlusieursLignes ? 0.5 : 0 }}
        >
          <Box sx={{ display: "flex", flexShrink: 0 }}>
            <InfoDialogIcon
              category="depute"
              item={baselineTypeToInfo[props.mesure]}
            />
          </Box>
          <Typography
            ref={libelle.ref}
            variant="caption"
            sx={{ textAlign: "right", lineHeight: "1rem" }}
          >
            {infoDialogContents.depute[baselineTypeToInfo[props.mesure]]
              ?.translation ?? props.mesure}
          </Typography>
        </Stack>
        <Box
          sx={{
            width: "100%",
            height: 48,
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: 1,
            mb: 0.5,
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
                      borderRadius: 1,
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
  metriques,
  distributions,
  fonctionPresidence,
}: {
  metriques: MetriqueActeur[];
  distributions: DistributionMesure[];
  fonctionPresidence?: string | null;
}) {
  const [periode, setPeriode] = React.useState<PeriodeStatistique>("LAST_YEAR");

  const metriquesValues = React.useMemo(() => {
    const rep: Record<PeriodeStatistique, Record<string, MetriqueActeur>> = {
      LEGISLATURE: {},
      LAST_YEAR: {},
      LAST_SIX_MONTHS: {},
    };

    for (const metrique of metriques) {
      rep[metrique.periode][metrique.mesure] = metrique;
    }
    return rep;
  }, [metriques]);

  const statsWithMetrique = React.useMemo(() => {
    const metricToStats: Record<string, CarteMetrique> = {};
    distributions
      ?.filter((item) => item.periode === periode)
      ?.forEach((item) => {
        metricToStats[item.mesure] = {
          ...item,
          valeurDepute: metriquesValues[item.periode][item.mesure]?.valeur ?? 0,
          interventionsPresidence:
            metriquesValues[item.periode][item.mesure]?.interventionsPresidence,
        };
      });
    return DEPUTE_STATS_METRICS.map((mesure) => metricToStats[mesure]).filter(
      (value) => value != null
    );
  }, [distributions, metriquesValues, periode]);

  return (
    <div>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          mb: 3,
          mt: 5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Typography variant="subtitle1" fontWeight={"bold"} component="h2">
            Statistiques d&apos;activité
          </Typography>
          {fonctionPresidence ? (
            // Nommer la fonction plutôt que laisser un compteur d'interventions
            // à zéro parler à sa place.
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <Chip
                size="small"
                label={fonctionPresidence}
                sx={{ height: 22, fontSize: "0.75rem" }}
              />
              <InfoDialogIcon
                category="depute"
                item="interventions_presidence"
                sx={{ p: 0.25 }}
              />
            </Stack>
          ) : null}
        </Stack>
        <Select
          value={periode}
          onChange={(event) =>
            setPeriode(event.target.value as PeriodeStatistique)
          }
          disableUnderline
          variant="standard"
          sx={{
            minWidth: 180,
            backgroundColor: "white",
            borderRadius: "50px",
            fontSize: "0.9rem",
            color: "#666",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#e0e0e0",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#ccc",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#aaa",
              borderWidth: "1px",
            },
            "& .MuiSelect-select": {
              py: 1,
              px: 2,
              backgroundColor: "transparent !important",
            },
            "& .MuiSvgIcon-root": {
              right: "12px",
              color: "#888",
            },
          }}
        >
          <MenuItem value="LEGISLATURE">Toute la législature</MenuItem>
          <MenuItem value="LAST_YEAR">12 derniers mois</MenuItem>
          <MenuItem value="LAST_SIX_MONTHS">6 derniers mois</MenuItem>
        </Select>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          mt: 2,
        }}
      >
        {statsWithMetrique.map((item) => (
          <MetriqueCard key={item.mesure} {...item} />
        ))}
      </Box>
    </div>
  );
}
