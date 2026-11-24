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
import Link from "next/link";
import { LIBELLES_TRANCHES } from "@/data/methodeStatistiques";
import { dateLongue } from "@/lib/periodesMandat";

const DEPUTE_STATS_METRICS = [
  "interventions",
  "presence-commission",
  "amendements",
  "documents-publies",
  "questions-ecrites",
  "questions-orales",
  "participation-votes-solennels",
];
/** Affichée à part : un écart à la médiane, pas un classement en tranches. */
const MESURE_DISSIDENCE = "dissidence-votes-solennels";
const periodes: PeriodeStatistique[] = [
  "LEGISLATURE",
  "LAST_YEAR",
  "LAST_SIX_MONTHS",
];

// Cinq tranches de 20 % des députés, de la moins active à la plus active
// (libellés et explication : data/methodeStatistiques, section « classement »).
const quantilesSentences = LIBELLES_TRANCHES;

const baselineTypeToInfo: Record<string, string> = {
  "questions-ecrites": "nb_questions_ecrite",
  "questions-orales": "nb_questions_orale",
  interventions: "presences",
  amendements: "nb_amendements",
  "presence-commission": "presences_commission",
  "documents-publies": "nb_documents_publie",
  "participation-votes-solennels": "participation_votes_solennels",
  [MESURE_DISSIDENCE]: "dissidence_votes",
};

/** « 96 % », « 1,3 % » ; un taux non défini s'affiche « — ». */
function formaterValeur(valeur: number | null, unite: string, decimales = 0): string {
  if (valeur == null) return "—";
  if (unite !== "pourcentage") return String(valeur);
  return `${valeur.toLocaleString("fr-FR", { maximumFractionDigits: decimales })}\u00a0%`;
}

type CarteMetrique = DistributionMesure & {
  valeurDepute: number | null;
  /** Prises de parole écartées parce que faites en présidant la séance. */
  interventionsPresidence?: number;
  /** Métrique complète du député : dénominateurs des taux. */
  metrique?: MetriqueActeur;
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

  const valeur = props.valeurDepute;
  // Taux non défini (aucun scrutin sur la période) : aucune tranche.
  const quantileIndex =
    valeur == null
      ? -1
      : Math.min(4, quantiles.findLastIndex((v) => valeur > v) + 1);
  const participation = props.mesure === "participation-votes-solennels" ? props.metrique : undefined;

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
          {participation?.scrutins ? (
            <Tooltip
              title={`${participation.votes ?? 0} scrutins solennels votés sur ${participation.scrutins}${
                participation.votesDelegation ? `, dont ${participation.votesDelegation} par délégation` : ""
              }`}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ cursor: "help", whiteSpace: "nowrap" }}
              >
                {participation.votes ?? 0}/{participation.scrutins}
              </Typography>
            </Tooltip>
          ) : null}
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
            {formaterValeur(valeur, props.unite)}
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
                title={`Entre ${formaterValeur(index == 0 ? 0 : quantiles[index - 1], props.unite)} et ${formaterValeur(q, props.unite)}`}
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
        <Stack direction="row" alignItems="center" spacing={0.25}>
          <Typography variant="caption">
            {quantileIndex < 0
              ? "Aucun scrutin solennel sur la période"
              : quantilesSentences[quantileIndex]}
          </Typography>
          <InfoDialogIcon category="depute" item="classement" sx={{ p: 0.25, fontSize: "0.85rem" }} />
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * Votes dissidents : part des votes du député, lors des scrutins solennels,
 * différents de la position la plus suivie dans son groupe. Rapprochée de la
 * médiane de l'Assemblée plutôt que classée en tranches : 4 députés sur 10
 * n'ont aucun vote dissident, des tranches n'auraient rien distingué.
 */
