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

import SearchIcon from "@mui/icons-material/Search";
import Stack from "@mui/material/Stack";
import Select from "@mui/material/Select";
import Input from "@mui/material/Input";
import MenuItem from "@mui/material/MenuItem";

import debounce from "@/utils/debounce";
import Pagination from "@/components/Pagination";

export default function Amendements() {
  const { slug } = useParams<{ slug: string }>();

  const { data: acteur } = useQuery({
    queryKey: ["acteur", slug],

    queryFn: async () => {
      const data = await getActeurBySlug(slug);
      return data;
    },
  });

  const [search, setSearch] = React.useState("");
  const [sortAmendement, setSortAmendement] = React.useState("");
  const [page, setPage] = React.useState(1);

  const { data: result, isPending } = useQuery({
    queryKey: ["amendements", page, acteur?.uid, sortAmendement, search],

    queryFn: async () => {
      if (!acteur?.uid) {
        return null;
      }
      const data = await searchAmendement({
        page,
        acteurRefUid: acteur?.uid,
        sortAmendement,
        search,
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });

  const data = result?.data ?? [];
  const pagination = result?.pagination;

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
            onChange={(event) => debouncedSetSearch(event.target.value)}
            startAdornment={<SearchIcon />}
            placeholder="Search"
          />
          <Select
            value={sortAmendement}
            onChange={(event) => {
              setSortAmendement(event.target.value);
              setPage(1);
            }}
            label="Status"
            displayEmpty
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">-</MenuItem>
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
              titre={titre}
            />
          );
        })}
      </div>
    );
  }
  return null;
}
