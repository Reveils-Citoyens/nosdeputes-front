"use client";

import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useQueryState } from "nuqs";

const LEGISLATURES = [
  { code: "17", label: "17e (2024–)" },
  { code: "16", label: "16e (2022–2024)" },
  { code: "15", label: "15e (2017–2022)" },
];

export default function RechercheFilter() {
  const [q, setQ] = useQueryState("q", { shallow: false, throttleMs: 300 });
  const [legislature, setLegislature] = useQueryState("legislature", {
    shallow: false,
    throttleMs: 50,
  });
  const [sort, setSort] = useQueryState("sort", {
    shallow: false,
    throttleMs: 50,
  });

  return (
    <>
      <TextField
        size="small"
        label="Affiner la recherche"
        value={q ?? ""}
        onChange={(e) => setQ(e.target.value || null)}
        variant="outlined"
      />

      <TextField
        select
        size="small"
        label="Législature"
        value={legislature ?? ""}
        onChange={(e) => setLegislature(e.target.value || null)}
        variant="outlined"
      >
        <MenuItem value="">Toutes</MenuItem>
        {LEGISLATURES.map((l) => (
          <MenuItem key={l.code} value={l.code}>
            {l.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        size="small"
        label="Trier par"
        value={sort ?? "relevance"}
        onChange={(e) =>
          setSort(e.target.value === "relevance" ? null : e.target.value)
        }
        variant="outlined"
      >
        <MenuItem value="relevance">Pertinence</MenuItem>
        <MenuItem value="date">Plus récent</MenuItem>
      </TextField>
    </>
  );
}
