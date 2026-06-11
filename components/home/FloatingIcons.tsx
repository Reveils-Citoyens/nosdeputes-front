import Box from "@mui/material/Box";
import * as React from "react";

import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BalanceIcon from "@mui/icons-material/Balance";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import GrassIcon from "@mui/icons-material/Grass";
import EuroIcon from "@mui/icons-material/Euro";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import PublicIcon from "@mui/icons-material/Public";
import SchoolIcon from "@mui/icons-material/School";

const MAX_WIDTH = 1088;

type IconProps = {
  radius?: number;
  icon: React.ReactNode;
  limit: "xs" | "sm" | "md" | "lg";
  sx?: React.CSSProperties;
};

function Icon(props: IconProps) {
  const { radius = 20, icon, sx, limit } = props;
  return (
    <Box
      sx={{
        width: 2 * radius,
        height: 2 * radius,
        borderRadius: radius,
        position: "absolute",
        backgroundColor: "#fff",
        border: "solid gray 1px",
        display: { xs: "none", [limit]: "inline-flex", lg: "inline-flex" },
        alignItems: "center",
        justifyContent: "center",
        color: "text.secondary",
        ...sx,
      }}
    >
      <Box sx={{ fontSize: radius - 4, display: "inherit" }}>{icon}</Box>
    </Box>
  );
}

export default function FloatingIcons() {
  return (
    <React.Fragment>
      <Icon
        radius={20}
        sx={{ top: 425, left: `${100 * (171 / MAX_WIDTH)}%` }}
        icon={<PublicIcon fontSize="inherit" />}
        limit="sm"
      />
      <Icon
        radius={20}
        sx={{ top: 93, left: `${100 * (162 / MAX_WIDTH)}%` }}
        icon={<EuroIcon fontSize="inherit" />}
        limit="md"
      />
      <Icon
        radius={20}
        sx={{ top: 497, left: `${100 * (362 / MAX_WIDTH)}%` }}
        icon={<LocalPoliceIcon fontSize="inherit" />}
        limit="xs"
      />
      <Icon
        radius={21}
        sx={{ top: 182, left: `${100 * (250 / MAX_WIDTH)}%` }}
        icon={<AccountBalanceIcon fontSize="inherit" />}
        limit="md"
      />
      <Icon
        radius={27}
        sx={{ top: 335, left: `${100 * (132 / MAX_WIDTH)}%` }}
        icon={<SchoolIcon fontSize="inherit" />}
        limit="md"
      />
      <Icon
        radius={26}
        sx={{ top: 538, left: `${100 * (721 / MAX_WIDTH)}%` }}
        icon={<BalanceIcon fontSize="inherit" />}
        limit="xs"
      />
      <Icon
        radius={40}
        sx={{ top: 295, left: `${100 * (965 / MAX_WIDTH)}%` }}
        icon={<DirectionsBusIcon fontSize="inherit" />}
        limit="md"
      />
      <Icon
        radius={20}
        sx={{ top: 422, left: `${100 * (882 / MAX_WIDTH)}%` }}
        icon={<GrassIcon fontSize="inherit" />}
        limit="sm"
      />
      <Icon
        radius={32}
        sx={{ top: 145, left: `${100 * (989 / MAX_WIDTH)}%` }}
        icon={<LocalHospitalIcon fontSize="inherit" />}
        limit="md"
      />
    </React.Fragment>
  );
}
