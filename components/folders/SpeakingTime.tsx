import React from "react";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { useQueries } from "@tanstack/react-query";
import { getActeur } from "@/data/getActeur";
import { Organe } from "@prisma/client";
import { Tooltip } from "@mui/material";

type SpeakingTimeCardProps = {
  /**
   * Le nombre de mots prononcés par acteur (leur uid).
   */
  wordsPerActeur: Record<string, number>;
};

// TODO: Define a more robust order of political parties.
const partyOrder = [
  "LFI - NUPES",
  "GDR - NUPES",
  "Ecolo - NUPES",
  "SOC",
  "LIOT",
  "RE",
  "Dem",
  "HOR",
  "LR",
  "RN",
  "HOR",
];

function sortParty(a: string, b: string) {
  return partyOrder.indexOf(a) - partyOrder.indexOf(b);
}

export const SpeakingTime = (props: SpeakingTimeCardProps) => {
  const { wordsPerActeur } = props;

  const acteurQueries = useQueries({
    queries: Object.keys(wordsPerActeur).map((acteurUid) => ({
      queryKey: ["acteur", acteurUid],
      queryFn: () => getActeur(acteurUid),
    })),
  });

  const wordsPerGroup: Record<
    string,
    { count: number; groupeParlementaire: Organe }
  > = {};

  const loaded = acteurQueries.every((acteurQuery) => !acteurQuery.isPending);

  if (!loaded) {
    return <p>loading...</p>;
  }

  acteurQueries.forEach((acteurQuery) => {
    if (acteurQuery.isSuccess && acteurQuery.data) {
      const acteur = acteurQuery.data;
      const groupeParlementaire = acteur.groupeParlementaire;
      if (groupeParlementaire) {
        if (!wordsPerGroup[groupeParlementaire.uid]) {
          wordsPerGroup[groupeParlementaire.uid] = {
            count: 0,
            groupeParlementaire,
          };
        }
        wordsPerGroup[groupeParlementaire.uid].count +=
          wordsPerActeur[acteur.uid] || 0;
      }
    }
  });

  if (!wordsPerGroup) {
    return null;
  }

  const totalWords = Object.values(wordsPerGroup).reduce((acc, val) => {
    return val.count + acc;
  }, 0);

  const sortedKeys = Object.keys(wordsPerGroup).sort(
    // TODO: trier par parti d'une meilleur manière. POur l'instant je tri du plus important aux moins impliqué dans le debat
    (a, b) => wordsPerGroup[b].count - wordsPerGroup[a].count
    // sortParty(
    //   wordsPerGroup[a].groupeParlementaire.libelleAbrege,
    //   wordsPerGroup[b].groupeParlementaire.libelleAbrege
    // )
  );

  return (
    <React.Fragment>
      <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
        {sortedKeys.map((groupUid) => {
          const { count, groupeParlementaire } = wordsPerGroup[groupUid];
          return (
            <Tooltip
              key={groupUid}
              title={`${groupeParlementaire.libelle} : ${(
                (100 * count) /
                totalWords
              )
                .toFixed(1)
                .replace(".0", "")}%`}
            >
              <div
                style={{
                  height: 8,
                  backgroundColor:
                    groupeParlementaire.couleurAssociee || "#999",
                  borderRadius: 4,
                  flex: count / totalWords,
                }}
              />
            </Tooltip>
          );
        })}
      </Stack>
      <Stack
        direction="row"
        spacing={2}
        flexWrap="wrap"
        justifyContent="center"
      >
        {sortedKeys.map((groupUid) => {
          const { count, groupeParlementaire } = wordsPerGroup[groupUid];
          return (
            <Typography key={groupUid} fontWeight="bold" variant="caption">
              {groupeParlementaire.libelleAbrege} :{" "}
              {((100 * count) / totalWords).toFixed(1).replace(".0", "")}%
            </Typography>
          );
        })}
      </Stack>
    </React.Fragment>
  );
};
