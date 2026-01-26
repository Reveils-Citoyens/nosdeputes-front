"use client";
import * as React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Box from "@mui/material/Box";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Divider, Stack, Typography } from "@mui/material";
import CircleDiv from "@/icons/CircleDiv";
import DeputeCard from "@/components/folders/DeputeCard";
import { VoteWithActeur } from "./votes.type";

type GroupInfo = {
  groupId: string;
  pour: number;
  contre: number;
  abstentions: number;
  fullName: string;
  shortName: string;
  color: string;
  votes: VoteWithActeur[];
  positionMajoritaire: "pour" | "contre" | "abstention" | undefined;
};

export function VotesGroups({ votes }: { votes: VoteWithActeur[] }) {
  const votesPerGroup: GroupInfo[] = React.useMemo(() => {
    const groups: Record<string, GroupInfo> = {};

    votes.forEach((vote) => {
      const groupRef = vote.groupeVotantRef;
      const organe = groupRef?.organeRef;
      const groupId = groupRef?.uid ?? "NI";

      if (!groups[groupId]) {
        groups[groupId] = {
          groupId,
          pour: 0,
          contre: 0,
          abstentions: 0,
          fullName: organe?.libelle ?? "Non Inscrits / Inconnu",
          shortName: organe?.libelleAbrev ?? "NI",
          color: organe?.couleurAssociee ?? "#888888",
          votes: [],
          positionMajoritaire: undefined,
        };
      }

      if (vote.positionVote === "pour") groups[groupId].pour++;
      if (vote.positionVote === "contre") groups[groupId].contre++;
      if (vote.positionVote === "abstention") groups[groupId].abstentions++;

      groups[groupId].votes.push(vote);
    });

    return Object.values(groups)
      .map((group) => {
        if (group.shortName === "NI") {
          return { ...group, positionMajoritaire: undefined };
        }

        let max = Math.max(group.pour, group.contre, group.abstentions);
        let maj: "pour" | "contre" | "abstention" | undefined = undefined;

        if (
          group.pour === max &&
          group.pour > group.contre &&
          group.pour > group.abstentions
        )
          maj = "pour";
        else if (
          group.contre === max &&
          group.contre > group.pour &&
          group.contre > group.abstentions
        )
          maj = "contre";
        else if (
          group.abstentions === max &&
          group.abstentions > group.pour &&
          group.abstentions > group.contre
        )
          maj = "abstention";

        return { ...group, positionMajoritaire: maj };
      })
      .sort((a, b) => b.votes.length - a.votes.length);
  }, [votes]);

  if (votesPerGroup.length === 0) {
    return (
      <Typography variant="body2" sx={{ p: 2 }}>
        Aucun détail de vote disponible.
      </Typography>
    );
  }

  return (
    <div>
      {votesPerGroup.map(
        ({
          groupId,
          pour,
          contre,
          abstentions,
          fullName,
          color,
          votes,
          positionMajoritaire,
        }) => (
          <React.Fragment key={groupId}>
            <Divider />
            <Accordion
              disableGutters
              elevation={0}
              sx={{ bgcolor: "transparent" }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-group-${groupId}`}
                id={`panel-group-${groupId}`}
                sx={{
                  "& .MuiAccordionSummary-content": {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    pr: 1,
                  },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ overflow: "hidden" }}
                >
                  <CircleDiv color={color} />
                  <Typography
                    sx={{
                      color: "text.primary",
                      fontWeight: "medium",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {fullName}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ flexShrink: 0, ml: 2 }}
                >
                  {pour > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ color: "green", fontWeight: "bold" }}
                    >
                      {pour} Pour
                    </Typography>
                  )}
                  {contre > 0 && (
                    <Typography
                      variant="caption"
                      sx={{ color: "red", fontWeight: "bold" }}
                    >
                      {contre} Contre
                    </Typography>
                  )}
                  {abstentions > 0 && (
                    <Typography variant="caption" sx={{ color: "grey.600" }}>
                      {abstentions} Abs.
                    </Typography>
                  )}
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  sx={{
                    display: "grid",
                    alignItems: "center",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    rowGap: 1.5,
                    columnGap: 1.5,
                  }}
                >
                  {votes.map(({ uid, positionVote, acteurRef }) => (
                    <DeputeCard
                      key={uid}
                      slug={acteurRef?.slug ?? ""}
                      urlImage={acteurRef?.urlImage ?? ""}
                      prenom={acteurRef?.prenom ?? ""}
                      nom={acteurRef?.nom ?? ""}
                      vote={positionVote}
                      showVote
                      isFullCardLink
                      groupPosition={positionMajoritaire}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          </React.Fragment>
        ),
      )}
    </div>
  );
}
