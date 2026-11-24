"use client";
import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { sortAmendementPossible } from "@/data/searchAmendement";
import type { AmendementActeur } from "@/data/mongo/amendementsActeurAN";
import type { PaginatedResponse } from "@/data/pagination";
import { lireJson } from "@/lib/lireJson";
import ErreurChargement from "@/components/ErreurChargement";
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
import { DeputeListSkeleton } from "@/components/navigation/DeputeTabSkeleton";

/** Amendements affichés par page. */
const PAR_PAGE = 20;

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

  // Lu par une route du site (notre base, l'API Tricoteuses en repli) plutôt
  // que directement dans l'API : sa lenteur faisait afficher « Aucun amendement ».
  const { data: result, isPending, isError, refetch } = useQuery({
    queryKey: ["amendements", page, acteur?.uid, sortAmendement, search],
    queryFn: async ({ signal }) => {
      if (!acteur?.uid) return null;
      const parametres = new URLSearchParams({ page: String(page), perPage: String(PAR_PAGE), sortAmendement, search });
      return await lireJson<PaginatedResponse<AmendementActeur>>(
        `/api/acteurs/${acteur.uid}/amendements?${parametres}`,
        signal,
      );
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

      {isError && <ErreurChargement onRetry={() => refetch()} />}
      {isPending && <DeputeListSkeleton variant="amendements" showFilters={false} />}
      {data.map((amendement) => {
        const dossierTitre = amendement.dossierRef?.titre;
        const titre = dossierTitre
          ? `${dossierTitre} — N°${amendement.numeroOrdreDepot}`
          : `Amendement N°${amendement.numeroOrdreDepot}`;

        return (
          <AmendementCard
            key={amendement.uid}
            amendement={amendement as unknown as React.ComponentProps<typeof AmendementCard>["amendement"]}
            acteurUid={null}
            titre={titre}
          />
        );
      })}

      {data.length === 0 && !isPending && !isError && (
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
      {!isPending && <Pagination
        {...pagination}
        page={page}
        setPage={setPage}
        isPending={isPending}
      />}
    </Box>
  );
}
