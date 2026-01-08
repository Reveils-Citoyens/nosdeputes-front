"use client";

import { useSelectedLayoutSegment } from "next/navigation";

import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";

export default function DeputeTabs({ slug }: { slug: string }) {
  const segment = useSelectedLayoutSegment();

  return (
    <Tabs value={segment ?? "activites"} variant="scrollable" sx={{
        minHeight: 40,
        borderBottom: 1,
        borderColor: 'divider',
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
      }}>
      <Tab
        value="activites"
        label="Activités"
        component={Link}
        href={`/depute/${slug}/`}
      />
      <Tab
        value="travaux"
        label="Travaux"
        component={Link}
        href={`/depute/${slug}/travaux`}
      />
      <Tab
        value="amendements"
        label="Amendements"
        component={Link}
        href={`/depute/${slug}/amendements`}
      />
      <Tab
        value="votes"
        label="Votes"
        component={Link}
        href={`/depute/${slug}/votes`}
      />
      <Tab
        value="qag"
        label="Questions"
        component={Link}
        href={`/depute/${slug}/qag`}
      />
    </Tabs>
  );
}
