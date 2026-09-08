"use client";
import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { JourneeActeur } from "@/data/mongo/getJourneesActeur";

/**
 * L'index des journées. Un tableau, pas un graphe : ici on ne cherche pas une
 * tendance mais une ligne précise, celle qu'un député veut vérifier.
 *
 * Le filtre porte sur l'indicateur contesté, parce que c'est ainsi qu'une
 * contestation arrive — « votre chiffre de présence en commission est faux »,
 * jamais « votre activité de mars est fausse ».
 */
const FILTRES = {
  tout: { label: "Toute activité", predicat: () => true },
  seance: {
    label: "Séance publique",
    predicat: (j: JourneeActeur) => j.seance > 0,
  },
  commission: {
    label: "Commissions",
    predicat: (j: JourneeActeur) => j.convocations > 0,
  },
  interventions: {
    label: "Interventions",
    predicat: (j: JourneeActeur) => j.interventions > 0,
  },
  depots: {
    label: "Amendements, documents, questions",
    predicat: (j: JourneeActeur) =>
      j.amendements + j.documents + j.questions > 0,
  },
} as const;

type Filtre = keyof typeof FILTRES;

const PAR_PAGE = 40;

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function JourneesClient(props: {
  slug: string;
  journees: JourneeActeur[];
}) {
  const [filtre, setFiltre] = React.useState<Filtre>("tout");
  const [visibles, setVisibles] = React.useState(PAR_PAGE);

  const filtrees = React.useMemo(
    () => props.journees.filter(FILTRES[filtre].predicat),
    [props.journees, filtre]
  );

  React.useEffect(() => setVisibles(PAR_PAGE), [filtre]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        sx={{ gap: 1, mb: 2 }}
      >
        <Typography variant="body2" color="text.secondary">
          {filtrees.length} journée{filtrees.length > 1 ? "s" : ""} avec activité
          enregistrée
        </Typography>
        <Select
          value={filtre}
          onChange={(event) => setFiltre(event.target.value as Filtre)}
          disableUnderline
          variant="standard"
          size="small"
          sx={{ fontSize: "0.9rem", color: "#666", minWidth: 200 }}
        >
          {(Object.keys(FILTRES) as Filtre[]).map((clef) => (
            <MenuItem key={clef} value={clef}>
              {FILTRES[clef].label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Box sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              <TableCell>Jour</TableCell>
              <TableCell align="right">Séance publique</TableCell>
              <TableCell align="right">Commissions</TableCell>
              <TableCell align="right">Interventions</TableCell>
              <TableCell align="right">Amendements</TableCell>
              <TableCell align="right">Documents</TableCell>
              <TableCell align="right">Questions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrees.slice(0, visibles).map((journee) => (
              <TableRow key={journee.date} hover>
                <TableCell>
                  <Link
                    href={`/depute/${props.slug}/activite/${journee.date}`}
                    style={{ textDecoration: "underline", color: "inherit" }}
                  >
                    {formatDate(journee.date)}
                  </Link>
                </TableCell>
                <Nombre valeur={journee.seance ? "présent" : null} />
                <Nombre
                  valeur={
                    journee.convocations
                      ? `${journee.commissionPresent} / ${journee.convocations}`
                      : null
                  }
                />
                <Nombre valeur={journee.interventions || null} />
                <Nombre valeur={journee.amendements || null} />
                <Nombre valeur={journee.documents || null} />
                <Nombre valeur={journee.questions || null} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {visibles < filtrees.length ? (
        <Stack alignItems="center" sx={{ mt: 2 }}>
          <Button onClick={() => setVisibles((v) => v + PAR_PAGE)}>
            Afficher {Math.min(PAR_PAGE, filtrees.length - visibles)} journées de
            plus
          </Button>
        </Stack>
      ) : null}
    </Box>
  );
}

function Nombre({ valeur }: { valeur: string | number | null }) {
  return (
    <TableCell
      align="right"
      sx={{
        fontVariantNumeric: "tabular-nums",
        color: valeur === null ? "text.disabled" : "text.primary",
      }}
    >
      {valeur ?? "—"}
    </TableCell>
  );
}
