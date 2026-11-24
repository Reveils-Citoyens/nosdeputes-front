"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { GLOSSAIRE } from "@/data/glossaire";
import {
  formaterTaux,
  ordreHemicycle,
  taux,
  type Perimetre,
  type StatistiquesGroupes,
} from "@/lib/proximite";

const LIBELLES_PERIODE: Record<StatistiquesGroupes["periode"], string> = {
  LAST_YEAR: "12 derniers mois",
  LAST_SIX_MONTHS: "6 derniers mois",
  LEGISLATURE: "Toute la législature",
};
const GRIS = "#78909C";
/** Teinte de la matrice : un bleu sourd, distinct des couleurs des groupes. */
const TEINTE = "31, 58, 95";

/**
 * Pastille au sigle d'un groupe. Au survol, son nom complet, collé à la
 * pastille : les sigles ne disent rien à la plupart des lecteurs.
 */
function Pastille({
  groupe,
  couleur,
  libelle,
  compacte,
}: {
  groupe: string;
  couleur?: string | null;
  libelle?: string | null;
  compacte?: boolean;
}) {
  return (
    <Tooltip
      title={libelle ? `${groupe} — ${libelle}` : groupe}
      placement="top"
      arrow
    >
      <Box
        component="span"
        tabIndex={0}
        sx={{
          cursor: "help",
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "text.primary",
            outlineOffset: 2,
          },
          display: "inline-block",
          bgcolor: couleur ?? GRIS,
          color: "#fff",
          fontWeight: 600,
          fontSize: compacte ? "0.62rem" : "0.7rem",
          borderRadius: "999px",
          px: compacte ? 1.25 : 1,
          py: 0.25,
          // En-têtes de colonnes : plus étroits que les cellules, mais pas en
          // pastille ronde pour les abréviations courtes (DR, RN).
          minWidth: compacte ? 48 : 52,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {groupe}
      </Box>
    </Tooltip>
  );
}

/**
 * Page des groupes : leur cohésion (part des scrutins où deux tiers de leurs
 * votants ont voté de même) et leur proximité de vote deux à deux.
 */
export default function GroupesClient({
  statistiques,
}: {
  statistiques: StatistiquesGroupes[];
}) {
  const [periode, setPeriode] = React.useState<StatistiquesGroupes["periode"]>(
    statistiques.some((s) => s.periode === "LAST_YEAR")
      ? "LAST_YEAR"
      : statistiques[0].periode,
  );
  const [perimetre, setPerimetre] = React.useState<Perimetre>("tous");
  const donnees =
    statistiques.find((s) => s.periode === periode) ?? statistiques[0];

  const groupes = donnees.groupes
    .filter((g) => taux(g[perimetre]) !== null)
    .sort((a, b) => ordreHemicycle(a.groupe, b.groupe));
  const couleur = new Map(groupes.map((g) => [g.groupe, g.couleur]));
  const libelle = new Map(groupes.map((g) => [g.groupe, g.libelle]));
  const nomComplet = (sigle: string) =>
    libelle.get(sigle) ? `${sigle} (${libelle.get(sigle)})` : sigle;
  const paire = (a: string, b: string) =>
    donnees.paires.find(
      (p) =>
        (p.groupes[0] === a && p.groupes[1] === b) ||
        (p.groupes[0] === b && p.groupes[1] === a),
    )?.[perimetre];

  return (
    <Stack spacing={5}>
      <Stack
        direction="row"
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        gap={1}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={perimetre}
          onChange={(_e, valeur: Perimetre | null) =>
            valeur && setPerimetre(valeur)
          }
          aria-label="Scrutins pris en compte"
          sx={{
            "& .MuiToggleButton-root": {
              textTransform: "none",
              py: 0.25,
              px: 1.25,
              fontSize: "0.85rem",
            },
          }}
        >
          <ToggleButton value="tous">
            Tous les scrutins publics (
            {donnees.scrutins.tous.toLocaleString("fr-FR")})
          </ToggleButton>
          <ToggleButton value="solennels">
            {/* Dans le bouton : un ToggleButtonGroup n'accepte que des ToggleButton pour enfants. */}
            <Tooltip title={GLOSSAIRE["scrutin-public-solennel"].definitionCourte} placement="top" arrow>
              <span>Scrutins solennels ({donnees.scrutins.solennels})</span>
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>
        <Select
          size="small"
          value={periode}
          onChange={(e) =>
            setPeriode(e.target.value as StatistiquesGroupes["periode"])
          }
          aria-label="Période"
          sx={{
            fontSize: "0.85rem",
            borderRadius: "50px",
            "& .MuiSelect-select": { py: 0.5 },
          }}
        >
          {statistiques.map((s) => (
            <MenuItem key={s.periode} value={s.periode}>
              {LIBELLES_PERIODE[s.periode]}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Box component="section" aria-labelledby="titre-cohesion">
        <Typography
          id="titre-cohesion"
          variant="h3"
          component="h2"
          sx={{ mb: 1 }}
        >
          Cohésion des groupes
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, maxWidth: "68ch" }}
        >
          Part des scrutins où le groupe a voté d’une même voix : au moins deux
          tiers de ses membres votants dans le même sens. Un groupe de coalition
          se partage plus souvent qu’un groupe discipliné ; c’est sur les
          scrutins restants que l’écart d’un député à la ligne de son groupe est
          compté.
        </Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          {groupes.map((g) => {
            const valeur = taux(g[perimetre]) as number;
            const [avecLigne, votes] = g[perimetre] ?? [0, 0];
            return (
              <Box
                key={g.groupe}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "60px minmax(0, 1fr) 48px",
                    sm: "60px 240px minmax(0, 1fr) 48px",
                  },
                  gap: 1.5,
                  alignItems: "center",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <Pastille
                  groupe={g.groupe}
                  couleur={g.couleur}
                  libelle={g.libelle}
                />
                <Typography
                  variant="body2"
                  noWrap
                  sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}
                >
                  {g.libelle ?? g.groupe}
                </Typography>
                {/* Le détail suit le curseur : la barre est longue, une
                      infobulle centrée apparaîtrait loin de l'endroit survolé. */}
                <Tooltip
                  followCursor
                  title={`${g.libelle ? `${g.groupe} (${g.libelle})` : g.groupe} : au moins deux tiers de ses membres dans le même sens lors de ${avecLigne.toLocaleString("fr-FR")} des ${votes.toLocaleString("fr-FR")} scrutins où il a voté.`}
                >
                  <Box
                    tabIndex={0}
                    sx={{
                      position: "relative",
                      height: 12,
                      borderRadius: 1,
                      bgcolor: "#E4E4E7",
                      cursor: "help",
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "text.primary",
                        outlineOffset: 2,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: "0 auto 0 0",
                        width: `${valeur}%`,
                        bgcolor: g.couleur ?? GRIS,
                        borderRadius: 1,
                      }}
                    />
                  </Box>
                </Tooltip>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ textAlign: "right" }}
                >
                  {formaterTaux(valeur)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box component="section" aria-labelledby="titre-proximite">
        <Typography
          id="titre-proximite"
          variant="h3"
          component="h2"
          sx={{ mb: 1 }}
        >
          Proximité de vote entre groupes
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2, maxWidth: "68ch" }}
        >
          Part des scrutins où deux groupes avaient la même ligne, parmi ceux où
          les deux en avaient une. Les groupes sont rangés dans l’ordre de
          l’hémicycle, de la gauche à la droite. Voter ensemble n’est pas
          partager un programme : les textes consensuels rapprochent aussi des
          groupes opposés.
        </Typography>
        <Box
          sx={{
            overflowX: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: 3,
            bgcolor: "white",
          }}
        >
          <Box
            component="table"
            sx={{
              borderCollapse: "separate",
              borderSpacing: "3px",
              m: 1.5,
              fontVariantNumeric: "tabular-nums",
              fontSize: "0.8rem",
              "& th": { fontWeight: 600, p: 0.5 },
              "& td": {
                width: 52,
                height: 32,
                textAlign: "center",
                borderRadius: 1,
              },
            }}
          >
            <caption style={{ position: "absolute", left: -9999 }}>
              Part des scrutins où deux groupes avaient la même ligne
            </caption>
            <thead>
              <tr>
                <th />
                {groupes.map((g) => (
                  <Box
                    component="th"
                    key={g.groupe}
                    scope="col"
                    sx={{ verticalAlign: "bottom" }}
                  >
                    <Pastille
                      groupe={g.groupe}
                      couleur={g.couleur}
                      libelle={g.libelle}
                      compacte
                    />
                  </Box>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupes.map((a) => (
                <tr key={a.groupe}>
                  <Box component="th" scope="row" sx={{ textAlign: "right" }}>
                    <Pastille
                      groupe={a.groupe}
                      couleur={couleur.get(a.groupe)}
                      libelle={libelle.get(a.groupe)}
                    />
                  </Box>
                  {groupes.map((b) => {
                    if (a.groupe === b.groupe) {
                      return (
                        <Box
                          component="td"
                          key={b.groupe}
                          sx={{ bgcolor: "#F1F1EF", color: "text.disabled" }}
                        >
                          —
                        </Box>
                      );
                    }
                    const accords = paire(a.groupe, b.groupe);
                    const valeur = taux(accords);
                    if (valeur === null || !accords)
                      return <td key={b.groupe} />;
                    return (
                      <Tooltip
                        key={b.groupe}
                        title={`${nomComplet(a.groupe)} et ${nomComplet(b.groupe)} avaient la même ligne lors de ${accords[0].toLocaleString("fr-FR")} des ${accords[1].toLocaleString("fr-FR")} scrutins où les deux en avaient une (${formaterTaux(valeur)}).`}
                      >
                        <Box
                          component="td"
                          tabIndex={0}
                          sx={{
                            bgcolor: `rgba(${TEINTE}, ${Math.max(0.06, valeur / 100)})`,
                            color: valeur >= 60 ? "#fff" : "#1A1A1B",
                            cursor: "help",
                          }}
                        >
                          {Math.round(valeur)}
                        </Box>
                      </Tooltip>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}
