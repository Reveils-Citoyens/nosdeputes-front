"use client";
import * as React from "react";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";

import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import SortOutlinedIcon from "@mui/icons-material/SortOutlined";
import ClearIcon from "@mui/icons-material/Close";

import Link from "next/link";

import DeputeCard from "@/components/folders/DeputeCard";
import { groupDeputes } from "./groupDeputes";
import CircleDiv from "@/icons/CircleDiv";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { Acteur, Mandat, Organe } from "@prisma/client";
import { DeputeFilterProps } from "./DeputesFilter";
import { departements } from "./structureCircos";
import { formatCirco } from "@/utils/formatCirco";
import { normalizeForSearch } from "@/lib/strings";

function GroupPolitiqueHeader({
  itemKey,
  group,
  nbDeputes,
}: {
  itemKey: string;
  nbDeputes: number;
  group: Organe | undefined;
}) {
  return (
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      aria-controls={`${itemKey}-content`}
      id={`${itemKey}-header`}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <CircleDiv color={group?.couleurAssociee ?? "gray"} size={11} />
        <Typography>
          {group ? (
            <>
              {group.libelle}{" "}
              (<strong>{group.libelleAbrev}</strong>)
            </>
          ) : "Groupe non renseigné"}{" "}
          — {nbDeputes} {nbDeputes > 1 ? "députés" : "député"}
        </Typography>
      </Stack>
    </AccordionSummary>
  );
}

function NameHeader({
  itemKey,
  nbDeputes,
}: {
  itemKey: string;
  nbDeputes: number;
}) {
  return (
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      aria-controls={`${itemKey}-content`}
      id={`${itemKey}-header`}
    >
      <Typography>
        {itemKey} - {nbDeputes} {nbDeputes > 1 ? "députés" : "député"}
      </Typography>
    </AccordionSummary>
  );
}

function Deputes({
  deputes,
  groups,
  grouping,
}: {
  deputes: (Acteur & { mandatPrincipal?: Mandat })[];
  groups: Record<string, Organe>;
  grouping: "groupPolitique" | "alphabetique";
}) {
  return (
    <Box
      sx={{
        display: "grid",
        alignItems: "center",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        rowGap: 1.5,
        columnGap: 4,
      }}
    >
      {deputes
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
        .map((depute) => {
          const {
            uid,
            urlImage,
            nom,
            prenom,
            slug,
            groupeParlementaireUid,
            mandatPrincipal,
          } = depute;
          const auGouvernement =
            "auGouvernement" in depute && depute.auGouvernement === true;

          const groupeParlementaire =
            groupeParlementaireUid && groups[groupeParlementaireUid];
          return (
            <DeputeCard
              key={uid}
              slug={slug}
              prenom={prenom}
              nom={nom}
              urlImage={urlImage}
              auGouvernement={auGouvernement}
              secondaryText={
                grouping === "groupPolitique"
                  ? formatCirco(mandatPrincipal?.numCirco, mandatPrincipal?.departement)
                  : undefined
              }
              group={
                grouping === "groupPolitique"
                  ? undefined
                  : !mandatPrincipal || mandatPrincipal.dateFin !== null
                  ? {
                      color: "black",
                      fullName: "mandat terminé",
                      shortName: "",
                    }
                  : groupeParlementaire &&
                    groupeParlementaire.couleurAssociee !== null
                  ? {
                      color: groupeParlementaire.couleurAssociee,
                      fullName: groupeParlementaire.libelle,
                      shortName: groupeParlementaire.libelleAbrege,
                    }
                  : undefined
              }
              isFullCardLink
            />
          );
        })}
    </Box>
  );
}

interface DeputesViewProps extends DeputeFilterProps {
  numeroDepartement: string | null;
}

