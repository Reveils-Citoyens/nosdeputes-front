"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getPointsOdj } from "@/data/getPointsOdj";

export default function DossiersTabs(props: {
  legislature: string;
  dossierUid: string;
  showDebats: boolean;
  showAmendements: boolean;
  showVotes: boolean;
}) {
  const { legislature, dossierUid, showDebats, showAmendements, showVotes } =
    props;
  const segment = useSelectedLayoutSegment();

  const { data: pointsOdj } = useQuery({
    queryKey: ["pointsOdj", dossierUid],
    queryFn: async () => await getPointsOdj(dossierUid),
  });

  const odjWithDebat = pointsOdj?.filter(
    (pt) =>
      pt.agendaRef?.compteRenduDisponible === true &&
      pt._count.interventions > 0
  );

  const rootPathName = `/${legislature}/dossier/${dossierUid}/`;

  const tabs = [
    { value: "", label: "Aperçu", href: rootPathName, visible: true },
    {
      value: "debat",
      label: "Débats",
      href: `${rootPathName}debat`,
      visible: showDebats,
      disabled: odjWithDebat != null && odjWithDebat.length === 0,
    },
    {
      value: "amendement",
      label: "Amendements",
      href: `${rootPathName}amendement`,
      visible: showAmendements,
    },
    {
      value: "votes",
      label: "Votes",
      href: `${rootPathName}votes`,
      visible: showVotes,
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
      >
        {tabs.map((tab) =>
          tab.visible ? (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              component={Link}
              href={tab.href}
              disabled={tab.disabled}
            />
          ) : null
        )}
      </Tabs>
    </Box>
  );
}
