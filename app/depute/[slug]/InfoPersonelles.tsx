import * as React from "react";

import { Box, Paper, Stack, Typography } from "@mui/material";
import { Acteur } from "@prisma/client";
import { getActeurMandats } from "@/data/getActeurMandats";
import InfoDialogIcon from "@/components/InfoDialog/InfoDialogIcon";

export default async function InfoPersonelles({
  acteurUid,
  depute,
}: {
  acteurUid: string;
  depute: Acteur;
}) {
  const mandats = await getActeurMandats(acteurUid);

  const sortedMandats = mandats.sort((a, b) =>
    a.dateDebut < b.dateDebut ? 1 : -1
  );

  const dernierMandatDepute = sortedMandats.filter(
    (mandat) => mandat.typeOrgane === "ASSEMBLEE"
  )[0];

  const derniergroupeParlementaire = sortedMandats.filter(
    (mandat) => mandat.typeOrgane === "GP"
  )[0];

  const dernierPartisPolitique = sortedMandats.filter(
    (mandat) => mandat.typeOrgane === "PARPOL"
  )[0];

  const { dateNais, villeNais, profession } = depute;
  const age =
    dateNais &&
    new Date(
      new Date().valueOf() - new Date(dateNais).valueOf()
    ).getFullYear() - 1970;

  return (
    <Paper
      sx={{ p: 2, bgcolor: "grey.100", borderRadius: "16px", width: "100%" }}
      elevation={0}
    >
      <Stack direction="column" spacing={2}>
        <Typography variant="subtitle1" fontWeight={"bold"}>
          Fiche d&apos;identité
        </Typography>

        {dernierMandatDepute === undefined ? (
          <div>
            <Typography variant="body2" fontWeight="light">
              Début de mandat
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              Pas de mandat de député·e
            </Typography>
          </div>
        ) : (
          <React.Fragment>
            <div>
              <Typography variant="body2" fontWeight="light" color="grey.600">
                Début de mandat
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                Le{" "}
                {new Date(dernierMandatDepute?.dateDebut).toLocaleDateString(
                  "fr-FR",
                  { day: "numeric", month: "long", year: "numeric" }
                )}{" "}
                {dernierMandatDepute?.dateFin === null ? "(en cours)" : null}
              </Typography>
            </div>

            {dernierMandatDepute?.dateFin !== null ? (
              <div>
                <Typography variant="body2" fontWeight="light" color="grey.600">
                  Fin de mandat
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {`Le ${new Date(
                    dernierMandatDepute?.dateFin
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}`}
                </Typography>
              </div>
            ) : null}
          </React.Fragment>
        )}

        <div>
          <Typography
            variant="body2"
            fontWeight="light"
            color="grey.600"
            sx={{
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            Groupe politique
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                ml: 0.5,
                verticalAlign: "text-bottom",
                "& button": {
                  p: 0,
                  minWidth: 0,
                  height: "auto",
                  lineHeight: 0,
                },
                "& svg": {
                  fontSize: "1rem",
                  color: "grey.400",
                },
              }}
            >
              <InfoDialogIcon category="organe" item="GP" />
            </Box>
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {derniergroupeParlementaire &&
            derniergroupeParlementaire.dateFin === null
              ? derniergroupeParlementaire.organeRef?.libelle
              : "-"}
          </Typography>
        </div>

        <div>
          <Typography
            variant="body2"
            fontWeight="light"
            color="grey.600"
            sx={{
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            Parti politique
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                ml: 0.5,
                verticalAlign: "text-bottom",
                "& button": {
                  p: 0,
                  minWidth: 0,
                  height: "auto",
                  lineHeight: 0,
                },
                "& svg": {
                  fontSize: "1rem",
                  color: "grey.400",
                },
              }}
            >
              <InfoDialogIcon category="organe" item="PARPOL" />
            </Box>
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {dernierPartisPolitique && dernierPartisPolitique.dateFin === null
              ? dernierPartisPolitique.organeRef?.libelle
              : "-"}
          </Typography>
        </div>

        <div>
          <Typography variant="body2" fontWeight="light" color="grey.600">
            Date de naissance
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            Le {dateNais && new Date(dateNais).toLocaleDateString("fr-FR")} (
            {age} ans) à {villeNais}
          </Typography>
        </div>

        <div>
          <Typography
            variant="body2"
            fontWeight="light"
            color="grey.600"
            sx={{ lineHeight: 1, display: "flex", alignItems: "center" }}
          >
            Profession
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                ml: 0.5,
                verticalAlign: "text-bottom",
                "& button": {
                  p: 0,
                  minWidth: 0,
                  height: "auto",
                  lineHeight: 0,
                },
                "& svg": {
                  fontSize: "1rem",
                  color: "grey.400",
                },
              }}
            >
              <InfoDialogIcon category="depute" item="profession" />
            </Box>
          </Typography>
          <Typography variant="body2" fontWeight="medium">
            {profession}
          </Typography>
        </div>
      </Stack>
    </Paper>
  );
}
