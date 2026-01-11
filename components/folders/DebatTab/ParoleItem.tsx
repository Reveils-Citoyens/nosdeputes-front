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
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getActeur } from "@/data/getActeur";

interface ParoleItemProps {
  acteurUid: string | null;
  roleDebat: string | null;
  texte: string | null;
}
export default function ParoleItem(props: ParoleItemProps) {
  const { acteurUid, roleDebat, texte } = props;

  const { data: acteur, isPending } = useQuery({
    queryKey: ["acteur", acteurUid],
    queryFn: async () =>
      acteurUid == null ? null : await getActeur(acteurUid),
    enabled: !!acteurUid,
  });

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
              {...(acteur?.mandatPrincipalUid !== null &&
              acteur?.mandatPrincipal?.chambre === "AN"
                ? {
                    component: Link,
                    href: `/depute/${acteur?.slug}`,
                    target: "_blank",
                  }
                : {})}
            >
              {acteur?.prenom ?? ""} {acteur?.nom ?? ""}
            </Typography>
            {acteur?.groupeParlementaire?.libelle &&
              acteur?.groupeParlementaire?.couleurAssociee && (
                <Tooltip
                  placement="top"
                  title={`${acteur?.groupeParlementaire?.libelle} (${acteur?.groupeParlementaire?.libelleAbrev})`}
                >
                  <CircleDiv
                    color={acteur?.groupeParlementaire?.couleurAssociee}
                  />
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
