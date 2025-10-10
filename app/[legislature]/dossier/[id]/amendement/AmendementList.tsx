"use client";
import React from "react";

import Stack from "@mui/material/Stack";

import AmendementCard from "@/components/folders/AmendementCard";
import { Acteur, Amendement, Organe } from "@prisma/client";
import { Button, Typography } from "@mui/material";
import { searchAmendement } from "@/data/searchAmendement";
import { unique } from "@/utils/unique";
import { useQuery } from "@tanstack/react-query";

export default function AmendementsList(props: {
  numero: string;
  documentUid: string;
  deputeUid: string;
  status: string;
  search: string;
}) {
  const { numero, documentUid, deputeUid, status, search } = props;

  const [page, setPage] = React.useState(1);

  React.useEffect(() => {
    setPage(1);
  }, [status, documentUid, deputeUid, search]);

  const { data: amendements, isPending } = useQuery({
    queryKey: ["amendements", status, documentUid, deputeUid, search, page],

    queryFn: async () => {
      if (!documentUid) {
        return [];
      }
      const data = await searchAmendement({
        page,
        perPage: 20,
        sortAmendement: status,
        documentRefUid: documentUid,
        acteurRefUid: deputeUid,
        search,
      });
      return data;
    },
  });

  const { data: nextAmendements, isPending: nextIsPending } = useQuery({
    queryKey: ["amendements", status, documentUid, deputeUid, search, page + 1],

    queryFn: async () => {
      if (!documentUid) {
        return [];
      }
      const data = await searchAmendement({
        page: page + 1,
        perPage: 20,
        sortAmendement: status,
        documentRefUid: documentUid,
        acteurRefUid: deputeUid,
        search,
      });
      return data;
    },
  });

  const showList = !isPending && documentUid;
  return (
    <Stack>
      {/* {searchActivated && (
        // <Typography>
        //   {filteredAmendements.length} correspondent à votre recherche
        // </Typography>
        )} */}
      {!showList && <p>Loading ...</p>}
      {showList &&
        (amendements ?? []).map((amendement) => (
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
