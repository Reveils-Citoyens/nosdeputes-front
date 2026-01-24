"use client";

import React from "react";
import { Vote, Scrutin, Acteur, Dossier } from "@prisma/client";
import { searchVote } from "@/data/searchVote";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import SearchIcon from "@mui/icons-material/Search";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import debounce from "@/utils/debounce";
import Pagination from "@/components/Pagination";
import { DeputeVoteCard } from "./DeputeVoteCard";

const positionsVotePossible = ["pour", "contre", "nonVotant", "abstention"];

type VoteWithDetails = Vote & { 
  scrutinRef: Scrutin & { dossierRef?: Dossier | null } 
};

type VotesClientProps = {
  acteur: Acteur;
};

export default function VotesClient({ acteur }: VotesClientProps) {

  const [search, setSearch] = React.useState("");
  const [positionVote, setPositionVote] = React.useState("");
  const [onlySolennel, setOnlySolennel] = React.useState(true); 
  const [page, setPage] = React.useState(1);

  const debouncedSetSearch = React.useMemo(
    () =>
      debounce((newSearch: string) => {
        setSearch(newSearch);
        setPage(1);
      }, 500),
    []
  );

  const { data: result, isPending } = useQuery({
    queryKey: ["votes", page, acteur.uid, positionVote, search, onlySolennel],
    queryFn: async () => {
      const result = await searchVote({
        page,
        perPage: 10,
        acteurRefUid: acteur.uid,
        positionVote,
        search,
        include: "scrutinRef.dossierRef", 
        codeTypeVote: onlySolennel ? "SPS" : undefined, 
      });
      return result;
    },
    placeholderData: keepPreviousData,
  });

  const data = (result?.data ?? []) as VoteWithDetails[];
  const pagination = result?.pagination;

  const filteredData = React.useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    
    return data.filter((vote) => {
      const titre = vote.scrutinRef?.titre?.toLowerCase() ?? "";
      const numero = vote.scrutinRef?.numero?.toString() ?? "";
      const dossierTitre = vote.scrutinRef?.dossierRef?.titre?.toLowerCase() ?? "";

      return (
        titre.includes(lowerSearch) || 
        numero.includes(lowerSearch) ||
        dossierTitre.includes(lowerSearch)
      );
    });
  }, [data, search]);

  return (
    <Box sx={{ width: "100%" }}>

      <Stack 
        direction={{ xs: "column", md: "row" }} 
        spacing={2} 
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 4 }}
      >
        {/* Champ de recherche */}
        <Input
          placeholder="Rechercher par mots-clés (scrutin, dossier...)"
          onChange={(event) => debouncedSetSearch(event.target.value)}
          startAdornment={<SearchIcon sx={{ mr: 1, color: "text.secondary" }} />}
          fullWidth
          sx={{ 
            bgcolor: "white", 
            px: 2, 
            py: 0.5, 
            borderRadius: 1,
            borderBottom: "none",
            flexGrow: 1
          }}
          disableUnderline
        />
        
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Menu déroulant Position */}
          <Select
            value={positionVote}
            onChange={(event) => {
              setPositionVote(event.target.value);
              setPage(1);
            }}
            displayEmpty
            sx={{ minWidth: 160, bgcolor: "white", borderRadius: 1 }}
            variant="outlined"
            size="small"
          >
            <MenuItem value="">Tous les votes</MenuItem>
            {positionsVotePossible.map((position) => (
              <MenuItem key={position} value={position} sx={{ textTransform: "capitalize" }}>
                {position}
              </MenuItem>
            ))}
          </Select>

          {/* Switch Solennels */}
          <Box sx={{ bgcolor: "white", borderRadius: 1, px: 1, height: 40, border: "1px solid #c4c4c4", display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={onlySolennel} 
                  onChange={(e) => {
                    setOnlySolennel(e.target.checked);
                    setPage(1);
                  }}
                  size="small"
                />
              }
              label={
                <Typography variant="body2" sx={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                  Solennels
                </Typography>
              }
              sx={{ m: 0, mr: 1 }}
            />
          </Box>
        </Stack>
      </Stack>
      
      <Stack spacing={2} sx={{ mt: 3 }}>
        {/* Message si vide */}
        {filteredData.length === 0 && !isPending && (
            <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                <Typography>Aucun vote ne correspond à vos critères.</Typography>
                {search && <Typography variant="caption">Essayez d'autres mots-clés.</Typography>}
            </Box>
        )}
        
        {filteredData.map((vote) => {
          if (!vote.scrutinRef) return null;
          return (
            <DeputeVoteCard 
              key={vote.id} 
              vote={vote} 
              scrutin={vote.scrutinRef} 
            />
          );
        })}
      </Stack>
      
       <Pagination
        {...pagination}
        page={page}
        setPage={setPage}
        isPending={isPending}
      />
    </Box>
  );
}