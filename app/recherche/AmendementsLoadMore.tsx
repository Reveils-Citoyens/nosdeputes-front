"use client";

import * as React from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { useSearchParams } from "next/navigation";
import SearchAmendementCard from "./SearchAmendementCard";
import type { AmendementSearchResult } from "@/data/mongo/searchAmendementMongo";

// Item tel que renvoyé par l'API (dates en ISO strings après JSON serialization)
type ApiItem = Omit<AmendementSearchResult, "dateDepot" | "dateSort"> & {
  dateDepot: string | null;
  dateSort: string | null;
};

const PAGE_SIZE = 5;

export default function AmendementsLoadMore({
  query,
  legislature,
  alreadyShown,
  total,
}: {
  query: string;
  legislature: string | null;
  alreadyShown: number;
  total: number;
}) {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") === "date" ? "date" : null;
  const [items, setItems] = React.useState<AmendementSearchResult[]>([]);
  const seenUids = React.useRef(new Set<string>());
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems([]);
    seenUids.current = new Set();
  }, [query, legislature, sort]);

  const totalShown = alreadyShown + items.length;
  const remaining = Math.max(0, total - totalShown);

  const loadMore = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: query,
        skip: String(totalShown),
        limit: String(PAGE_SIZE),
      });
      if (legislature) params.set("legislature", legislature);
      if (sort) params.set("sort", sort);
      const res = await fetch(`/api/search/amendements?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: ApiItem[]; total: number };

      const parsed: AmendementSearchResult[] = data.items
        .map((a) => ({
          ...a,
          dateDepot: a.dateDepot ? new Date(a.dateDepot) : null,
          dateSort: a.dateSort ? new Date(a.dateSort) : null,
        }))
        .filter((a) => {
          if (seenUids.current.has(a.uid)) return false;
          seenUids.current.add(a.uid);
          return true;
        });
      setItems((prev) => [...prev, ...parsed]);
    } catch (e) {
      setError("Erreur de chargement. Réessayer ?");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (remaining === 0 && items.length === 0) return null;

  return (
    <>
      {items.length > 0 && (
        <Stack spacing={0}>
          {items.map((a) => (
            <SearchAmendementCard key={a.uid} amendement={a} />
          ))}
        </Stack>
      )}
      {remaining > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outlined"
            size="small"
            startIcon={
              loading ? (
                <CircularProgress size={14} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 18 }} />
              )
            }
            sx={{
              borderRadius: "20px",
              textTransform: "none",
              fontWeight: "bold",
              px: 2.5,
            }}
          >
            {loading
              ? "Chargement…"
              : `Voir plus d'amendements (${remaining} restant${remaining > 1 ? "s" : ""})`}
          </Button>
        </Box>
      )}
      {error && (
        <Box sx={{ textAlign: "center", color: "error.main", mt: 1, fontSize: "0.85rem" }}>
          {error}
        </Box>
      )}
    </>
  );
}
