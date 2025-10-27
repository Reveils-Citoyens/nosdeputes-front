"use client";
import React from "react";

import Stack from "@mui/material/Stack";

import AmendementCard from "@/components/folders/AmendementCard";
import { Button, Typography } from "@mui/material";
import { searchAmendement } from "@/data/searchAmendement";
import { useQuery } from "@tanstack/react-query";
import { useQueryState } from "nuqs";

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

  const { data: amendements, isPending } = useQuery({
    queryKey: [
      "amendements",
      dossierUid,
      status ?? "",
      documentUid ?? "",
      deputeUid ?? "",
      search ?? "",
      page,
    ],

    queryFn: async () => {
      const data = await searchAmendement({
        page,
        perPage: 20,
        dossierUid,
        sortAmendement: status ?? "",
        documentRefUid: documentUid ?? "",
        acteurRefUid: deputeUid ?? "",
        search: search ?? "",
      });
      return data;
    },
  });

  const { data: nextAmendements, isPending: nextIsPending } = useQuery({
    queryKey: [
      "amendements",
      dossierUid,
      status ?? "",
      documentUid ?? "",
      deputeUid ?? "",
      search ?? "",
      page + 1,
    ],

    queryFn: async () => {
      const data = await searchAmendement({
        page: page + 1,
        perPage: 20,
        dossierUid,
        sortAmendement: status ?? "",
        documentRefUid: documentUid ?? "",
        acteurRefUid: deputeUid ?? "",
        search: search ?? "",
      });
      return data;
    },
  });

  return (
    <Stack>
      {/* {searchActivated && (
        // <Typography>
        //   {filteredAmendements.length} correspondent à votre recherche
        // </Typography>
        )} */}
      {isPending && <Typography>Chargement des amendements...</Typography>}
      {(amendements ?? []).map((amendement) => (
        <AmendementCard
          amendement={amendement}
          acteurUid={amendement.acteurRefUid}
          key={amendement.uid}
        />
      ))}

      <Stack
        justifyContent="space-between"
        direction="row"
        alignItems="center"
        my={2}
      >
        <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          &lt; page précédente
        </Button>
        <Button
          disabled={!nextIsPending && nextAmendements?.length === 0}
          onClick={() => setPage((p) => p + 1)}
        >
          page suivante &gt;
        </Button>
      </Stack>
    </Stack>
  );
}
