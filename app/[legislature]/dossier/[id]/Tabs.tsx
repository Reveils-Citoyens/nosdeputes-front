"use client";

import React from "react";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDebats, ReturnedDebat } from "@/data/getDebats";
import { useTabNavigation, type TabNavigateEvent } from "@/components/navigation/TabNavigation";

export default function DossiersTabs(props: {
  legislature: string;
  dossierUid: string;
  showApercu: boolean;
  showDebats: boolean;
  showAmendements: boolean;
  showVotes: boolean;
  showComptesRendus?: boolean;
  hasAmendements: boolean;
  hasVotes: boolean;
  initialDebats?: ReturnedDebat[] | null;
}) {
  const { legislature, dossierUid, showApercu, showDebats, showAmendements, showVotes, showComptesRendus, hasAmendements, hasVotes } =
    props;
  const { segment, navigate } = useTabNavigation();

  const { data: debats } = useQuery({
    queryKey: ["debats", dossierUid],
    queryFn: async () => await getDebats(dossierUid),
    initialData: props.initialDebats ?? undefined,
    enabled: showDebats,
    staleTime: 60_000,
  });

  const seanceDebats = debats?.filter(
    (d: ReturnedDebat) => d.debateType === "seance" && d._count.paragraphes > 0,
  );
  const commissionDebats = debats?.filter(
    (d: ReturnedDebat) => d.debateType === "commission" && d._count.paragraphes > 0,
  );

  const rootPathName = `/${legislature}/dossier/${dossierUid}/`;

  const tabs = [
    { value: "", label: "Aperçu", href: rootPathName, visible: showApercu },
    {
      value: "amendement",
      label: "Texte & amendements",
      href: `${rootPathName}amendement`,
      visible: showAmendements,
      disabled: !hasAmendements,
    },
    {
      value: "commission",
      label: "Commission",
      href: commissionDebats?.[0]
        ? `${rootPathName}commission/${commissionDebats[0].uid}`
        : `${rootPathName}commission`,
      visible: showDebats,
      disabled: commissionDebats != null && commissionDebats.length === 0,
    },
    {
      value: "debat",
      label: "Séance",
      href: seanceDebats?.[0]
        ? `${rootPathName}debat/${seanceDebats[0].uid}`
        : `${rootPathName}debat`,
      visible: showDebats,
      disabled: seanceDebats != null && seanceDebats.length === 0,
    },
    {
      value: "votes",
      label: "Votes",
      href: `${rootPathName}votes`,
      visible: showVotes,
      disabled: !hasVotes,
    },
    {
      value: "comptes-rendus",
      label: "Comptes-rendus",
      href: `${rootPathName}comptes-rendus`,
      visible: !!showComptesRendus,
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Tabs
        value={
          segment &&
          tabs
            .filter((tab) => tab.visible)
            .map((tab) => tab.value)
            .includes(segment)
            ? segment
            : ""
        }
        variant="scrollable"
        sx={{
          // A border follows the optimistic selection in the same render.
          // MUI's measured indicator otherwise updates in a later effect.
          "& .MuiTabs-indicator": { display: "none" },
        }}
      >
        {tabs.map((tab) =>
          tab.visible ? (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              component={Link}
              href={tab.href}
              onNavigate={(event: TabNavigateEvent) => navigate(event, tab.href, tab.value)}
              disabled={tab.disabled}
              sx={{
                borderBottom: "2px solid transparent",
                // Trois niveaux nettement distincts : sélectionné (noir +
                // indicateur), disponible (gris soutenu) et indisponible
                // (gris très clair). Le thème global donnait auparavant une
                // teinte trop proche aux deux derniers états.
                "&:not(.Mui-selected):not(.Mui-disabled)": {
                  color: "grey.700",
                },
                "&.Mui-selected": {
                  color: "common.black",
                  fontWeight: 700,
                  borderBottomColor: "common.black",
                },
                "&.Mui-disabled": {
                  color: "grey.300",
                  fontWeight: 500,
                  opacity: 1,
                },
              }}
            />
          ) : null,
        )}
      </Tabs>
    </Box>
  );
}
