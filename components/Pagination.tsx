import * as React from "react";
import MuiPagination from "@mui/material/Pagination";
import { PaginationMetadata } from "@/data/pagination";
import { Box, LinearProgress } from "@mui/material";

export interface PaginationProps extends Partial<PaginationMetadata> {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  isPending?: boolean;
}

export default function Pagination(props: PaginationProps) {
  const { page, setPage, totalPage = 1, isPending } = props;

  if (totalPage <= 1 && !isPending) return null;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
        <MuiPagination
          count={totalPage}
          page={page}
          onChange={(_, value) => setPage(value)}
          disabled={isPending}
          siblingCount={1}
          boundaryCount={1}
          shape="rounded"
          color="primary"
        />
      </Box>
      {isPending ? (
        <LinearProgress />
      ) : (
        <div style={{ width: "100%", height: 4 }} />
      )}
    </Box>
  );
}
