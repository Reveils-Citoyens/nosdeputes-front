"use client";

import React from "react";
import { Vote, Scrutin, Acteur, Dossier } from "@prisma/client";
import { searchVote } from "@/data/searchVote";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import debounce from "@/utils/debounce";
import Pagination from "@/components/Pagination";
import { DeputeVoteCard } from "./DeputeVoteCard";
import SearchInput from "@/components/SearchInput";
import { DeputeListSkeleton } from "@/components/navigation/DeputeTabSkeleton";

const positionsVotePossible = ["pour", "contre", "nonVotant", "abstention"];

type VoteWithDetails = Vote & {
  scrutinRef: Scrutin & { dossierRef?: Dossier | null };
};

type VotesClientProps = {
  acteur: Acteur;
};

export default function VotesClient({ acteur }: VotesClientProps) {
  const [value, setValue] = React.useState("");
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
    [],
  );

  const handleSearchChange = (next: string) => {
    setValue(next);
    debouncedSetSearch(next);
  };

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

  const pagination = result?.pagination;

  // La recherche est faite par l'API (scrutins correspondants, puis votes du
  // député) : aucun filtrage supplémentaire ici, il ne verrait que la page
  // affichée et écarterait les correspondances sans accent ou au pluriel.
  const filteredData = (result?.data as VoteWithDetails[] | undefined) ?? [];

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        sx={{ mb: 4 }}
      >
        {/* Champ de recherche */}
        <SearchInput
          value={value}
          onChange={handleSearchChange}
          placeholder="Rechercher par mots-clés (scrutin, dossier…)"
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
              <MenuItem
                key={position}
                value={position}
                sx={{ textTransform: "capitalize" }}
              >
                {position}
              </MenuItem>
            ))}
          </Select>

          {/* Switch Solennels */}
          <Box
            sx={{
              bgcolor: "white",
              borderRadius: 1,
              px: 1,
              height: 40,
              border: "1px solid #c4c4c4",
              display: "flex",
              alignItems: "center",
            }}
          >
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
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}
                >
                  Solennels
                </Typography>
              }
              sx={{ m: 0, mr: 1 }}
            />
          </Box>
        </Stack>
      </Stack>

      <Stack spacing={2} sx={{ mt: 3 }}>
        {isPending && <DeputeListSkeleton variant="votes" showFilters={false} />}
        {/* Message si vide */}
        {filteredData.length === 0 && !isPending && (
          <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
            <Typography>Aucun vote ne correspond à vos critères.</Typography>
            {search && (
              <Typography variant="caption">
                Essayez d&apos;autres mots-clés.
              </Typography>
            )}
          </Box>
        )}

        {filteredData.map((vote) => {
          if (!vote.scrutinRef) return null;
          return (
            <DeputeVoteCard
              key={vote.uid}
              vote={vote}
              scrutin={vote.scrutinRef}
            />
          );
        })}
      </Stack>

      {!isPending && <Pagination
        {...pagination}
        page={page}
        setPage={setPage}
        isPending={isPending}
      />}
    </Box>
  );
}
