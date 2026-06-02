"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import { CComptesCard } from "./CComptesCard";
import type { CCompteResult } from "@/data/mongo/getCComptesParTheme";

const LOAD_MORE_LIMIT = 5;

type Props = {
  initialItems: CCompteResult[];
  total: number;
  themes: string[];
};

export function CComptesListClient({ initialItems, total, themes }: Props) {
  const [items, setItems] = React.useState<CCompteResult[]>(initialItems);
  const [loading, setLoading] = React.useState(false);
  const hasMore = items.length < total;

  const loadMore = async () => {
    setLoading(true);
    const params = new URLSearchParams({ skip: String(items.length), limit: String(LOAD_MORE_LIMIT) });
    themes.forEach((t) => params.append("themes", t));
    try {
      const res = await fetch(`/api/ccomptes?${params}`);
      const { items: more } = await res.json();
      setItems((prev) => [...prev, ...more]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack spacing={2}>
        {items.map((r) => (
          <CComptesCard key={r.id} rapport={r} />
        ))}
      </Stack>

      {hasMore && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: "30px",
              textTransform: "none",
              px: 3,
              borderColor: "grey.400",
              color: "text.secondary",
              "&:hover": { borderColor: "#8B1A1A", color: "#8B1A1A" },
            }}
          >
            {loading && <CircularProgress size={14} sx={{ mr: 1 }} />}
            {loading ? "Chargement…" : `Charger plus (${total - items.length} restant${total - items.length > 1 ? "s" : ""})`}
          </Button>
        </Box>
      )}
    </>
  );
}
