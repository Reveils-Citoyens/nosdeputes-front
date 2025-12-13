"use client";

import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { THEMES, TYPES_DE_DOSSIERS } from "../const";
import { useQueryState } from "nuqs";

export const Filter = () => {
  const [theme, setTheme] = useQueryState("theme");
  const [search, setSearch] = useQueryState("search");
  const [codeProcedure, setCodeProcedure] = useQueryState("codeProcedure");

  return (
    <>
      {/* <TextField
        select
        size="small"
        label="Thème"
        value={theme}
        onChange={(event) => {
          setTheme(event.target.value);
        }}
        variant="outlined"
      >
        <MenuItem value="">-</MenuItem>
        {THEMES.map((theme) => (
          <MenuItem key={theme} value={theme}>
            {theme}
          </MenuItem>
        ))}
      </TextField> */}

      <TextField
        size="small"
        label="Search"
        value={search ?? ""}
        onChange={(event) => {
          setSearch(event.target.value);
        }}
        variant="outlined"
      />

      <TextField
        select
        size="small"
        label="Type de dossier"
        value={codeProcedure ?? ""}
        onChange={(event) => {
          setCodeProcedure(event.target.value);
        }}
        variant="outlined"
      >
        <MenuItem value="">-</MenuItem>
        {TYPES_DE_DOSSIERS.map((type) => (
          <MenuItem key={type.code} value={type.code}>
            {type.label}
          </MenuItem>
        ))}
      </TextField>
    </>
  );
};
