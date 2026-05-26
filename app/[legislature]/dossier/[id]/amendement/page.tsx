"use client";
import React from "react";
import { useParams } from "next/navigation";
import AmendementList from "./AmendementList";
import Stack from "@mui/material/Stack";
import { FilterContainer } from "@/components/FilterContainer";
import { Filter } from "./Filter";
import Container from "@mui/material/Container";
import SearchInput from "@/components/SearchInput";
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
        <SearchInput
          value={value}
          onChange={handleChange}
          placeholder="Rechercher dans les amendements…"
        />
        <AmendementList dossierUid={dossierUid} />
      </Stack>
    </Container>
  );
}
