import * as React from "react";

import Avatar from "@mui/material/Avatar";
import Box, { BoxProps } from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

import MuiLink from "@mui/material/Link";

import CircleDiv from "@/icons/CircleDiv";
import Link from "next/link";
import { getActeur, ReturnedActeur } from "@/data/getActeur";

export type ActeurCardWithDataProps<
  RootComponent extends React.ElementType = "div",
> = {
  acteur: ReturnedActeur | null;
  smallGroupColor?: boolean;
  showVote?: boolean;
  /**
   * Si true ajoute une ligne pour indiquer la circonscirprion du mandat principal.
   */
  showCirconscription?: boolean;
  /**
   * Taille de l'indicateur coloré pour le groupe politique
   */
  groupColorSize?: "small" | "large";
  /**
   * Indicate which part of the element should link to the actor profile.
   */
  link?: "card" | "name" | "none";
  /**
   * The component to render on the right of the element.
   * Can be used to display votes for example.
   */
  // endAdornment?: React.JSX.Element;
} & BoxProps<RootComponent>;

export function ActeurCardWithData<RootComponent extends React.ElementType>(
  props: ActeurCardWithDataProps<RootComponent>,
) {
  const {
    acteur,
    link,
    sx,
    showCirconscription,
    groupColorSize = "large",
    // endAdornment,
    // ...other
  } = props;

  if (acteur === null) {
    return null;
  }

  const acteurUrl = acteur.chambre === "AN" ? `/depute/${acteur.slug}` : null;
  return (
    <Box
      sx={[
        {
          px: 0.5,
          py: 0.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          "&:hover": link === "card" && acteurUrl ? { bgcolor: "grey.50" } : {},
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...(link === "card" && acteurUrl
        ? {
            component: Link,
            href: acteurUrl,
          }
        : {})}
      // {...other}
    >
      <Box sx={{ display: "flex", minWidth: 0 }}>
        <Avatar
          sx={{ height: 40, width: 40 }}
          alt={`${acteur.prenom} ${acteur.nom}`}
          src={acteur.urlImage ?? undefined}
        >
          {acteur.prenom[0].toUpperCase()}
          {acteur.nom[0].toUpperCase()}
        </Avatar>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: 1.3,
            minWidth: 0,
          }}
        >
          {link === "name" && acteurUrl ? (
            <MuiLink
              variant="body2"
              fontWeight="medium"
              underline="hover"
              component={Link}
              href={acteurUrl}
              onClick={(event) => event.stopPropagation()}
            >
              {acteur.prenom} {acteur.nom}
            </MuiLink>
          ) : (
            <Typography variant="body2" fontWeight="medium">
              {acteur.prenom} {acteur.nom}
            </Typography>
          )}
          {showCirconscription && acteur.mandatPrincipal && (
            <Typography variant="body2" fontWeight="light">
              {acteur.mandatPrincipal.numCirco}e Circ{" "}
              {acteur.mandatPrincipal.departement}
            </Typography>
          )}
          {acteur.groupeParlementaire && (
            <Tooltip title={acteur.groupeParlementaire.libelle}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CircleDiv
                  color={acteur.groupeParlementaire.couleurAssociee || "gray"}
                  size={groupColorSize === "small" ? 10 : 12}
                />
                <Typography
                  sx={{
                    ml: 0.7,
                    lineHeight: "18px",
                    display: "flex",
                    minWidth: 0,
                  }}
                  variant="caption"
                  fontWeight="regular"
                >
                  <span
                    style={{
                      flexShrink: 0,
                      flexGrow: 1,
                      marginRight: 4,
                    }}
                  >
                    {acteur.groupeParlementaire.libelleAbrev}{" "}
                    {/* {acteur.groupeParlementaire.libelleAbrev &&
                      acteur.groupeParlementaire.libelle &&
                      ":"} */}
                  </span>
                  {/* <span
                    style={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      flexGrow: 1,
                      flexShrink: 1,
                    }}
                  >
                    {acteur.groupeParlementaire.libelle}
                  </span> */}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* {endAdornment} */}
    </Box>
  );
}
