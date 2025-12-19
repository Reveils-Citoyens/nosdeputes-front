"use client";

import * as React from "react";
import { Stack } from "@mui/material";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import LabelChip from "../LabelChip";
import { searchDossier } from "@/data/searchDossier";
import { useQueryState } from "nuqs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Pagination from "../Pagination";

export default function DossierList() {
  const [theme] = useQueryState("theme");
  const [search] = useQueryState("search");
  const [codeProcedure] = useQueryState("codeProcedure");

  const [page, setPage] = React.useState(1);

  const pageWithDefault = page ?? 1;
  const searchWithDefault = search ?? "";
  const codeProcedureWithDefault = codeProcedure ?? "";
  const { data: result, isPending } = useQuery({
    queryKey: [
      "dossiers",
      pageWithDefault,
      searchWithDefault,
      codeProcedureWithDefault,
    ],

    queryFn: async () =>
      searchDossier({
        page: pageWithDefault,
        search: searchWithDefault,
        codeProcedure: codeProcedureWithDefault,
      }),
    placeholderData: keepPreviousData,
  });

  const data = result?.data ?? [];
  const pagination = result?.pagination;

  return (
    <div>
      <Pagination
        {...pagination}
        page={page}
        setPage={setPage}
        isPending={isPending}
      />
      <Stack component="ol">
        {data
          .filter((dossier) => theme === "" || dossier.theme === theme)
          .map((dossier) => (
            <Stack
              key={dossier.uid}
              component="li"
              sx={{ m: 2 }}
              gap={1}
              title={dossier.titre || undefined}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ minWidth: 0 }}
              >
                <Typography
                  variant="body1"
                  component={Link}
                  href={`${dossier.legislature}/dossier/${dossier.uid}`}
                  fontWeight="light"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {dossier.titre}
                </Typography>

                {dossier.theme && (
                  <LabelChip
                    label={dossier.theme}
                    size="small"
                    sx={{ ml: 1.5 }}
                  />
                )}
                {dossier.dateDernierActe?.toLocaleDateString()}
              </Stack>
            </Stack>
          ))}
      </Stack>
    </div>
  );
}
