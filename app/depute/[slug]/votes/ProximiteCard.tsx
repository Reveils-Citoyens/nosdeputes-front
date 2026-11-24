"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Link from "@/components/navigation/NavigationLink";
import InfoDialogIcon from "@/components/InfoDialog/InfoDialogIcon";
import { GLOSSAIRE } from "@/data/glossaire";
import type { MetriqueActeur, PeriodeStatistique } from "@/data/mongo/getStatistiquesMetriques";
import {
  classerProximites,
  formaterTaux,
  type Perimetre,
  type ProximiteGroupe,
} from "@/lib/proximite";

const LIBELLES_PERIODE: Partial<Record<PeriodeStatistique, string>> = {
  LEGISLATURE: "Toute la législature",
  LAST_YEAR: "12 derniers mois",
  LAST_SIX_MONTHS: "6 derniers mois",
  MANDAT: "Durée du mandat",
};

const GRIS = "#78909C";

/** Ligne d'un groupe : pastille, barre à la couleur du groupe, taux. */
function LigneGroupe({
  groupe,
  perimetre,
  nom,
  libelle,
  propre,
}: {
  groupe: ProximiteGroupe & { taux: number };
  perimetre: Perimetre;
  nom: string;
  /** Nom complet du groupe : les sigles ne disent rien à la plupart des lecteurs. */
  libelle?: string;
  propre?: boolean;
}) {
  const [accords, base] = groupe[perimetre] ?? [0, 0];
  const couleur = groupe.couleur ?? GRIS;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "72px minmax(0, 1fr) 48px",
        gap: 1.25,
        alignItems: "center",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {/* Infobulle collée à la pastille : le nom du groupe. */}
      <Tooltip title={libelle ? `${groupe.groupe} — ${libelle}` : groupe.groupe} placement="top" arrow>
        <Box
          component="span"
          tabIndex={0}
          sx={{
            bgcolor: couleur,
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.7rem",
            borderRadius: "999px",
            px: 1,
            py: 0.25,
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            cursor: "help",
            "&:focus-visible": { outline: "2px solid", outlineColor: "text.primary", outlineOffset: 2 },
          }}
        >
          {groupe.groupe}
        </Box>
      </Tooltip>
      {/* Le détail suit le curseur : la barre est longue, une infobulle
          centrée apparaîtrait loin de l'endroit survolé. */}
      <Tooltip
        followCursor
        title={`${nom} a voté comme la ligne du groupe ${libelle ? `${groupe.groupe} (${libelle})` : groupe.groupe} lors de ${accords.toLocaleString("fr-FR")} des ${base.toLocaleString("fr-FR")} scrutins où ce groupe avait une ligne.`}
      >
        <Box
          tabIndex={0}
          sx={{
            position: "relative",
            height: 12,
            borderRadius: 1,
            bgcolor: "#E4E4E7",
            cursor: "help",
            // Son groupe, repère de la lecture : entouré.
            outline: propre ? "2px solid #1A1A1B" : "none",
            outlineOffset: 1,
            "&:focus-visible": { outline: "2px solid", outlineColor: "text.primary", outlineOffset: 2 },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: "0 auto 0 0",
              width: `${groupe.taux}%`,
              bgcolor: couleur,
              borderRadius: 1,
            }}
          />
        </Box>
      </Tooltip>
      <Typography variant="body2" fontWeight={600} sx={{ textAlign: "right" }}>
        {formaterTaux(groupe.taux)}
      </Typography>
    </Box>
  );
}

/**
 * Proximité de vote du député avec chaque groupe (onglet Votes) : la part des
 * scrutins où il a voté comme la ligne de ce groupe. Son propre groupe est
 * affiché en tête, comme repère. Utile surtout pour les groupes de coalition
 * (LIOT, GDR), dont l'écart à la ligne dit peu de chose.
 */
