"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { searchAmendement, sortAmendementPossible } from "@/data/searchAmendement";
import { useParams } from "next/navigation";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import AmendementCard from "@/components/folders/AmendementCard";
import { Stack, Select, Input, MenuItem, Button, CircularProgress, Box, Typography } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import debounce from "@/utils/debounce";

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

  const { data: result, isFetching } = useQuery({
    queryKey: ["amendements", page, acteur?.uid, sortAmendement, search],
    queryFn: async () => {
      if (!acteur?.uid) return null;
      return await searchAmendement({
        page,
        perPage: 10,
        acteurRefUid: acteur.uid,
        sortAmendement,
        search,
        include: "dossierRef"
      });
    },
    enabled: !!acteur?.uid,
    staleTime: 5 * 60 * 1000,
  });

  React.useEffect(() => {
    if (result?.data) {
      setAccumulatedData((prev) => {
        if (page === 1) return result.data;
        
        const newItems = result.data.filter(
          (newItem) => !prev.some((prevItem) => prevItem.uid === newItem.uid)
        );
        return [...prev, ...newItems];
      });
    }
  }, [result, page]);

  const handleSearchChange = React.useMemo(
    () =>
      debounce((value: string) => {
        setSearch(value);
        setPage(1);
        setAccumulatedData([]); 
      }, 300),
    []
  );

  const handleSortChange = (newSort: string) => {
    setSortAmendement(newSort);
    setPage(1);
    setAccumulatedData([]); 
  };

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const totalAmendements = result?.pagination?.total ?? 0;
  const hasMore = accumulatedData.length < totalAmendements;

  return (
    <Box sx={{ p: 2 }}>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Input
          fullWidth
          onChange={(event) => handleSearchChange(event.target.value)}
          startAdornment={<SearchIcon sx={{ mr: 1, color: "text.secondary" }} />}
          placeholder="Rechercher par mot-clé ou numéro..."
          sx={{
            bgcolor: "background.paper",
            borderRadius: 1,
            px: 1,
            border: "1px solid",
            borderColor: "divider",
          }}
        />
        <Select
          value={sortAmendement}
          onChange={(e) => handleSortChange(e.target.value)}
          displayEmpty
          sx={{ minWidth: 200, bgcolor: "background.paper" }}
        >
          <MenuItem value="">Tous les statuts</MenuItem>
          {sortAmendementPossible.map((sort) => (
            <MenuItem key={sort} value={sort}>
              {sort}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Stack spacing={0}>
        {accumulatedData.map((amendement) => (
          <AmendementCard
            key={amendement.uid}
            amendement={amendement}
            acteurUid={null}
            titre={`Amendement N°${amendement.numeroOrdreDepot}`}
          />
        ))}
      </Stack>

      {accumulatedData.length === 0 && !isFetching && (
        <Typography sx={{ textAlign: "center", mt: 4, color: "text.secondary" }}>
          Aucun amendement trouvé.
        </Typography>
      )}

      <Box sx={{ mt: 6, display: "flex", justifyContent: "center", pb: 4 }}>
        {isFetching ? (
          <CircularProgress size={30} />
        ) : (
          hasMore && (
            <Button
              variant="outlined"
              onClick={handleLoadMore}
              sx={{
                borderRadius: "20px",
                px: 2.3,
                py: 1.2,
                textTransform: "none",
                fontWeight: "bold",
              }}
            >
              Voir plus
            </Button>
          )
        )}
      </Box>
    </Box>
  );
}