export default function DeputesView({
  deputes,
  uidPerGroup,
  uidPerNom,
  groups,
  numeroDepartement,
}: DeputesViewProps) {
  const [grouping, setGrouping] = React.useState<
    "groupPolitique" | "alphabetique"
  >("groupPolitique");
  const [search, setSearch] = React.useState("");

  const uidGroup = grouping === "groupPolitique" ? uidPerGroup : uidPerNom;

  const AccordionHeader =
    grouping === "groupPolitique" ? GroupPolitiqueHeader : NameHeader;

  // Compte cohérent avec ce qui est réellement affiché :
  // - en mode "par groupe", les non-inscrits (sans groupeParlementaireUid) ne
  //   sont pas affichés car la liste filtre les clés vides (cf. plus bas).
  // - on applique aussi les filtres search / département pour que le compteur
  //   se mette à jour en temps réel.
  const selectedDeptName = numeroDepartement !== null
    ? (departements.find((d) => d.numeroDepartement === numeroDepartement)?.nomDepartement ?? null)
    : null;

  const visibleDeputes = Object.values(deputes).filter((depute) => {
    const { nom, prenom, mandatPrincipal, groupeParlementaireUid } = depute;

    if (!mandatPrincipal || mandatPrincipal.dateFin !== null) return false;

    if (grouping === "groupPolitique" && !groupeParlementaireUid) return false;

    if (
      search &&
      !normalizeForSearch(
        `${nom} ${prenom} ${mandatPrincipal?.departement ?? ""}`
      ).includes(normalizeForSearch(search))
    ) {
      return false;
    }

    if (
      selectedDeptName !== null &&
      mandatPrincipal?.departement?.toLowerCase() !== selectedDeptName.toLowerCase()
    ) {
      return false;
    }

    return true;
  }).length;

  const deputesMandatFinit = Object.values(deputes).filter(
    (depute) =>
      !depute.mandatPrincipal || depute.mandatPrincipal.dateFin !== null
  ).length;

  const filterIsActive = !!search || numeroDepartement !== null;
  return (
    <Stack direction="column">
      <Typography variant="h3" component="h1" fontWeight="bold">
        {visibleDeputes} Députés
      </Typography>
      <Typography fontWeight="light">
        plus {deputesMandatFinit} députés hors mandat
      </Typography>
      <Stack direction="row" spacing={2} sx={{ my: 2 }}>
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un député…"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlinedIcon sx={{ color: "grey.500", fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Effacer la recherche"
                  onClick={() => setSearch("")}
                  edge="end"
                >
                  <ClearIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
            sx: {
              borderRadius: "30px",
              bgcolor: "white",
              px: 1,
              "& fieldset": {
                borderColor: "grey.200",
              },
              "&:hover fieldset": {
                borderColor: "grey.300 !important",
              },
              "&.Mui-focused fieldset": {
                borderColor: "grey.700 !important",
                borderWidth: "1px !important",
              },
            },
          }}
        />
        <Button
          startIcon={<SortOutlinedIcon />}
          sx={{ flexShrink: 0 }}
          onClick={() => {
            setGrouping((p) =>
              p === "groupPolitique" ? "alphabetique" : "groupPolitique"
            );
          }}
        >
          {grouping === "groupPolitique"
            ? "Par groupe parlementaire"
            : "Par ordre alphabetique"}
        </Button>
      </Stack>
      {Object.keys(uidGroup).filter((key) => key !== "")
        .sort((a, b) => uidGroup[b].length - uidGroup[a].length)
        .map((key) => {
          const deputesUids = uidGroup[key];
          const filteredDeputes = deputesUids
            .map((uid) => deputes[uid])
            .filter(({ nom, prenom, mandatPrincipal }) => {
              return (
                (!search ||
                  normalizeForSearch(
                    `${nom} ${prenom} ${mandatPrincipal?.departement ?? ""}`
                  ).includes(normalizeForSearch(search))) &&
                (selectedDeptName === null ||
                  mandatPrincipal?.departement?.toLowerCase() === selectedDeptName.toLowerCase())
              );
            });

          if (filteredDeputes.length === 0) {
            return null;
          }

          return (
            <Accordion
              key={key}
              disableGutters
              elevation={0}
              slotProps={{ transition: { unmountOnExit: true } }}
            >
              <AccordionHeader
                key={key}
                itemKey={key}
                group={groups[key]}
                nbDeputes={filteredDeputes.length}
              />
              <AccordionDetails>
                <Deputes
                  deputes={filteredDeputes}
                  groups={groups}
                  grouping={grouping}
                />
              </AccordionDetails>
            </Accordion>
          );
        })}
    </Stack>
  );
}
