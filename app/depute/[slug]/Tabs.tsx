"use client";

import React from "react";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Link from "next/link";
import { useTabNavigation, type TabNavigateEvent } from "@/components/navigation/TabNavigation";

/**
 * Segments qui correspondent à un onglet. Les autres pages de la fiche — le
 * détail jour par jour, par exemple — vivent sous le même layout sans être un
 * onglet : MUI avertit alors que la valeur ne correspond à aucun enfant, et
 * n'affiche rien de sélectionné. On le lui dit explicitement avec `false`.
 */
const ONGLETS = ["activites", "travaux", "amendements", "votes", "qag", "activite"];

export default function DeputeTabs({ slug }: { slug: string }) {
  const { segment, navigate } = useTabNavigation();
  const actif = segment || "activites";

  return (
    <Tabs
      value={ONGLETS.includes(actif) ? actif : false}
      variant="scrollable"
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { display: "none" },
        "& .MuiTab-root": { borderBottom: "2px solid transparent" },
        "& .MuiTab-root.Mui-selected": { borderBottomColor: "common.black" },
      }}
    >
      <Tab
        value="activites"
        label="Activités"
        component={Link}
        href={`/depute/${slug}/`}
        onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/`, "")}
      />
      <Tab
        value="travaux"
        label="Travaux"
        component={Link}
        href={`/depute/${slug}/travaux`}
        onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/travaux`, "travaux")}
      />
      <Tab
        value="amendements"
        label="Amendements"
        component={Link}
        href={`/depute/${slug}/amendements`}
        onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/amendements`, "amendements")}
      />
      <Tab
        value="votes"
        label="Votes"
        component={Link}
        href={`/depute/${slug}/votes`}
        onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/votes`, "votes")}
      />
      <Tab
        value="qag"
        label="Questions"
        component={Link}
        href={`/depute/${slug}/qag`}
        onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/qag`, "qag")}
      />
      <Tab
        value="activite"
        label="Détail"
        component={Link}
        href={`/depute/${slug}/activite`}
        onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/activite`, "activite")}
      />
    </Tabs>
  );
}
