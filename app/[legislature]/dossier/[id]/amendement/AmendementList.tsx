"use client";
import React from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import AmendementCard from "@/components/folders/AmendementCard";
import { Typography } from "@mui/material";
import { searchAmendement } from "@/data/searchAmendement";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";
import Pagination from "@/components/Pagination";

export default function AmendementsList(props: { dossierUid: string }) {
  const { dossierUid } = props;

  const [search] = useQueryState("search");
  const [numero] = useQueryState("numero");
  const [documentUid] = useQueryState("document");
  const [deputeUid] = useQueryState("depute");
  const [status] = useQueryState("status");

  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [status, dossierUid, documentUid, deputeUid, search]);

  const { data: result, isPending } = useQuery({
    queryKey: [
      "amendements",
      dossierUid,
      status ?? "",
      documentUid ?? "",
      deputeUid ?? "",
      search ?? "",
      page,
    ],
    queryFn: () =>
      searchAmendement({
        page,
        perPage: 10,
        dossierUid,
        sortAmendement: status ?? "",
        documentRefUid: documentUid ?? "",
        acteurRefUid: deputeUid ?? "",
        search: search ?? "",
      }),
    placeholderData: keepPreviousData,
  });

  const amendements = result?.data ?? [];
  const pagination = result?.pagination;

  return (
    <Stack>
      {isPending && <Typography>Chargement des amendements...</Typography>}
      <Box>
        {amendements.map((amendement) => (
          <AmendementCard
            amendement={amendement}
            acteurUid={amendement.acteurRefUid}
            key={amendement.uid}
          />
        ))}
      </Box>
      <Pagination
        {...pagination}
        page={page}
        setPage={setPage}
        isPending={isPending}
      />
    </Stack>
  );
}
