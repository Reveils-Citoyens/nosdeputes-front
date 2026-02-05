"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";

export default function DossiersTabs(props: {
  legislature: string;
  dossierUid: string;
  showDebats: boolean;
  showAmendements: boolean;
  showVotes: boolean;
  hasDebats: boolean;
}) {
  const { legislature, dossierUid, showDebats, showAmendements, showVotes, hasDebats } =
    props;
  const segment = useSelectedLayoutSegment();

  const rootPathName = `/${legislature}/dossier/${dossierUid}/`;

  const tabs = [
    { value: "", label: "Aperçu", href: rootPathName, visible: true },
    {
      value: "debat",
      label: "Débats",
      href: `${rootPathName}debat`,
      visible: showDebats,
      disabled: !hasDebats,
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
          ) : null,
        )}
      </Tabs>
    </Box>
  );
}
