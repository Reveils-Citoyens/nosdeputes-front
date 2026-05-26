"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getDebats, ReturnedDebat } from "@/data/getDebats";

export default function DossiersTabs(props: {
  legislature: string;
  dossierUid: string;
  showDebats: boolean;
  showAmendements: boolean;
  showVotes: boolean;
  hasAmendements: boolean;
  hasVotes: boolean;
}) {
  const { legislature, dossierUid, showDebats, showAmendements, showVotes, hasAmendements, hasVotes } =
    props;
  const segment = useSelectedLayoutSegment();

  const { data: debats } = useQuery({
    queryKey: ["debats", dossierUid],
    queryFn: async () => await getDebats(dossierUid),
  });

  const seanceDebats = debats?.filter(
    (d: ReturnedDebat) => d.debateType === "seance" && d._count.paragraphes > 0,
  );
  const commissionDebats = debats?.filter(
    (d: ReturnedDebat) => d.debateType === "commission" && d._count.paragraphes > 0,
  );

  const rootPathName = `/${legislature}/dossier/${dossierUid}/`;

  const tabs = [
    { value: "", label: "Aperçu", href: rootPathName, visible: true },
    {
      value: "commission",
      label: "Commission",
      href: `${rootPathName}commission`,
      visible: showDebats,
      disabled: commissionDebats != null && commissionDebats.length === 0,
    },
    {
      value: "amendement",
      label: "Amendements",
      href: `${rootPathName}amendement`,
      visible: showAmendements,
      disabled: !hasAmendements,
    },
    {
      value: "debat",
      label: "Séance",
      href: `${rootPathName}debat`,
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
          ) : null,
        )}
      </Tabs>
    </Box>
  );
}
