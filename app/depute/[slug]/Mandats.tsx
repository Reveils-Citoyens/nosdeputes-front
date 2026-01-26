import * as React from "react";

import { List, ListItem, Box, Paper, Stack, Typography } from "@mui/material";
import { Mandat, Organe } from "@prisma/client";
import { getActeurMandats } from "@/data/getActeurMandats";
import { organeTranslations } from "@/components/contents";
import InfoDialogIcon from "@/components/InfoDialog/InfoDialogIcon";

// Mandat de depute, et mandat d'appartenance au group parlementaire
const ignoredTypeOrgane = ["ASSEMBLEE", "GP", "PARPOL"];

const order = ["COMPER", "COMNL", "GE", "GA"];

type MandatsPerType = Record<
  string,
  (Pick<Organe, "libelle" | "libelleAbrev"> &
    Pick<Mandat, "libQualiteSex" | "organeRefUid" | "dateFin">)[]
>;

export default async function Mandats({ acteurUid }: { acteurUid: string }) {
  const mandats = await getActeurMandats(acteurUid);

  const mandatsPerType = mandats
    .filter((m) => m.typeOrgane && !ignoredTypeOrgane.includes(m.typeOrgane))
    .reduce((acc, mandat) => {
      const organe = mandat.organeRef;

      if (!organe || !mandat.typeOrgane) {
        return acc;
      }
      const { libQualiteSex, typeOrgane, organeRefUid, dateFin } = mandat;

      return {
        ...acc,
        [typeOrgane]: [
          ...(acc[typeOrgane] ?? []),
          {
            organeRefUid,
            libelle: organe?.libelle,
            libelleAbrev: organe?.libelleAbrev,
            libQualiteSex,
            dateFin,
          },
        ],
      };
    }, {} as MandatsPerType);

  const types = Object.keys(mandatsPerType).sort(
    (a, b) => order.indexOf(a) - order.indexOf(b)
  );

  return (
    <Paper sx={{ p: 2, bgcolor: "grey.100", width: 300, borderRadius: "16px" }} elevation={0}>
      <Stack direction="column" spacing={2}>
        <Typography variant="subtitle1" fontWeight={"bold"}>Responsabilités</Typography>

        {types.map((type) => (
          <Box key={type}>
            <Typography variant="body2" fontWeight="light" color="grey.600">
              {organeTranslations[type] ?? type}{" "}
              <Box component="span" sx={{ 
                display: 'inline-flex', 
                ml: 0.5,
                verticalAlign: 'text-bottom',
                '& button': { 
                  p: 0, 
                  minWidth: 0, 
                  height: 'auto',
                  lineHeight: 0
                },
                '& svg': { 
                  fontSize: '1rem',
                  color: 'grey.400' 
                }
              }}>
                <InfoDialogIcon category="organe" item={type} />
              </Box>

              
            </Typography>
            <List sx={{ listStyleType: 'disc', pl: 2.5 }}>
              {mandatsPerType[type]
                .filter(({ libQualiteSex, organeRefUid }) => {
                  if (libQualiteSex !== "Membre") {
                    return true;
                  }
                  return (
                    // Display "Membre" mandat if it's the unique mandat in the organe (avoid duplicate with membre + president, or secretaire, ...)
                    mandatsPerType[type].filter(
                      (item) => item.organeRefUid === organeRefUid
                    ).length === 1
                  );
                })
                .map(({ libelle, libQualiteSex }) => (
                  <ListItem key={libelle} 
                      disablePadding 
                      sx={{ display: 'list-item', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {libelle}
                      {libQualiteSex && ` (${libQualiteSex})`}
                    </Typography>
                  </ListItem>
                ))}
            </List>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