const DissidenceCard = ({
  distribution,
  dissidence,
  participation,
}: {
  distribution: DistributionMesure;
  dissidence?: MetriqueActeur;
  participation?: MetriqueActeur;
}) => {
  const libelle = useLibelleSurPlusieursLignes();
  const valeur = dissidence?.valeur ?? null;
  const mediane = distribution.mediane ?? 0;
  // Échelle de la jauge : assez large pour situer la médiane et le député,
  // arrondie aux 5 % supérieurs.
  const echelle = Math.min(
    100,
    Math.max(5, Math.ceil(Math.max(2 * distribution.q80, valeur ?? 0, mediane) / 5) * 5)
  );
  const position = (v: number) => `${Math.min(100, (100 * v) / echelle)}%`;

  let lecture: string;
  if (valeur == null) {
    lecture = participation?.votes
      ? "Non applicable : député non inscrit"
      : "Aucun vote solennel sur la période";
  } else if (valeur > mediane) {
    lecture = `Au-dessus de la médiane de l’Assemblée (${formaterValeur(mediane, "pourcentage", 1)})`;
  } else if (valeur < mediane) {
    lecture = `En dessous de la médiane de l’Assemblée (${formaterValeur(mediane, "pourcentage", 1)})`;
  } else {
    lecture = `Égal à la médiane de l’Assemblée (${formaterValeur(mediane, "pourcentage", 1)})`;
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "#e0e0e0", boxShadow: "none" }}>
      <CardContent>
        <Stack direction="row" alignItems="baseline" justifyContent="flex-end" spacing={1}>
          {dissidence?.votesExprimes ? (
            <Tooltip
              title={`${dissidence.votesDissidents ?? 0} vote${(dissidence.votesDissidents ?? 0) > 1 ? "s" : ""} sur ${dissidence.votesExprimes} différent${(dissidence.votesDissidents ?? 0) > 1 ? "s" : ""} de la majorité de son groupe`}
            >
              <Typography variant="caption" color="text.secondary" sx={{ cursor: "help", whiteSpace: "nowrap" }}>
                {dissidence.votesDissidents ?? 0}/{dissidence.votesExprimes}
              </Typography>
            </Tooltip>
          ) : null}
          <Typography variant="h1" fontWeight="medium" sx={{ textAlign: "right", lineHeight: 1, mb: 0 }}>
            {formaterValeur(valeur, "pourcentage", 1)}
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
            <InfoDialogIcon category="depute" item="dissidence_votes" />
          </Box>
          <Typography ref={libelle.ref} variant="caption" sx={{ textAlign: "right", lineHeight: "1rem" }}>
            {infoDialogContents.depute.dissidence_votes?.translation}
          </Typography>
        </Stack>
        {/* Même hauteur que les barres des autres cartes, pour aligner la grille. */}
        <Box sx={{ height: 48, mb: 0.5, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <Box sx={{ position: "relative", height: 12, borderRadius: 1, bgcolor: "#E4E4E7" }}>
            {valeur != null ? (
              <Tooltip title={`Ce député : ${formaterValeur(valeur, "pourcentage", 1)}`}>
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: position(valeur),
                    minWidth: valeur > 0 ? 4 : 0,
                    bgcolor: "black",
                    borderRadius: 1,
                  }}
                />
              </Tooltip>
            ) : null}
            <Tooltip title={`Médiane de l’Assemblée : ${formaterValeur(mediane, "pourcentage", 1)}`}>
              <Box
                sx={{
                  position: "absolute",
                  left: position(mediane),
                  top: -6,
                  bottom: -6,
                  width: 2,
                  ml: "-1px",
                  bgcolor: "#868E96",
                  cursor: "help",
                }}
              />
            </Tooltip>
          </Box>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              0 %
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
              {echelle} %
            </Typography>
          </Stack>
        </Box>
        <Typography variant="caption">{lecture}</Typography>
      </CardContent>
    </Card>
  );
};

export function ActeurStatSectionClient({
  metriques,
  distributions,
  fonctionPresidence,
  dateCalcul,
}: {
  metriques: MetriqueActeur[];
  distributions: DistributionMesure[];
  fonctionPresidence?: string | null;
  /** Date ISO du dernier calcul des statistiques. */
  dateCalcul?: string | null;
}) {
  const [periode, setPeriode] = React.useState<PeriodeStatistique>("LAST_YEAR");

  const metriquesValues = React.useMemo(() => {
    const rep: Record<PeriodeStatistique, Record<string, MetriqueActeur>> = {
      LEGISLATURE: {},
      LAST_YEAR: {},
      LAST_SIX_MONTHS: {},
      MANDAT: {},
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
          valeurDepute:
            item.unite === "pourcentage"
              ? metriquesValues[item.periode][item.mesure]?.valeur ?? null
              : metriquesValues[item.periode][item.mesure]?.valeur ?? 0,
          interventionsPresidence:
            metriquesValues[item.periode][item.mesure]?.interventionsPresidence,
          metrique: metriquesValues[item.periode][item.mesure],
        };
      });
    return DEPUTE_STATS_METRICS.map((mesure) => metricToStats[mesure]).filter(
      (value) => value != null
    );
  }, [distributions, metriquesValues, periode]);

  const distributionDissidence = distributions.find(
    (item) => item.periode === periode && item.mesure === MESURE_DISSIDENCE
  );

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

      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: -2 }}>
        {dateCalcul
          ? `Calculé le ${new Date(dateCalcul).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })} à partir des données de l’Assemblée nationale · `
          : "Calculé chaque nuit à partir des données de l’Assemblée nationale · "}
        <Box component={Link} href="/methodologie#statistiques" sx={{ color: "inherit", textDecoration: "underline" }}>
          Méthodologie
        </Box>
      </Typography>
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
        {distributionDissidence ? (
          <DissidenceCard
            distribution={distributionDissidence}
            dissidence={metriquesValues[periode][MESURE_DISSIDENCE]}
            participation={metriquesValues[periode]["participation-votes-solennels"]}
          />
        ) : null}
      </Box>
    </div>
  );
}

/**
 * Carte d'un député dont le mandat est achevé : son total sur la durée du
 * mandat, sans barres de classement. Le comparer aux députés en exercice,
 * dont le mandat court encore et dure plus longtemps, n'aurait pas de sens.
 */
