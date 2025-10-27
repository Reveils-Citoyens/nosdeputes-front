"use client";
import React from "react";
import { useParams } from "next/navigation";
import AmendementList from "./AmendementList";
import Stack from "@mui/material/Stack";
import { FilterContainer } from "@/components/FilterContainer";
import { Filter } from "./Filter";
import Container from "@mui/material/Container";
import { debounce } from "@mui/material/utils";
import Input from "@mui/material/Input";
import SearchIcon from "@mui/icons-material/Search";

export default function Page() {
  const { id: dossierUid } = useParams<{ id: string }>();

  const [search, handleSearch] = React.useState("");
  const [numero, handleNumero] = React.useState("");
  const [document, handleDocument] = React.useState("");
  const [depute, handleDepute] = React.useState("");
  const [status, handleStatus] = React.useState("");

  const debouncedSetSearch = React.useMemo(
    () =>
      debounce((newSearch) => {
        handleSearch(newSearch);
      }, 500),
    []
  );

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
          <Filter
            numero={numero}
            handleNumero={handleNumero}
            selectedDocument={document}
            setSelectedDocument={handleDocument}
            dossierUid={dossierUid}
            depute={depute}
            handleDepute={handleDepute}
            status={status}
            handleStatus={handleStatus}
          />
        </FilterContainer>
      </Stack>
      <Stack spacing={3} useFlexGap flex={8} sx={{ minWidth: 0 }}>
        {/* <Typography variant="h2" fontWeight="bold" fontFamily="Raleway">
          {flattenAmendements?.length ?? 0} Amendements
        </Typography> */}
        <Input
          onChange={(event) => debouncedSetSearch(event.target.value)}
          startAdornment={<SearchIcon />}
        />
        <AmendementList
          dossierUid={dossierUid}
          search={search}
          numero={numero}
          documentUid={document}
          deputeUid={depute}
          status={status}
        />
      </Stack>
    </Container>
  );
}
