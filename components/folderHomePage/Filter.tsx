"use client";

import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { THEMES } from "../const";
import { useQueryState } from "nuqs";

export const Filter = () => {
  const [theme, setTheme] = useQueryState("theme");
  const [search, setSearch] = useQueryState("search");

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
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
        }}
        variant="outlined"
      />
    </>
  );
};
