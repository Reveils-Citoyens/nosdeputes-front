"use client";
import React from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  searchAmendement,
  sortAmendementPossible,
} from "@/data/searchAmendement";
import { useParams } from "next/navigation";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import AmendementCard from "@/components/folders/AmendementCard";
import {
  Stack,
  Select,
  Input,
  MenuItem,
  Typography,
  Container,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import debounce from "@/utils/debounce";
import Pagination from "@/components/Pagination";

export default function Amendements() {
  const { slug } = useParams<{ slug: string }>();
  const [search, setSearch] = React.useState("");
  const [sortAmendement, setSortAmendement] = React.useState("");
  const [page, setPage] = React.useState(1);

  const [accumulatedData, setAccumulatedData] = React.useState<any[]>([]);

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
        perPage: 10,
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

  const handleSearchChange = React.useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value);
        setPage(1);
      }, 300),
    [],
  );

  const handleSortChange = (newSort: string) => {
    setSortAmendement(newSort);
    setPage(1);
    setAccumulatedData([]);
  };

  return (
    <Container maxWidth="xl" sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Input
          fullWidth
          onChange={(event) => handleSearchChange(event.target.value)}
          startAdornment={
            <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
          }
          placeholder="Rechercher par mot-clé ou numéro..."
          sx={{
            bgcolor: "background.paper",
            borderRadius: 1,
            px: 2,
            py: 0.5,
            border: "1px solid",
            borderColor: "divider",
            flexGrow: 1,
          }}
          disableUnderline
        />
        <Select
          value={sortAmendement}
          onChange={(e) => handleSortChange(e.target.value)}
          displayEmpty
          sx={{
            minWidth: 220,
            bgcolor: "background.paper",
            borderRadius: 1,
          }}
          variant="outlined"
          size="small"
        >
          <MenuItem value="">Tous les statuts</MenuItem>
          {sortAmendementPossible.map((sort) => (
            <MenuItem key={sort} value={sort}>
              {sort}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Pagination
        {...pagination}
        page={page}
        setPage={setPage}
        isPending={isPending}
      />
      {data.map((amendement) => {
        const titre = `Amendement N°${amendement.numeroOrdreDepot}`;

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
    </Container>
  );
}
