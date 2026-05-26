"use client";
import React from "react";
import { useParams } from "next/navigation";
import AmendementList from "./AmendementList";
import Stack from "@mui/material/Stack";
import { FilterContainer } from "@/components/FilterContainer";
import { Filter } from "./Filter";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Close";
import { useQueryState } from "nuqs";

export default function Page() {
  const { id: dossierUid } = useParams<{ id: string }>();
  const [search, setSearch] = useQueryState("search", {
    limitUrlUpdates: { method: "debounce", timeMs: 500 },
  });
  const [value, setValue] = React.useState(search ?? "");

  React.useEffect(() => {
    setValue(search ?? "");
  }, [search]);

  const handleChange = (next: string) => {
    setValue(next);
    setSearch(next || null);
  };

  return (
    <Container
      sx={{
        pt: 3,
        display: "flex",
        flexDirection: {
          xs: "column",
          md: "row",
        },
        gap: 5,
      }}
    >
      <Stack spacing={3} useFlexGap flex={2}>
        <FilterContainer>
          <Filter dossierUid={dossierUid} />
        </FilterContainer>
      </Stack>
      <Stack spacing={3} useFlexGap flex={8} sx={{ minWidth: 0 }}>
        <TextField
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder="Rechercher dans les amendements…"
          fullWidth
          size="small"
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
                  onClick={() => handleChange("")}
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
        <AmendementList dossierUid={dossierUid} />
      </Stack>
    </Container>
  );
}
