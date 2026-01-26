import * as React from "react";
import { MenuItem } from "@mui/material";
import TextField from "@mui/material/TextField";
import { sortAmendementPossible } from "@/data/searchAmendement";
import { useQueries, useQuery } from "@tanstack/react-query";
import { searchDocument } from "@/data/searchDocument";
import { useQueryState } from "nuqs";
import { getDocument } from "@/data/getDocument";

type FilterProps = {
  dossierUid: string;
};

export const Filter = (props: FilterProps) => {
  const { dossierUid } = props;

  const [search] = useQueryState("search");
  // const [numero, handleNumero] = useQueryState("numero");
  const [document, handleDocument] = useQueryState("document");
  // const [depute, handleDepute] = useQueryState("depute");
  const [status, handleStatus] = useQueryState("status");

  const { data: documentsResult, isPending: dossierPending } = useQuery({
    queryKey: ["documents", dossierUid],

    queryFn: async () => {
      const data = await searchDocument({
        dossierRefUid: dossierUid,
        perPage: 50,
        // include: "_count.amendements", // Does work on single documents but not multiple ones
      });
      return data;
    },
  });

  const documents = documentsResult?.data ?? [];

  const documentAmendementsCount = useQueries({
    queries: documents.map((document) => {
      return {
        queryKey: ["documentAmendements", document.uid],
        queryFn: () => getDocument(document.uid, ["_count.amendements"]),
      };
    }),
  });

  const countMapping = React.useMemo(() => {
    const mapping: Record<string, number> = {};
    documentAmendementsCount.forEach((result) => {
      if (result.data?._count.amendements != null) {
        mapping[result.data.uid] = result.data._count.amendements;
      }
    });
    return mapping;
  }, [documentAmendementsCount]);

  // const deputes = React.useMemo(() => {
  //   const seenIds = new Set();
  //   return documents
  //     .filter((amendement) => amendement != null)
  //     .filter(({ acteurRef }) => {
  //       if (!acteurRef) {
  //         return false;
  //       }

  //       const seen = seenIds.has(acteurRef.uid);
  //       if (!seen) {
  //         seenIds.add(acteurRef.uid);
  //       }

  //       return !seen;
  //     })

  //     .map(({ acteurRef }) => {
  //       const { uid, prenom, nom } = acteurRef!;
  //       return { uid, prenom, nom };
  //     });
  // }, [dossier]);

  return (
    <React.Fragment>
      {/* <TextField
        size="small"
        label="Numero"
        variant="outlined"
        type="numeric"
        value={numero}
        onChange={(event) => {
          handleNumero(event.target.value);
        }}
      /> */}
      <TextField
        select
        size="small"
        variant="outlined"
        label="Document"
        value={document ?? ""}
        onChange={(event) => {
          handleDocument(event.target.value);
        }}
      >
        <MenuItem value="">Tout document</MenuItem>
        {documents
          .filter(
            (document) =>
              document !== null &&
              (countMapping[document.uid] == null ||
                countMapping[document.uid] > 0)
          )
          .map((document) => (
            <MenuItem key={document.uid} value={document.uid}>
              {document.chambre}: {document.depotLibelle} (
              {countMapping[document.uid] ? countMapping[document.uid] : "?"})
            </MenuItem>
          ))}
      </TextField>
      {/* <TextField
        select
        size="small"
        variant="outlined"
        label="Auteur"
        value={depute}
        onChange={(event) => {
          handleDepute(event.target.value);
        }}
      >
        <MenuItem value="">Auteur</MenuItem>
        {deputes?.map(({ uid, prenom, nom }) => (
          <MenuItem key={uid} value={uid}>
            {prenom} {nom}
          </MenuItem>
        ))}
      </TextField> */}
      <TextField
        select
        size="small"
        variant="outlined"
        label="Status"
        value={status ?? ""}
        onChange={(event) => {
          handleStatus(event.target.value);
        }}
      >
        <MenuItem value="">-</MenuItem>
        {sortAmendementPossible.map((state) => (
          <MenuItem key={state} value={state}>
            {state}
          </MenuItem>
        ))}
      </TextField>
    </React.Fragment>
  );
};
