"use client";
import React from "react";

import { Vote, Scrutin } from "@prisma/client";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { searchVote } from "@/data/searchVote";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import SearchIcon from "@mui/icons-material/Search";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";

import debounce from "@/utils/debounce";
import Pagination from "@/components/Pagination";

function colors(positionVote: string) {
  switch (positionVote) {
    case "pour":
      return "green";
    case "contre":
      return "red";
    case "abstention":
      return "orange";
    default:
      "black";
  }
}
const positionsVotePossible = ["pour", "contre", "nonVotant", "abstention"];

export default function Votes() {
  const { slug } = useParams<{ slug: string }>();

  const { data: acteur } = useQuery({
    queryKey: ["acteur", slug],

    queryFn: async () => {
      const data = await getActeurBySlug(slug);
      return data;
    },
  });

  const [search, setSearch] = React.useState("");
  const [positionVote, setPositionVote] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data: result, isPending } = useQuery({
    queryKey: ["votes", page, acteur?.uid, positionVote, search],

    queryFn: async () => {
      if (!acteur?.uid) {
        return null;
      }
      const result = await searchVote({
        page,
        acteurRefUid: acteur?.uid,
        positionVote,
        search,
        include: "scrutinRef",
      });
      return result;
    },

    placeholderData: keepPreviousData,
  });

  const data = (result?.data ?? []) as (Vote & { scrutinRef: Scrutin })[];
  const pagination = result?.pagination;
  const hasNextPage = pagination ? page < pagination.totalPage : false;
  const debouncedSetSearch = React.useMemo(
    () =>
      debounce((newSearch) => {
        setSearch(newSearch);
        setPage(1);
      }, 500),
    []
  );

  if (acteur?.uid) {
    return (
      <div>
        <Stack direction="row">
          <Input
            disabled
            onChange={(event) => debouncedSetSearch(event.target.value)}
            startAdornment={<SearchIcon />}
          />
          <Select
            value={positionVote}
            onChange={(event) => {
              setPositionVote(event.target.value);
              setPage(1);
            }}
            label="Status"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">-</MenuItem>
            {positionsVotePossible.map((position) => (
              <MenuItem key={position} value={position}>
                {position}
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
        {data?.map((vote) => {
          const { uid, positionVote, parDelegation, scrutinRef } = vote;

          const titrePrincipal = scrutinRef?.titre ?? "Titre non trouvé";

          return (
            <Stack
              key={uid}
              direction="row"
              justifyContent="space-between"
              flexWrap="wrap"
              sx={{ width: "100%", mb: 1 }}
            >
              <Typography fontWeight="light">{titrePrincipal}</Typography>
              {positionVote && (
                <Typography sx={{ color: colors(positionVote) }}>
                  {positionVote}{" "}
                  {parDelegation && (
                    <Typography fontWeight="light" component="span">
                      par délégation
                    </Typography>
                  )}
                </Typography>
              )}
            </Stack>
          );
        })}
      </div>
    );
  }
}
