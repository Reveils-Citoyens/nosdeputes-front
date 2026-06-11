"use client";
import React from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Close";
import type { SxProps, Theme } from "@mui/material/styles";

type SearchInputProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
};

/**
 * Champ de recherche uniformisé (style pill, loupe à gauche, bouton effacer à droite).
 * Utilisé dans les pages dossier/amendements, dossier/votes, depute/* etc.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Rechercher…",
  ariaLabel = "Recherche",
  fullWidth = true,
  sx,
}: SearchInputProps) {
  return (
    <TextField
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      fullWidth={fullWidth}
      size="small"
      sx={sx}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "grey.500", fontSize: 20 }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              aria-label="Effacer la recherche"
              onClick={() => onChange("")}
              edge="end"
            >
              <ClearIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </InputAdornment>
        ) : null,
        sx: {
          borderRadius: "30px",
          bgcolor: "white",
          px: 1,
          "& fieldset": {
            borderColor: "grey.200",
          },
          "&:hover fieldset": {
            borderColor: "grey.300 !important",
          },
          "&.Mui-focused fieldset": {
            borderColor: "grey.700 !important",
            borderWidth: "1px !important",
          },
        },
      }}
    />
  );
}
