"use client";

import * as React from "react";
import { Stack } from "@mui/material";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Link from "next/link";
import LabelChip from "../LabelChip";
import { Dossier } from "@prisma/client";
import { searchDossier } from "@/data/searchDossier";
import { useQueryState } from "nuqs";

const PAGE_SIZE = 10;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DossierList() {
  const [theme] = useQueryState("theme");
  const [search] = useQueryState("search");
  const [codeProcedure] = useQueryState("codeProcedure");

  const [dossiers, setDossiers] = React.useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);

  const fetchMoreDossiers = async () => {
    setIsLoading(true);
    const result = await searchDossier({
      page: currentPage,
      search: search ?? "",
      codeProcedure: codeProcedure ?? "",
    });

    setIsLoading(false);
    if (result) {
      setDossiers((prev) => [...prev, ...result.data]);
      setCurrentPage((prev) => prev + 1);
    }
  };

  React.useEffect(() => {
    let isValid = true;

    setIsLoading(true);
    setCurrentPage(1);
    setDossiers([]);

    async function fetchInitialDossier() {
      await sleep(500); // debounce

      if (!isValid) {
        return;
      }

      const result = await searchDossier({
        page: 1,
        search: search ?? "",
        codeProcedure: codeProcedure ?? "",
      });

      if (isValid && result) {
        setIsLoading(false);
        setDossiers(result.data);
        setCurrentPage(2);
      }
    }
    fetchInitialDossier();

    return () => {
      isValid = false;
    };
  }, [search, theme, codeProcedure]);

  return (
    <div>
      <Stack component="ol">
        {dossiers
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

      <Button
        loading={isLoading}
        onClick={() => fetchMoreDossiers()}
        disabled={isLoading}
      >
        Dossiers suivant
      </Button>
    </div>
  );
}
