"use client";

import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { useQueryState } from "nuqs";

export default function RechercheFilter() {
  const [q, setQ] = useQueryState("q", { shallow: false, throttleMs: 300 });
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
