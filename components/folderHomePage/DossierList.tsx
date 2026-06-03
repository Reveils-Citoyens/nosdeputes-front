"use client";

import * as React from "react";
import Link from "next/link";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { useQueryState } from "nuqs";
import DossierBadge from "@/components/folders/DossierBadge";
import SearchInput from "@/components/SearchInput";
import debounce from "@/utils/debounce";
import type { DossierSearchResult } from "@/data/mongo/searchDossierParTitre";

const PAGE_SIZE = 20;
const MIN_SEARCH_CHARS = 5;

// ─── Card row (identique à DossiersSection dans /recherche) ──────────────────

function DossierRow({ d }: { d: DossierSearchResult }) {
  return (
    <Link
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
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            sx={{ mt: 0.25 }}
          >
            {d.typeLibelle && (
              <Typography variant="caption" color="text.secondary">
                {d.typeLibelle}
              </Typography>
            )}
            {d.amendementsTotal > 0 && (
              <Typography variant="caption" color="text.secondary">
                · {d.amendementsTotal} amendement
                {d.amendementsTotal > 1 ? "s" : ""}
              </Typography>
            )}
          </Stack>
        </Box>
        <DossierBadge badge={d.badge} />
      </Stack>
    </Link>
  );
}

// ─── DossierList ──────────────────────────────────────────────────────────────

export default function DossierList() {
  const [search, setSearch] = useQueryState("search");
  const [codeProcedure] = useQueryState("codeProcedure");
  const [badge] = useQueryState("badge");
  const [theme] = useQueryState("theme");
  const [sort] = useQueryState("sort");

  const [items, setItems] = React.useState<DossierSearchResult[]>([]);
  const seenUids = React.useRef(new Set<string>());
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Saisie immédiate dans le champ, propagée (debounce) vers le query state `search`.
  const [searchInput, setSearchInput] = React.useState(search ?? "");

  const debouncedSetSearch = React.useMemo(
    () => debounce((next: string) => setSearch(next || null), 300),
    [setSearch]
  );

  const handleSearchChange = (next: string) => {
    setSearchInput(next);
    debouncedSetSearch(next.trim());
  };

  const isSearchMode = (search ?? "").trim().length >= MIN_SEARCH_CHARS;

  // Reset quand les filtres changent
  React.useEffect(() => {
    setItems([]);
    seenUids.current = new Set();
    setTotal(0);
    setLoading(true);
    setError(null);

    const q = (search ?? "").trim();
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), skip: "0" });
    if (codeProcedure) params.set("codeProcedure", codeProcedure);
    if (badge) params.set("badge", badge);
    if (sort) params.set("sort", sort);
    if (theme) params.set("theme", theme);

    let url: string;
    if (q.length >= MIN_SEARCH_CHARS) {
      params.set("q", q);
      url = `/api/search/dossiers?${params}`;
    } else {
      url = `/api/dossiers?${params}`;
    }

    let cancelled = false;
    fetch(url)
      .then((r) => r.json())
      .then((data: { items: DossierSearchResult[]; total: number }) => {
        if (cancelled) return;
        const fresh = data.items.filter((d) => {
          if (seenUids.current.has(d.uid)) return false;
          seenUids.current.add(d.uid);
          return true;
        });
        setItems(fresh);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error(e);
        setError("Impossible de charger les dossiers.");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [search, codeProcedure, badge, theme, sort]);

  const loadMore = async () => {
    setLoading(true);
    setError(null);
    const q = (search ?? "").trim();
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      skip: String(items.length),
    });
    if (codeProcedure) params.set("codeProcedure", codeProcedure);
    if (badge) params.set("badge", badge);
    if (sort) params.set("sort", sort);
    if (theme) params.set("theme", theme);

    let url: string;
    if (q.length >= MIN_SEARCH_CHARS) {
      params.set("q", q);
      url = `/api/search/dossiers?${params}`;
    } else {
      url = `/api/dossiers?${params}`;
    }

    try {
      const res = await fetch(url);
      const data: { items: DossierSearchResult[]; total: number } = await res.json();
      const fresh = data.items.filter((d) => {
        if (seenUids.current.has(d.uid)) return false;
        seenUids.current.add(d.uid);
        return true;
      });
      setItems((prev) => [...prev, ...fresh]);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
      setError("Erreur de chargement. Réessayer ?");
    } finally {
      setLoading(false);
    }
  };

  const remaining = Math.max(0, total - items.length);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* En-tête : titre de section + compteur */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ color: "#1A1A1B" }}>
          {isSearchMode ? "Résultats de recherche" : "Tous les dossiers"}
        </Typography>
        {!loading && total > 0 && (
          <Box
            sx={{
              bgcolor: "grey.100",
              color: "grey.700",
              fontWeight: "bold",
              fontSize: "0.7rem",
              px: 1,
              py: 0.25,
              borderRadius: "6px",
            }}
          >
            {total}
          </Box>
        )}
      </Stack>

      {/* Barre de recherche (remplace le filtre mot-clef du panneau latéral) */}
      <Box sx={{ mb: 2 }}>
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Rechercher un dossier par mot-clé…"
        />
      </Box>

      {/* Hint si saisie trop courte en mode search partiel */}
      {!isSearchMode && (search ?? "").trim().length > 0 && (search ?? "").trim().length < MIN_SEARCH_CHARS && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Saisissez au moins {MIN_SEARCH_CHARS} caractères pour lancer une recherche.
        </Typography>
      )}

      {/* Liste */}
      {items.length > 0 && (
        <Stack spacing={0.5}>
          {items.map((d) => (
            <DossierRow key={d.uid} d={d} />
          ))}
        </Stack>
      )}

      {/* État vide */}
      {!loading && items.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          {isSearchMode
            ? `Aucun dossier trouvé pour « ${(search ?? "").trim()} ».`
            : "Aucun dossier trouvé."}
        </Typography>
      )}

      {/* Loader initial */}
      {loading && items.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {/* Bouton load-more */}
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
    </Box>
  );
}
