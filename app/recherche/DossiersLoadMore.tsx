"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { useSearchParams } from "next/navigation";
import DossierBadge from "@/components/folders/DossierBadge";
import type { DossierSearchResult } from "@/data/mongo/searchDossierParTitre";

type ApiItem = DossierSearchResult;

const PAGE_SIZE = 5;

export default function DossiersLoadMore({
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
  const [items, setItems] = React.useState<DossierSearchResult[]>([]);
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
      const res = await fetch(`/api/search/dossiers?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: ApiItem[]; total: number };
      const fresh = data.items.filter((d) => {
        if (seenUids.current.has(d.uid)) return false;
        seenUids.current.add(d.uid);
        return true;
      });
      setItems((prev) => [...prev, ...fresh]);
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
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          {items.map((d) => (
            <Link
              key={d.uid}
              href={`/${d.legislature}/dossier/${d.uid}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 1.25,
                  borderRadius: "10px",
                  "&:hover": { bgcolor: "grey.50" },
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight="bold" noWrap>
                    {d.titre}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.25 }}>
                    {d.typeLibelle && (
                      <Typography variant="caption" color="text.secondary">
                        {d.typeLibelle}
                      </Typography>
                    )}
                    {d.amendementsTotal > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        · {d.amendementsTotal} amendement{d.amendementsTotal > 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <DossierBadge badge={d.badge} />
              </Stack>
            </Link>
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
              : `Voir plus de dossiers (${remaining} restant${remaining > 1 ? "s" : ""})`}
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
