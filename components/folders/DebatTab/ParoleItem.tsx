import * as React from "react";

import Typography from "@mui/material/Typography";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import CircleDiv from "@/icons/CircleDiv";
import { Acteur, Organe } from "@prisma/client";
import Link from "next/link";

interface ParoleItemProps {
  acteur: Acteur | null | undefined;
  groupeParlementaire: Organe | null | undefined;
  roleDebat: string | null;
  texte: string | null;
}
export default function ParoleItem(props: ParoleItemProps) {
  const { acteur, groupeParlementaire, roleDebat, texte } = props;

  return (
    <TimelineItem>
      <TimelineSeparator sx={{ minWidth: 50 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            my: 1,
            mx: "auto",
            borderColor: "grey.400",
            borderWidth: 2,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          <Avatar
            sx={{ height: 40, width: 40 }}
            alt={`${acteur?.prenom ?? ""} ${acteur?.nom ?? ""}`}
            src={acteur?.urlImage ?? ""}
          >
            {acteur?.prenom?.[0]?.toUpperCase()}
            {acteur?.nom?.[0]?.toUpperCase()}
          </Avatar>
        </Box>

        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <Stack direction="column" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography
              variant="body1"
              fontWeight="bold"
              {...(acteur?.mandatPrincipalUid !== null
                ? {
                    component: Link,
                    href: `/depute/${acteur?.slug}`,
                    target: "_blank",
                  }
                : {})}
            >
              {acteur?.prenom ?? ""} {acteur?.nom ?? ""}
            </Typography>
            {groupeParlementaire?.libelle &&
              groupeParlementaire?.couleurAssociee && (
                <Tooltip
                  placement="top"
                  title={`${groupeParlementaire?.libelle} (${groupeParlementaire?.libelleAbrev})`}
                >
                  <CircleDiv color={groupeParlementaire?.couleurAssociee} />
                </Tooltip>
              )}
            {roleDebat && <Typography>{roleDebat}</Typography>}
          </Stack>

          <Typography
            variant="caption"
            dangerouslySetInnerHTML={{ __html: texte || "TEXT_NOT_FOUND" }}
          ></Typography>
        </Stack>
      </TimelineContent>
    </TimelineItem>
  );
}
