"use client";
import * as React from "react";

import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { THEMES, TYPES_DE_DOSSIERS } from "../const";
import { useQueryState } from "nuqs";
import { DialogContent, Paper, Typography } from "@mui/material";

export const Filter = () => {
  const [theme, setTheme] = useQueryState("theme");
  const [search, setSearch] = useQueryState("search");
  const [codeProcedure, setCodeProcedure] = useQueryState("codeProcedure");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const selectedType = TYPES_DE_DOSSIERS.find(
    (type) => type.code === codeProcedure
  );

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
        label="Chercher par mot-clef"
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

      {selectedType && (
        <React.Fragment>
          <Paper elevation={0}>
            <Typography variant="body1" padding={1} fontWeight="bold">
              {selectedType.label}
            </Typography>
            <Typography variant="body2" padding={1}>
              {selectedType.description}
            </Typography>
            {selectedType.tooltip && (
              <div style={{ textAlign: "end" }}>
                <Button
                  onClick={() => setIsPopoverOpen(true)}
                  sx={{ mb: 1, mr: 1 }}
                >
                  En savoir plus
                </Button>
              </div>
            )}
          </Paper>
          <Dialog open={isPopoverOpen} onClose={() => setIsPopoverOpen(false)}>
            <DialogContent>{selectedType.tooltip}</DialogContent>
          </Dialog>
        </React.Fragment>
      )}
    </>
  );
};
