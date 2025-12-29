"use client";
import React from "react";
import { useParams } from "next/navigation";
import AmendementList from "./AmendementList";
import Stack from "@mui/material/Stack";
import { FilterContainer } from "@/components/FilterContainer";
import { Filter } from "./Filter";
import Container from "@mui/material/Container";
import Input from "@mui/material/Input";
import SearchIcon from "@mui/icons-material/Search";
import { useQueryState } from "nuqs";

export default function Page() {
  const { id: dossierUid } = useParams<{ id: string }>();
  const [, handleSearch] = useQueryState("search", {
    limitUrlUpdates: { method: "debounce", timeMs: 500 },
  });

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
        {/* <Typography variant="h2" fontWeight="bold" fontFamily="Raleway">
          {flattenAmendements?.length ?? 0} Amendements
        </Typography> */}
        <Input
          onChange={(event) => handleSearch(event.target.value)}
          startAdornment={<SearchIcon />}
        />
        <AmendementList dossierUid={dossierUid} />
      </Stack>
    </Container>
  );
}