const CarteMandat = ({ mesure, metrique }: { mesure: string; metrique?: MetriqueActeur }) => {
  const libelle = useLibelleSurPlusieursLignes();
  const info = baselineTypeToInfo[mesure];
  const pourcentage = metrique?.unite === "pourcentage";
  const valeur = metrique?.valeur ?? (pourcentage ? null : 0);

  let complement: { court: string; long: string } | null = null;
  if (mesure === "participation-votes-solennels" && metrique?.scrutins) {
    complement = {
      court: `${metrique.votes ?? 0}/${metrique.scrutins}`,
      long: `${metrique.votes ?? 0} scrutins solennels votés sur ${metrique.scrutins}${
        metrique.votesDelegation ? `, dont ${metrique.votesDelegation} par délégation` : ""
      }`,
    };
  } else if (mesure === MESURE_DISSIDENCE && metrique?.votesExprimes) {
    const n = metrique.votesDissidents ?? 0;
    complement = {
      court: `${n}/${metrique.votesExprimes}`,
      long: `${n} vote${n > 1 ? "s" : ""} sur ${metrique.votesExprimes} différent${n > 1 ? "s" : ""} de la majorité de son groupe`,
    };
  } else if (metrique?.interventionsPresidence) {
    complement = {
      court: `+${metrique.interventionsPresidence}`,
      long: "Interventions faites en présidant les débats",
    };
  }

  let precision: string | null = null;
  if (valeur == null) {
    precision =
      mesure === MESURE_DISSIDENCE
        ? "Non applicable : non inscrit, ou aucun vote solennel"
        : "Aucun scrutin solennel pendant son mandat";
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, borderColor: "#e0e0e0", boxShadow: "none" }}>
      <CardContent>
        <Stack direction="row" alignItems="baseline" justifyContent="flex-end" spacing={1}>
          {complement ? (
            <Tooltip title={complement.long}>
              <Typography variant="caption" color="text.secondary" sx={{ cursor: "help", whiteSpace: "nowrap" }}>
                {complement.court}
              </Typography>
            </Tooltip>
          ) : null}
          <Typography variant="h1" fontWeight="medium" sx={{ textAlign: "right", lineHeight: 1, mb: 0 }}>
            {formaterValeur(valeur, metrique?.unite ?? "", mesure === MESURE_DISSIDENCE ? 1 : 0)}
          </Typography>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="flex-end"
          sx={{ pt: libelle.surPlusieursLignes ? 0.5 : 0 }}
        >
          <Box sx={{ display: "flex", flexShrink: 0 }}>
            <InfoDialogIcon category="depute" item={info} />
          </Box>
          <Typography ref={libelle.ref} variant="caption" sx={{ textAlign: "right", lineHeight: "1rem" }}>
            {infoDialogContents.depute[info]?.translation ?? mesure}
          </Typography>
        </Stack>
        {precision ? (
          <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1, textAlign: "right" }}>
            {precision}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

/** Statistiques d'un député dont le mandat est achevé : totaux sur son mandat. */
export function ActeurStatMandatClient({
  metriques,
  mandat,
  motifFin,
  dateCalcul,
}: {
  /** Métriques de la période « MANDAT ». */
  metriques: MetriqueActeur[];
  mandat: { debut: string | null; fin: string | null };
  /** Mandat interrompu par l'entrée au Gouvernement. */
  motifFin?: "gouvernement";
  dateCalcul?: string | null;
}) {
  const parMesure = Object.fromEntries(metriques.map((metrique) => [metrique.mesure, metrique]));
  const periode =
    mandat.debut && mandat.fin
      ? `du ${dateLongue(mandat.debut)} au ${dateLongue(mandat.fin)}`
      : mandat.fin
        ? `jusqu’au ${dateLongue(mandat.fin)}`
        : null;

  return (
    <div>
      <Box sx={{ mb: 3, mt: 5 }}>
        <Typography variant="subtitle1" fontWeight="bold" component="h2">
          Statistiques d&apos;activité sur l&apos;ensemble du mandat
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: -2 }}>
        {motifFin === "gouvernement"
          ? `Mandat de député interrompu par l’entrée au Gouvernement${periode ? `, ${periode}` : ""}. `
          : periode
            ? `Mandat achevé, ${periode}. `
            : "Mandat achevé. "}
        Pas de comparaison avec les députés en exercice : leur mandat se poursuit.
        {dateCalcul
          ? ` Calculé le ${new Date(dateCalcul).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" })} · `
          : " · "}
        <Box component={Link} href="/methodologie#classement" sx={{ color: "inherit", textDecoration: "underline" }}>
          Méthodologie
        </Box>
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          mt: 2,
        }}
      >
        {[...DEPUTE_STATS_METRICS, MESURE_DISSIDENCE].map((mesure) => (
          <CarteMandat key={mesure} mesure={mesure} metrique={parMesure[mesure]} />
        ))}
      </Box>
    </div>
  );
}
