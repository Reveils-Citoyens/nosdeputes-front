import * as React from "react";

import Typography from "@mui/material/Typography";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import CircleDiv from "@/icons/CircleDiv";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getActeur } from "@/data/getActeur";

interface ParoleItemProps {
  acteurUid: string | null;
  roleDebat: string | null;
  texte: string | null;
  isFirst?: boolean;
}
export default function ParoleItem(props: ParoleItemProps) {
  const { acteurUid, roleDebat, texte, isFirst = false } = props;

  const { data: acteur, isPending } = useQuery({
    queryKey: ["acteur", acteurUid],
    queryFn: async () =>
      acteurUid == null ? null : await getActeur(acteurUid),
    enabled: !!acteurUid,
  });

  return (
    <TimelineItem>
      <TimelineSeparator sx={{ minWidth: 50 }}>

      {!isFirst ? (
          <TimelineConnector
            sx={{
              bgcolor: "transparent",
              borderLeft: "1px dashed",
              borderColor: "grey.400",
              flexGrow: 0,
              height: "24px", 
            }}
          />
        ) : (
          <Box sx={{ height: "24px", width: "1px" }} />
        )}

        <Box
          sx={{
            width: 44,
            height: 44,
            mx: "auto",
            borderColor: "grey.400",
            borderWidth: 2,
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            zIndex: 1,
            bgcolor: "white",
            my: -0.5,
          }}
        >
          <Avatar
            sx={{ height: 40, width: 40, bgcolor: "white"}}
            alt={`${acteur?.prenom ?? ""} ${acteur?.nom ?? ""}`}
            src={acteur?.urlImage ?? ""}
          >
            {acteur ? (
               // Cas Député sans image : Initiales
               <>
                 {acteur.prenom?.[0]?.toUpperCase()}
                 {acteur.nom?.[0]?.toUpperCase()}
               </>
            ) : (
               // Cas Invité ou autre personne non identifiée (acteur est null) : Icône micro
              <Image
                src="/microphone.jpg"
                alt="Microphone"
                width={30}
                height={30}
              />
            )}
          </Avatar>
        </Box>

        <TimelineConnector 
                    sx={{ 
                        bgcolor: "transparent", 
                        borderLeft: "1px dashed", 
                        borderColor: "grey.400",
                        flexGrow: 1 
                    }} 
                />

      </TimelineSeparator>
      <TimelineContent sx={{ py: 3, pr: 0}}>
        <Stack direction="column" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
             {acteur ? (
                <Typography
                variant="body1"
                fontWeight="bold"
                {...(acteur?.mandatPrincipal?.chambre === "AN"
                    ? {
                        component: Link,
                        href: `/depute/${acteur?.slug}`,
                        target: "_blank",
                    }
                    : {})}
                >
                {acteur?.prenom ?? ""} {acteur?.nom ?? ""}
                </Typography>
            ) : (
                <Typography variant="body1" fontWeight="bold">
                    Intervenant
                </Typography>
            )}
            {acteur?.groupeParlementaire?.libelle &&
              acteur?.groupeParlementaire?.couleurAssociee && (
                <Tooltip
                  placement="top"
                  title={`${acteur?.groupeParlementaire?.libelle}`}
                >
              <Chip 
              label={`${acteur?.groupeParlementaire?.libelleAbrev}`}
              size="small"
              sx={{
                backgroundColor: acteur?.groupeParlementaire?.couleurAssociee || "#e0e0e0",
                color: acteur?.groupeParlementaire?.couleurAssociee ? "#fff" : "rgba(0, 0, 0, 0.87)",
                fontWeight: 600,
                fontSize: "0.8rem",
                height: "30px",
                mt: 0.7,
                "& .MuiChip-label": {
                    paddingLeft: 1.5,
                    paddingRight: 1.5
                }
              }}
            />
                </Tooltip>
              )}
            {roleDebat && <Typography>{roleDebat}</Typography>}
          </Stack>

          <Typography
            variant="body1"
            sx = {{
              lineHeight: 1.7,
              mt: 1,
            }}
            dangerouslySetInnerHTML={{ __html: texte || "TEXT_NOT_FOUND" }}
          ></Typography>
        </Stack>
      </TimelineContent>
    </TimelineItem>
  );
}
