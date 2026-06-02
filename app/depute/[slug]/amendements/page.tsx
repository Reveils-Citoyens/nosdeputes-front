"use client";
import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  searchAmendement,
  sortAmendementPossible,
  type AmendementWithDossierRef,
} from "@/data/searchAmendement";
import { useParams } from "next/navigation";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import AmendementCard from "@/components/folders/AmendementCard";
import {
  Stack,
  Select,
  MenuItem,
  Typography,
  Box,
} from "@mui/material";
import SearchInput from "@/components/SearchInput";
import debounce from "@/utils/debounce";
import Pagination from "@/components/Pagination";

export default function Amendements() {
  const { slug } = useParams<{ slug: string }>();
  const [value, setValue] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [sortAmendement, setSortAmendement] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data: acteur } = useQuery({
    queryKey: ["acteur", slug],
    queryFn: () => getActeurBySlug(slug),
  });

  const { data: result, isPending } = useQuery({
    queryKey: ["amendements", page, acteur?.uid, sortAmendement, search],
    queryFn: async () => {
      if (!acteur?.uid) return null;
      return await searchAmendement({
        page,
        perPage: 5,
        acteurRefUid: acteur.uid,
        sortAmendement,
        search,
        include: "dossierRef",
      });
    },
    enabled: !!acteur?.uid,
    placeholderData: keepPreviousData,
  });

  const data = result?.data ?? [];
  const pagination = result?.pagination;

  const debouncedSetSearch = React.useMemo(
    () =>
      debounce((next: string) => {
        setSearch(next);
        setPage(1);
      }, 300),
    [],
  );

  const handleSearchChange = (next: string) => {
    setValue(next);
    debouncedSetSearch(next);
  };

  const handleSortChange = (newSort: string) => {
    setSortAmendement(newSort);
    setPage(1);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <SearchInput
          value={value}
          onChange={handleSearchChange}
          placeholder="Rechercher par mot-clé ou numéro…"
        />
        <Select
          value={sortAmendement}
          onChange={(e) => handleSortChange(e.target.value)}
          displayEmpty
          variant="outlined"
          size="small"
          sx={{
            minWidth: 220,
            borderRadius: "30px",
            bgcolor: "white",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "grey.200",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "grey.300",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "grey.700",
              borderWidth: "1px",
            },
            "& .MuiSelect-select": {
              pl: 2,
            },
          }}
        >
          <MenuItem value="">Tous les statuts</MenuItem>
          {sortAmendementPossible.map((sort) => (
            <MenuItem key={sort} value={sort}>
              {sort}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {(data as AmendementWithDossierRef[]).map((amendement) => {
        const dossierTitre = amendement.dossierRef?.titre;
        const titre = dossierTitre
          ? `${dossierTitre} — N°${amendement.numeroOrdreDepot}`
          : `Amendement N°${amendement.numeroOrdreDepot}`;

        return (
          <AmendementCard
            key={amendement.uid}
            amendement={amendement}
            acteurUid={null}
            titre={titre}
          />
        );
      })}

      {data.length === 0 && !isPending && (
        <Typography
          sx={{
            textAlign: "center",
            mt: 6,
            color: "text.secondary",
            fontSize: "1.1rem",
          }}
        >
          Aucun amendement trouvé pour cette recherche.
        </Typography>
      )}
      <Pagination
        {...pagination}
        page={page}
        setPage={setPage}
        isPending={isPending}
      />
    </Box>
  );
}
