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
const ONGLETS = [
  "activites",
  "travaux",
  "amendements",
  "votes",
  "questions-orales",
  "questions-ecrites",
  "activite",
];

/** Onglets propres à un député : sans objet pour qui n'a pas siégé. */
const ONGLETS_DE_DEPUTE = new Set(["amendements", "votes", "questions-orales", "questions-ecrites", "activite"]);

export default function DeputeTabs({ slug, sansMandat = false }: { slug: string; sansMandat?: boolean }) {
  const { segment, navigate } = useTabNavigation();
  const actif = segment || "activites";
  const visible = (onglet: string) => !sansMandat || !ONGLETS_DE_DEPUTE.has(onglet);

  return (
    <Tabs
      value={ONGLETS.includes(actif) && visible(actif) ? actif : false}
      variant="scrollable"
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { display: "none" },
        // Sept onglets : marges et espacement des lettres resserrés pour qu'ils
        // tiennent sur une ligne à 1440 px, comme les six d'avant.
        "& .MuiTab-root": { borderBottom: "2px solid transparent", px: 2, letterSpacing: "1px" },
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
      {visible("amendements") && (
        <Tab
          value="amendements"
          label="Amendements"
          component={Link}
          href={`/depute/${slug}/amendements`}
          onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/amendements`, "amendements")}
        />
      )}
      {visible("votes") && (
        <Tab
          value="votes"
          label="Votes"
          component={Link}
          href={`/depute/${slug}/votes`}
          onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/votes`, "votes")}
        />
      )}
      {visible("questions-orales") && (
        <Tab
          value="questions-orales"
          label="Questions orales"
          component={Link}
          href={`/depute/${slug}/questions-orales`}
          onNavigate={(event: TabNavigateEvent) =>
            navigate(event, `/depute/${slug}/questions-orales`, "questions-orales")
          }
        />
      )}
      {visible("questions-ecrites") && (
        <Tab
          value="questions-ecrites"
          label="Questions écrites"
          component={Link}
          href={`/depute/${slug}/questions-ecrites`}
          onNavigate={(event: TabNavigateEvent) =>
            navigate(event, `/depute/${slug}/questions-ecrites`, "questions-ecrites")
          }
        />
      )}
      {visible("activite") && (
        <Tab
          value="activite"
          label="Détail"
          component={Link}
          href={`/depute/${slug}/activite`}
          onNavigate={(event: TabNavigateEvent) => navigate(event, `/depute/${slug}/activite`, "activite")}
        />
      )}
    </Tabs>
  );
}
