import * as React from "react";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { PaginationMetadata } from "@/data/pagination";
import { LinearProgress, Typography } from "@mui/material";

export interface PaginationProps extends Partial<PaginationMetadata> {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  isPending?: boolean;
}

export default function Pagination(props: PaginationProps) {
  const { page, setPage, totalPage = 1, isPending } = props;

  return (
    <div>
      <Stack
        justifyContent="space-between"
        direction="row"
        alignItems="center"
        mt={2}
      >
        <Button
          disabled={isPending || page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          &lt; page précédente
        </Button>
        <Typography>
          Page {page} sur {totalPage}
        </Typography>
        <Button
          disabled={isPending || page >= totalPage}
          onClick={() => setPage((p) => p + 1)}
        >
          page suivante &gt;
        </Button>
      </Stack>

      {isPending ? (
        <LinearProgress />
      ) : (
        <div style={{ width: "100%", height: 4 }} />
      )}
    </div>
  );
}
