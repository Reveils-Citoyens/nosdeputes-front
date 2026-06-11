"use client";

import * as React from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import SearchDebatCard from "./SearchDebatCard";
import type { DebatSearchResult } from "@/data/searchInterventions";
import { trackEvent } from "@/lib/umami";

const PAGE_SIZE = 5;

export default function DebatsLoadMore({
  query,
  alreadyShown,
  total,
}: {
  query: string;
  alreadyShown: number;
  total: number;
}) {
  const [items, setItems] = React.useState<DebatSearchResult[]>([]);
  const seenUids = React.useRef(new Set<string>());
  // L'aperçu initial occupe la page 1 ; le "charger plus" continue à la page 2.
  const nextPage = React.useRef(2);
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems([]);
    seenUids.current = new Set();
    nextPage.current = 2;
    setDone(false);
  }, [query]);

  const totalShown = alreadyShown + items.length;
  const remaining = Math.max(0, total - totalShown);

  const loadMore = async () => {
    setLoading(true);
    setError(null);
    trackEvent("charger-plus", { section: "recherche-debats" });
    try {
      const params = new URLSearchParams({
        q: query,
        page: String(nextPage.current),
        perPage: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/search/debats?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: DebatSearchResult[]; total: number };

      const fresh = data.items.filter((d) => {
        if (seenUids.current.has(d.uid)) return false;
        seenUids.current.add(d.uid);
        return true;
      });
      nextPage.current += 1;
      if (fresh.length === 0) setDone(true);
      setItems((prev) => [...prev, ...fresh]);
    } catch (e) {
      setError("Erreur de chargement. Réessayer ?");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showButton = !done && remaining > 0;
  if (!showButton && items.length === 0) return null;

  return (
    <>
      {items.length > 0 && (
        <Stack spacing={0}>
          {items.map((d) => (
            <SearchDebatCard key={d.uid} debat={d} />
          ))}
        </Stack>
      )}
      {showButton && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outlined"
            size="small"
            startIcon={loading ? <CircularProgress size={14} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
            sx={{ borderRadius: "20px", textTransform: "none", fontWeight: "bold", px: 2.5 }}
          >
            {loading ? "Chargement…" : "Voir plus d'interventions"}
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
