import * as React from "react";

import { Paper, Stack, Typography } from "@mui/material";
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
    <Paper sx={{ p: 2, bgcolor: "grey.50", width: 300 }} elevation={0}>
      <Stack direction="column" spacing={2}>
        <Typography variant="subtitle1">Informations personelles</Typography>

        {dernierMandatDepute === undefined ? (
          <div>
            <Typography variant="body2" fontWeight="light">
              Debut de mandat
            </Typography>
            <Typography variant="body2">Pas de mandat de député·e·s</Typography>
          </div>
        ) : (
          <React.Fragment>
            <div>
              <Typography variant="body2" fontWeight="light">
                Debut de mandat
              </Typography>
              <Typography variant="body2">
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
                <Typography variant="body2" fontWeight="light">
                  Fin de mandat
                </Typography>
                <Typography variant="body2">
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
          <Typography variant="body2" fontWeight="light">
            Group politique <InfoDialogIcon category="organe" item="GP" />
          </Typography>
          <Typography variant="body2">
            {derniergroupeParlementaire &&
            derniergroupeParlementaire.dateFin === null
              ? derniergroupeParlementaire.organeRef?.libelleAbrege
              : "-"}
          </Typography>
        </div>

        <div>
          <Typography variant="body2" fontWeight="light">
            Partis politique <InfoDialogIcon category="organe" item="PARPOL" />
          </Typography>
          <Typography variant="body2">
            {dernierPartisPolitique && dernierPartisPolitique.dateFin === null
              ? dernierPartisPolitique.organeRef?.libelleAbrege
              : "-"}
          </Typography>
        </div>

        <div>
          <Typography variant="body2" fontWeight="light">
            Date de naissance
          </Typography>
          <Typography variant="body2">
            Le {dateNais && new Date(dateNais).toLocaleDateString("fr-FR")} (
            {age} ans) à {villeNais}
          </Typography>
        </div>

        <div>
          <Typography variant="body2" fontWeight="light">
            Profession <InfoDialogIcon category="depute" item="profession" />
          </Typography>
          <Typography variant="body2">{profession}</Typography>
        </div>
      </Stack>
    </Paper>
  );
}
