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
import MicIcon from "@mui/icons-material/Mic";
import GroupsIcon from "@mui/icons-material/Groups";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import IconButton from "@mui/material/IconButton";
import Link from "@/components/navigation/NavigationLink";
import { useDebateActeur, useDebateActeurs } from "./DebateActeursProvider";

/**
 * Interruption collective : l'Assemblée ne nomme personne (« Plusieurs députés
 * des groupes LFI-NFP et SOC », identifiant « 0 »), seulement les groupes.
 */
const COLLECTIF = /^(?:un|une|plusieurs|des|de nombreux)\s+(?:députée?s?|membres?)\s.*?\bgroupes?\s+(.+)$/i;

export function groupesCites(orateur: string | null | undefined): string[] {
  const m = orateur?.trim().match(COLLECTIF);
  if (!m) return [];
  return m[1]
    .split(/\s*,\s*|\s+et\s+/)
    .map((g) => g.trim().replace(/[.\s]+$/, ""))
    .filter(Boolean);
}

/** Pastille d'un groupe, à la couleur du groupe quand elle est connue. */
function PuceGroupe({ abrev, libelle, couleur }: { abrev: string; libelle?: string | null; couleur?: string | null }) {
  const puce = (
    <Chip
      label={abrev}
      size="small"
      sx={{
        backgroundColor: couleur || "#e0e0e0",
        color: couleur ? "#fff" : "rgba(0, 0, 0, 0.87)",
        fontWeight: 600,
        fontSize: "0.8rem",
        height: "30px",
        mt: 0.7,
        "& .MuiChip-label": { paddingLeft: 1.5, paddingRight: 1.5 },
      }}
    />
  );
  return libelle ? (
    <Tooltip placement="top" title={libelle}>
      {puce}
    </Tooltip>
  ) : (
    puce
  );
}

interface ParoleItemProps {
  acteurUid: string | null;
  /** Nom de l'orateur tel que l'imprime le compte rendu (« Plusieurs députés du groupe SOC »). */
  orateur?: string | null;
  roleDebat: string | null;
  texte: string | null;
  isFirst?: boolean;
  /** Position de cette prise de parole dans la vidéo, en secondes. */
  seconde?: number | null;
  /** Fourni seulement si la séance a une vidéo consultable. */
  onLire?: (seconde: number) => void;
  /** Ancre de cette prise de parole (« p-167 ») : les liens de la fiche député y mènent. */
  id?: string;
}
function ParoleItem(props: ParoleItemProps) {
  const { acteurUid, orateur, roleDebat, texte, isFirst = false, seconde, onLire, id } = props;

  const { data: acteur, isPending } = useDebateActeur(acteurUid);
  const debat = useDebateActeurs();
  const groupes = acteurUid ? [] : groupesCites(orateur);
  // Couleur d'un groupe : celle de ses membres intervenus dans ce débat.
  const groupeDe = (abrev: string) =>
    Object.values(debat?.items ?? {}).find((a) => a.groupeParlementaire?.libelleAbrev === abrev)
      ?.groupeParlementaire;

  return (
    // scroll-margin : l'en-tête fixe ne doit pas masquer l'intervention visée.
    // data-cible : posé par useDefilementVersAncre sur l'intervention visée.
    <TimelineItem
      id={id}
      sx={{
        scrollMarginTop: 120,
        // Toute la prise de parole, photo comprise. Les marges négatives
        // élargissent le fond sans décaler le texte par rapport aux voisines.
        "&[data-cible]": {
          bgcolor: "#FFF8E1",
          borderRadius: 3,
          boxShadow: "inset 3px 0 0 #F2B705",
          ml: -1.5,
          pl: 1.5,
          mr: -1.5,
          pr: 1.5,
        },
      }}
    >
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
            slotProps={{ img: { loading: "lazy", decoding: "async" } }}
            sx={{ height: 40, width: 40, bgcolor: "white", color: "grey.600" }}
            alt={`${acteur?.prenom ?? ""} ${acteur?.nom ?? ""}`}
            src={
              acteur?.urlImage && !acteur.urlImage.includes("marianne")
                ? acteur.urlImage
                : undefined
            }
          >
            {acteur ? (
              acteur.prenom?.[0] || acteur.nom?.[0] ? (
                <>
                  {acteur.prenom?.[0]?.toUpperCase()}
                  {acteur.nom?.[0]?.toUpperCase()}
                </>
              ) : (
                <MicIcon sx={{ fontSize: 22, color: "grey.500" }} />
              )
            ) : groupes.length > 0 ? (
              <GroupsIcon sx={{ fontSize: 24, color: "grey.600" }} />
            ) : acteurUid !== null && isPending ? null : (
              <MicIcon sx={{ fontSize: 22, color: "grey.500" }} />
            )}
          </Avatar>
        </Box>

        <TimelineConnector
          sx={{
            bgcolor: "transparent",
            borderLeft: "1px dashed",
            borderColor: "grey.400",
            flexGrow: 1,
          }}
        />
      </TimelineSeparator>
      <TimelineContent sx={{ py: 3, pr: 0 }}>
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
                {(!acteurUid || !isPending) && orateur?.trim() ? orateur.trim() : "Intervenant"}
              </Typography>
            )}
            {groupes.map((abrev) => {
              const groupe = groupeDe(abrev);
              return (
                <PuceGroupe key={abrev} abrev={abrev} libelle={groupe?.libelle} couleur={groupe?.couleurAssociee} />
              );
            })}
            {acteur?.groupeParlementaire?.libelle && acteur.groupeParlementaire.couleurAssociee && (
              <PuceGroupe
                abrev={`${acteur.groupeParlementaire.libelleAbrev}`}
                libelle={acteur.groupeParlementaire.libelle}
                couleur={acteur.groupeParlementaire.couleurAssociee}
              />
            )}
            {roleDebat && <Typography>{roleDebat}</Typography>}

            {onLire && seconde != null ? (
              // Le glyphe seul, sans cadre : l'icône porte déjà un cercle, et le
              // thème arrondit les IconButton en carré — l'encadrer donnait une
              // pastille grise qui se lisait comme un second badge à côté du
              // groupe politique. Le fond n'apparaît qu'au survol.
              // grey.700 tient 6,2:1 sur blanc, au-delà des 3:1 requis d'un
              // contrôle d'interface ; grey.500 n'était qu'à 2,7:1.
              <Tooltip title="Écouter cette intervention" placement="top">
                <IconButton
                  onClick={() => onLire(seconde)}
                  aria-label="Écouter cette intervention"
                  sx={{
                    color: "grey.700",
                    p: 0.5,
                    ml: -0.25,
                    "&:hover": { color: "common.black", bgcolor: "grey.100" },
                  }}
                >
                  <PlayCircleOutlineIcon sx={{ fontSize: 22 }} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>

          <Typography
            variant="body1"
            sx={{
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

export default React.memo(ParoleItem);
