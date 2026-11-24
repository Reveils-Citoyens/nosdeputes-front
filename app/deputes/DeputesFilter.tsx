"use client";
import * as React from "react";

import Stack from "@mui/material/Stack";

import DeputesView from "./DeputesView";

import { FilterContainer } from "@/components/FilterContainer";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Link from "@/components/navigation/NavigationLink";
import { ordreHemicycle } from "@/lib/proximite";
import { Filter } from "./Filter";
import { groupDeputes } from "./groupDeputes";
import { Acteur, Mandat, Organe } from "@prisma/client";
import type { DeputeListItem } from "./deputeListItem";

export interface DeputeFilterProps {
  deputes: Record<string, DeputeListItem>;
  uidPerNom: Record<string, string[]>;
  uidPerGroup: Record<string, string[]>;
  uidPerCirco: Record<string, string[]>;
  groups: Record<string, Organe>;
}

export default function DeputesFilter(props: DeputeFilterProps) {
  const { deputes, uidPerNom, uidPerGroup, uidPerCirco, groups } = props;

  const [numeroDepartement, setNumeroDepartement] = React.useState<
    string | null
  >(null);

  return (
    <React.Fragment>
      <Stack spacing={3} useFlexGap flex={2}>
        <FilterContainer>
          <Filter
            numeroDepartement={numeroDepartement}
            handleNumeroDepartement={setNumeroDepartement}
          />
        </FilterContainer>
        {/* Même allure que le bloc « Filtrer » : une carte, pas un bouton. */}
        <Link href="/groupes" style={{ textDecoration: "none", color: "inherit" }}>
          <Box
            sx={{
              bgcolor: "grey.100",
              borderRadius: "16px",
              px: 2,
              pt: 1.5,
              pb: 2,
              display: "grid",
              gap: 1,
              transition: "background-color 0.2s",
              "&:hover": { bgcolor: "grey.200" },
              "&:hover .lien-groupes": { textDecoration: "underline" },
            }}
          >
            <Typography sx={{ fontSize: "16px" }} fontWeight="bold">
              Groupes politiques
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cohésion de chaque groupe et proximité de vote entre eux.
            </Typography>
            {/* Les groupes de la législature, à leurs couleurs. */}
            <Stack direction="row" flexWrap="wrap" useFlexGap gap={0.5} aria-hidden>
              {Object.values(groups)
                .filter((g) => g.libelleAbrev !== "NI" && g.couleurAssociee)
                .sort((a, b) => ordreHemicycle(a.libelleAbrev, b.libelleAbrev))
                .map((g) => (
                  <Box
                    key={g.uid}
                    component="span"
                    sx={{
                      bgcolor: g.couleurAssociee,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.6rem",
                      letterSpacing: "0.03em",
                      borderRadius: "999px",
                      px: 0.7,
                      lineHeight: "16px",
                    }}
                  >
                    {g.libelleAbrev}
                  </Box>
                ))}
            </Stack>
            <Stack
              className="lien-groupes"
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ fontSize: "14px", fontWeight: 600, mt: 0.5 }}
            >
              <span>Cohésion et proximité</span>
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Stack>
          </Box>
        </Link>
      </Stack>
      <Stack spacing={3} flex={5}>
        <DeputesView
          deputes={deputes}
          uidPerNom={uidPerNom}
          uidPerGroup={uidPerGroup}
          uidPerCirco={uidPerCirco}
          groups={groups}
          numeroDepartement={numeroDepartement}
        />
      </Stack>
    </React.Fragment>
  );
}