export default function ProximiteCard({
  metriques,
  nom,
  libelles = {},
}: {
  metriques: MetriqueActeur[];
  nom: string;
  /** Nom complet des groupes, par sigle. */
  libelles?: Record<string, string>;
}) {
  const periodes = (["LAST_YEAR", "LAST_SIX_MONTHS", "LEGISLATURE", "MANDAT"] as PeriodeStatistique[]).filter((p) =>
    metriques.some((m) => m.periode === p && m.groupes?.length)
  );
  const [periode, setPeriode] = React.useState<PeriodeStatistique | undefined>(periodes[0]);
  const [perimetre, setPerimetre] = React.useState<Perimetre>("tous");

  // Pas encore calculé (avant le premier import nocturne) : rien à montrer.
  if (!periode) return null;

  const metrique = metriques.find((m) => m.periode === periode);
  const { propre, autres } = classerProximites(metrique?.groupes ?? [], perimetre, metrique?.groupeAbrev);
  const premier = autres[0];
  const dernier = autres[autres.length - 1];

  return (
    <Card
      id="proximite"
      variant="outlined"
      sx={{ borderRadius: 3, borderColor: "#e0e0e0", boxShadow: "none", mb: 4, scrollMarginTop: 120 }}
    >
      <CardContent sx={{ display: "grid", gap: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap gap={1.5}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle1" fontWeight="bold" component="h2">
              Avec qui vote-t-il&nbsp;?
            </Typography>
            <InfoDialogIcon category="depute" item="proximite_groupes" sx={{ p: 0.25 }} />
          </Stack>
          <Stack direction="row" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={perimetre}
              onChange={(_e, valeur: Perimetre | null) => valeur && setPerimetre(valeur)}
              aria-label="Scrutins pris en compte"
              sx={{ "& .MuiToggleButton-root": { textTransform: "none", py: 0.25, px: 1.25, fontSize: "0.8rem" } }}
            >
              <ToggleButton value="tous">Tous les scrutins publics</ToggleButton>
              <ToggleButton value="solennels">
                {/* Dans le bouton : un ToggleButtonGroup n'accepte que des ToggleButton pour enfants. */}
                <Tooltip title={GLOSSAIRE["scrutin-public-solennel"].definitionCourte} placement="top" arrow>
                  <span>Scrutins solennels</span>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            {periodes.length > 1 ? (
              <Select
                size="small"
                value={periode}
                onChange={(e) => setPeriode(e.target.value as PeriodeStatistique)}
                aria-label="Période"
                sx={{ fontSize: "0.8rem", borderRadius: "50px", "& .MuiSelect-select": { py: 0.5 } }}
              >
                {periodes.map((p) => (
                  <MenuItem key={p} value={p}>
                    {LIBELLES_PERIODE[p]}
                  </MenuItem>
                ))}
              </Select>
            ) : null}
          </Stack>
        </Stack>

        {premier ? (
          <Typography variant="body2">
            Hors de son groupe, {nom} vote le plus souvent comme <strong>{premier.groupe}</strong> (
            {formaterTaux(premier.taux)}) et le moins souvent comme <strong>{dernier.groupe}</strong> (
            {formaterTaux(dernier.taux)}).
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Trop peu de scrutins sur la période pour comparer ses votes à ceux des groupes.
          </Typography>
        )}

        <Box sx={{ display: "grid", gap: 0.75 }}>
          {propre ? (
            <>
              <LigneGroupe groupe={propre} perimetre={perimetre} nom={nom} libelle={libelles[propre.groupe]} propre />
              <Typography variant="caption" color="text.secondary" sx={{ pl: "82px", mt: -0.5 }}>
                Son groupe, en repère
              </Typography>
            </>
          ) : null}
          {autres.map((g) => (
            <LigneGroupe key={g.groupe} groupe={g} perimetre={perimetre} nom={nom} libelle={libelles[g.groupe]} />
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary">
          Part des scrutins où il a voté comme la ligne de chaque groupe — un groupe a une ligne quand deux tiers de
          ses votants votent de même. Voter pareil n’est pas partager un programme.{" "}
          <Link href="/groupes" style={{ color: "inherit" }}>
            Cohésion et proximité des groupes entre eux
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
