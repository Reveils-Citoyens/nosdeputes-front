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
}) {
  const { legislature, dossierUid, showDebats, showAmendements, showVotes } =
    props;
  const segment = useSelectedLayoutSegment();

  const { data: debats } = useQuery({
    queryKey: ["debats", dossierUid],
    queryFn: async () => await getDebats(dossierUid),
  });

  const debatsDisponibles = debats?.filter(
    (compteRendu: ReturnedDebat) => compteRendu._count.paragraphes > 0
  );

  const rootPathName = `/${legislature}/dossier/${dossierUid}/`;

  const tabs = [
    { value: "", label: "Aperçu", href: rootPathName, visible: true },
    {
      value: "debat",
      label: "Débats",
      href: `${rootPathName}debat`,
      visible: showDebats,
      disabled: debatsDisponibles != null && debatsDisponibles.length === 0,
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
      <Tabs sx={{
          minHeight: 40,
          '& .MuiTabs-indicator': {
            backgroundColor: 'black',
            height: 2,
          },
          '& .MuiTab-root': {
            textTransform: 'uppercase',
            minHeight: 40,
            minWidth: 'auto',
            px: 3, 
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.15em', 
            color: 'text.secondary',
            fontFamily: 'inherit',
          },
          '& .Mui-selected': {
            color: 'black !important',
          }
        }}
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
