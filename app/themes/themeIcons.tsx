import * as React from "react";
import { Box, type SvgIconProps, type SxProps, type Theme } from "@mui/material";
import AgricultureOutlinedIcon from "@mui/icons-material/AgricultureOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import LocationCityOutlinedIcon from "@mui/icons-material/LocationCityOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import TheaterComedyOutlinedIcon from "@mui/icons-material/TheaterComedyOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ParkOutlinedIcon from "@mui/icons-material/ParkOutlined";
import FamilyRestroomOutlinedIcon from "@mui/icons-material/FamilyRestroomOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import SailingOutlinedIcon from "@mui/icons-material/SailingOutlined";
import StoreOutlinedIcon from "@mui/icons-material/StoreOutlined";
import LocalPoliceOutlinedIcon from "@mui/icons-material/LocalPoliceOutlined";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import Diversity3OutlinedIcon from "@mui/icons-material/Diversity3Outlined";
import SportsSoccerOutlinedIcon from "@mui/icons-material/SportsSoccerOutlined";
import HandshakeOutlinedIcon from "@mui/icons-material/HandshakeOutlined";
import DirectionsTransitOutlinedIcon from "@mui/icons-material/DirectionsTransitOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import StarsOutlinedIcon from "@mui/icons-material/StarsOutlined";
import EuroSymbolOutlinedIcon from "@mui/icons-material/EuroSymbolOutlined";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import BalanceOutlinedIcon from "@mui/icons-material/BalanceOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import EnergySavingsLeafOutlinedIcon from "@mui/icons-material/EnergySavingsLeafOutlined";
import TerrainOutlinedIcon from "@mui/icons-material/TerrainOutlined";
import type { ThemeSlug } from "@/data/themes";
import type { ThemeGroupSlug } from "@/data/themeGroups";

export const THEME_ICONS: Record<ThemeSlug, React.ComponentType<SvgIconProps>> = {
  agriculture_et_peche: AgricultureOutlinedIcon,
  amenagement_du_territoire: MapOutlinedIcon,
  anciens_combattants: MilitaryTechOutlinedIcon,
  budget: AccountBalanceWalletOutlinedIcon,
  collectivites_territoriales: LocationCityOutlinedIcon,
  commerce_et_artisanat: StorefrontOutlinedIcon,
  culture: TheaterComedyOutlinedIcon,
  defense: ShieldOutlinedIcon,
  economie_et_finances: TrendingUpOutlinedIcon,
  education: SchoolOutlinedIcon,
  energie: BoltOutlinedIcon,
  entreprises: BusinessOutlinedIcon,
  environnement: ParkOutlinedIcon,
  famille: FamilyRestroomOutlinedIcon,
  fiscalite: ReceiptLongOutlinedIcon,
  fonction_publique: BadgeOutlinedIcon,
  justice: GavelOutlinedIcon,
  logement_et_urbanisme: HomeWorkOutlinedIcon,
  outre_mer: SailingOutlinedIcon,
  pme: StoreOutlinedIcon,
  police_et_securite: LocalPoliceOutlinedIcon,
  pouvoirs_publics_et_constitution: AccountBalanceOutlinedIcon,
  questions_sociales_et_sante: HealthAndSafetyOutlinedIcon,
  recherche: ScienceOutlinedIcon,
  sciences_et_techniques: MemoryOutlinedIcon,
  securite_sociale: MedicalServicesOutlinedIcon,
  societe: Diversity3OutlinedIcon,
  sports: SportsSoccerOutlinedIcon,
  traites_et_conventions: HandshakeOutlinedIcon,
  transports: DirectionsTransitOutlinedIcon,
  travail: WorkOutlineOutlinedIcon,
  affaires_etrangeres_et_cooperation: PublicOutlinedIcon,
  union_europeenne: StarsOutlinedIcon,
};

type ThemeIconProps = {
  slug: ThemeSlug;
  size?: number;
  boxSize?: number;
  sx?: SxProps<Theme>;
};

export function ThemeIcon({ slug, size = 22, boxSize = 44, sx }: ThemeIconProps) {
  const Icon = THEME_ICONS[slug];
  return (
    <Box
      sx={{
        width: boxSize,
        height: boxSize,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.50",
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: "10px",
        ...sx,
      }}
    >
      <Icon sx={{ fontSize: size, color: "primary.main" }} />
    </Box>
  );
}

export const THEME_GROUP_ICONS: Record<
  ThemeGroupSlug,
  React.ComponentType<SvgIconProps>
> = {
  "economie-finances": EuroSymbolOutlinedIcon,
  "sante-solidarites": VolunteerActivismOutlinedIcon,
  "travail-fonction-publique": EngineeringOutlinedIcon,
  "justice-securite-institutions": BalanceOutlinedIcon,
  "international-defense": TravelExploreOutlinedIcon,
  "education-recherche": MenuBookOutlinedIcon,
  "culture-societe-sport": PaletteOutlinedIcon,
  "ecologie-energie-transports": EnergySavingsLeafOutlinedIcon,
  "territoires-logement-agriculture": TerrainOutlinedIcon,
};

type ThemeGroupIconProps = {
  slug: ThemeGroupSlug;
  size?: number;
  boxSize?: number;
  sx?: SxProps<Theme>;
};

export function ThemeGroupIcon({
  slug,
  size = 26,
  boxSize = 52,
  sx,
}: ThemeGroupIconProps) {
  const Icon = THEME_GROUP_ICONS[slug];
  return (
    <Box
      sx={{
        width: boxSize,
        height: boxSize,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        borderRadius: "12px",
        ...sx,
      }}
    >
      <Icon sx={{ fontSize: size, color: "inherit" }} />
    </Box>
  );
}
