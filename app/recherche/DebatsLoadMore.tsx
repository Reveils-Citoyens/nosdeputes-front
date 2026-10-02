"use client";

import * as React from "react";
import { Box, Button, CircularProgress, Stack } from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import SearchDebatCard from "./SearchDebatCard";
import type { DebatSearchResult } from "@/data/searchInterventions";
import { trackEvent } from "@/lib/umami";

const PAGE_SIZE = 5;

type Reponse = { items: DebatSearchResult[]; total: number };

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

  // Page suivante demandée d'avance : la recherche plein texte de l'API prend
  // de 0,2 à plusieurs secondes, qu'on ne veut pas faire attendre au clic.
  const prechargement = React.useRef<{ query: string; page: number; reponse: Promise<Reponse> } | null>(null);

  const charger = React.useCallback(
    async (page: number): Promise<Reponse> => {
      const params = new URLSearchParams({ q: query, page: String(page), perPage: String(PAGE_SIZE) });
      const res = await fetch(`/api/search/debats?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as Reponse;
    },
    [query]
  );

  const precharger = React.useCallback(
    (page: number) => {
      const reponse = charger(page);
      reponse.catch(() => {}); // un échec sera retenté au clic
      prechargement.current = { query, page, reponse };
    },
    [charger, query]
  );

  React.useEffect(() => {
    setItems([]);
    seenUids.current = new Set();
    nextPage.current = 2;
    setDone(false);
    prechargement.current = null;
    if (total <= alreadyShown) return;
    // Après l'affichage de la page, pour ne pas concurrencer les autres sections.
    const attente = window.setTimeout(() => precharger(2), 1000);
    return () => window.clearTimeout(attente);
  }, [query, total, alreadyShown, precharger]);

  const totalShown = alreadyShown + items.length;
  const remaining = Math.max(0, total - totalShown);

  const loadMore = async () => {
    setLoading(true);
    setError(null);
    trackEvent("charger-plus", { section: "recherche-debats" });
    try {
      const page = nextPage.current;
      const pret = prechargement.current;
      prechargement.current = null;
      const data =
        pret && pret.query === query && pret.page === page
          ? await pret.reponse.catch(() => charger(page))
          : await charger(page);

      const fresh = data.items.filter((d) => {
        if (seenUids.current.has(d.uid)) return false;
        seenUids.current.add(d.uid);
        return true;
      });
      nextPage.current += 1;
      if (fresh.length === 0) setDone(true);
      setItems((prev) => [...prev, ...fresh]);
      if (fresh.length > 0 && totalShown + fresh.length < total) precharger(nextPage.current);
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
