"use client";

import * as React from "react";
import {
  Box,
  Typography,
  MenuItem,
  ListSubheader,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
  Tooltip,
  IconButton,
} from "@mui/material";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AmendementCard from "@/components/folders/AmendementCard";
import { normalizeDivisionKey, type ArticleEntry } from "@/data/getDocumentSommaire";
import type { AlineaData } from "@/data/getArticleContent";
import type { DocOption } from "./page";
import type { Amendement } from "@prisma/client";

// ── Types ────────────────────────────────────────────────────────────────────

type RawAmendement = Amendement & {
  identifiantDivision?: string | null;
  divisionArticleAdditionnel?: string | null;
  acteurRefUid?: string | null;
};

// Élément navigable de la liseuse : un article du sommaire, ou la rubrique
// « Autres amendements » (amendements non rattachés à un article précis).
type NavItem = {
  selKey: string;
  entry: ArticleEntry;
  amends: RawAmendement[];
  isUncat: boolean;
};

const UNCAT_KEY = "__uncat__";

// ── Couleurs de statut ───────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  "Adopté": "#2e7d32",
  "Rejeté": "#c62828",
  "Tombé": "#bf360c",
  "Irrecevable": "#b71c1c",
  "Irrecevable 40": "#b71c1c",
};

// Regroupement sémantique pour les pastilles compactes : on agrège tous les
// statuts « non adoptés » (rejeté / tombé / irrecevable…) en une seule couleur,
// car plusieurs nuances de rouge/orange côte à côte sont indistinguables.
const STATUS_BUCKETS: { key: string; label: string; color: string; statuses: string[] }[] = [
  { key: "adopte", label: "Adopté", color: "#2e7d32", statuses: ["Adopté"] },
  {
    key: "rejete",
    label: "Non adopté",
    color: "#c62828",
    statuses: ["Rejeté", "Tombé", "Irrecevable", "Irrecevable 40"],
  },
];

// Ordre d'affichage préféré des statuts dans la barre de filtres
const STATUS_ORDER = [
  "Adopté",
  "Rejeté",
  "Tombé",
  "Irrecevable",
  "Irrecevable 40",
  "Non soutenu",
  "Retiré",
  "En cours",
];

function statusKey(a: RawAmendement): string {
  return a.sortAmendement ?? "En cours";
}

function isGouvernement(a: RawAmendement): boolean {
  return a.typeAuteur === "Gouvernement";
}

function statusColor(status: string): string {
  // Bleu-gris pour les statuts non définitifs (en cours, déposé, en traitement…)
  return STATUS_COLOR[status] ?? "#78909c";
}

function sortCountByStatus(amends: RawAmendement[]) {
  const counts: Record<string, number> = {};
  for (const a of amends) {
    const k = statusKey(a);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return counts;
}

// ── En-tête de colonne (sticky) ──────────────────────────────────────────────

function ColumnHeader({
  label,
  subtitle,
  icon,
  bg = "grey.100",
}: {
  label: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  bg?: string;
}) {
  return (
    <Box
      sx={{
        position: { md: "sticky" },
        top: 0,
        zIndex: 2,
        bgcolor: bg,
        px: 2.5,
        py: 1,
        borderBottom: "1px solid",
        borderColor: "grey.200",
        display: "flex",
        alignItems: subtitle ? "flex-start" : "center",
        gap: 0.75,
      }}
    >
      {icon && (
        <Box sx={{ mt: subtitle ? "2px" : 0 }}>{icon}</Box>
      )}
      <Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: "text.secondary",
            fontSize: "0.64rem",
            display: "block",
          }}
        >
          {label}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{ fontSize: "0.6rem", color: "text.disabled", lineHeight: 1.3, display: "block" }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Texte de l'article avec alinéas numérotés ────────────────────────────────

function AlineaPanel({
  alineas,
  loading,
  hasDoc,
}: {
  alineas: AlineaData[] | null;
  loading: boolean;
  hasDoc: boolean;
}) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 3 }}>
        <CircularProgress size={14} />
        <Typography variant="caption" color="text.secondary">
          Chargement du texte…
        </Typography>
      </Box>
    );
  }

  if (!hasDoc || alineas === null) {
    return (
      <Typography
        variant="body2"
        color="text.disabled"
        sx={{ p: 2.5, fontStyle: "italic", fontSize: "0.8rem" }}
      >
        Texte non disponible pour cette version
      </Typography>
    );
  }

  if (alineas.length === 0) {
    return (
      <Typography
        variant="body2"
        color="text.disabled"
        sx={{ p: 2.5, fontStyle: "italic", fontSize: "0.8rem" }}
      >
        Texte vide
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 2.5 }}>
      {alineas.map((al, i) => {
        if (al.alineaNumber !== null) {
          return (
            <Box key={i} sx={{ display: "flex", gap: 1.5, mb: 1.25, alignItems: "flex-start" }}>
              {/* cercle numéroté */}
              <Box
                sx={{
                  minWidth: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "1.5px solid",
                  borderColor: "grey.300",
                  bgcolor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  color: "text.secondary",
                  flexShrink: 0,
                  mt: "2px",
                  lineHeight: 1,
                }}
              >
                {al.alineaNumber}
              </Box>
              <Typography
                variant="body2"
                component="div"
                sx={{
                  lineHeight: 1.75,
                  fontSize: "0.9rem",
                  color: "text.primary",
                  "& a": { color: "primary.main", textDecorationColor: "rgba(0,0,0,0.2)" },
                }}
                dangerouslySetInnerHTML={{ __html: al.html }}
              />
            </Box>
          );
        }

        // En-tête (sous-section, titre…)
        const text = al.html.replace(/<[^>]+>/g, "").trim();
        return (
          <Typography
            key={i}
            sx={{
              display: "block",
              mt: 2,
              mb: 0.75,
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {text}
          </Typography>
        );
      })}
    </Box>
  );
}

// ── Liste d'amendements d'un article ─────────────────────────────────────────

function AmendList({ amendments }: { amendments: RawAmendement[] }) {
  const regular = amendments.filter((a) => a.divisionArticleAdditionnel !== "true");
  const additional = amendments.filter((a) => a.divisionArticleAdditionnel === "true");

  return (
    <Box>
      {regular.map((a) => (
        <AmendementCard key={a.uid} amendement={a} acteurUid={a.acteurRefUid ?? null} />
      ))}
      {additional.length > 0 && (
        <>
          <Divider />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 2.5, py: 0.75, display: "block", fontStyle: "italic" }}
          >
            Articles additionnels après cet article
          </Typography>
          {additional.map((a) => (
            <AmendementCard key={a.uid} amendement={a} acteurUid={a.acteurRefUid ?? null} />
          ))}
        </>
      )}
    </Box>
  );
}

// ── Pastilles de statut compactes ────────────────────────────────────────────

function StatusDots({ counts }: { counts: Record<string, number> }) {
  const buckets = STATUS_BUCKETS.map((b) => {
    let total = 0;
    const detail: string[] = [];
    for (const s of b.statuses) {
      const n = counts[s];
      if (n) {
        total += n;
        detail.push(`${n} ${s.toLowerCase()}`);
      }
    }
    return { ...b, total, detail };
  }).filter((b) => b.total > 0);

  if (buckets.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {buckets.map((b) => (
        <Tooltip
          key={b.key}
          arrow
          title={b.detail.length > 1 ? b.detail.join(" · ") : b.label}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4, cursor: "default" }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: b.color,
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontSize: "0.68rem", fontWeight: 600, color: "text.secondary" }}
            >
              {b.total}
            </Typography>
          </Box>
        </Tooltip>
      ))}
    </Stack>
  );
}

// ── Navigation latérale (sommaire) ───────────────────────────────────────────

type SidebarItem =
  | { kind: "division"; key: string; label: string }
  | { kind: "article"; navItem: NavItem };

function SidebarRow({
  navItem,
  selected,
  onSelect,
}: {
  navItem: NavItem;
  selected: boolean;
  onSelect: (k: string) => void;
}) {
  const { entry, amends, selKey } = navItem;
  const hasAmends = amends.length > 0;
  const counts = sortCountByStatus(amends);
  const dots = StatusDots({ counts });

  return (
    <Box
      component="button"
      onClick={() => onSelect(selKey)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: "100%",
        textAlign: "left",
        border: "none",
        borderLeft: "3px solid",
        borderColor: selected ? "text.primary" : "transparent",
        cursor: "pointer",
        px: 1.25,
        py: 0.85,
        borderRadius: "6px",
        mb: 0.25,
        bgcolor: selected ? "rgba(0,0,0,0.05)" : "transparent",
        transition: "background-color 0.12s",
        "&:hover": { bgcolor: selected ? "rgba(0,0,0,0.07)" : "grey.100" },
      }}
    >
      <Typography
        variant="body2"
        noWrap
        sx={{
          flex: 1,
          minWidth: 0,
          fontWeight: selected ? 700 : 500,
          color: hasAmends || selected ? "text.primary" : "text.secondary",
          fontSize: "0.82rem",
        }}
      >
        {entry.label}
      </Typography>
      {dots ? (
        <Box sx={{ flexShrink: 0 }}>{dots}</Box>
      ) : hasAmends ? (
        <Typography variant="caption" sx={{ flexShrink: 0, color: "text.secondary", fontWeight: 600 }}>
          {amends.length}
        </Typography>
      ) : null}
    </Box>
  );
}

function SidebarNav({
  items,
  effectiveKey,
  onSelect,
}: {
  items: SidebarItem[];
  effectiveKey: string | null;
  onSelect: (k: string) => void;
}) {
  return (
    <Box
      sx={{
        position: { md: "sticky" },
        top: 16,
        maxHeight: { md: "calc(100vh - 130px)" },
        overflowY: { md: "auto" },
        pr: 1,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          px: 1.25,
          mb: 1,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: "text.secondary",
          fontSize: "0.64rem",
        }}
      >
        Sommaire
      </Typography>

      {items.map((it) =>
        it.kind === "division" ? (
          <Typography
            key={it.key}
            variant="overline"
            sx={{
              display: "block",
              mt: 1.5,
              mb: 0.5,
              px: 1.25,
              color: "text.disabled",
              letterSpacing: "0.1em",
              fontSize: "0.62rem",
              fontWeight: 700,
            }}
          >
            {it.label}
          </Typography>
        ) : (
          <SidebarRow
            key={it.navItem.selKey}
            navItem={it.navItem}
            selected={it.navItem.selKey === effectiveKey}
            onSelect={onSelect}
          />
        ),
      )}
    </Box>
  );
}

// ── Vue d'un article : texte (gauche) + amendements (droite) ─────────────────

const PANEL_MAX_H = { md: "calc(100vh - 230px)" };

function ArticleView({
  item,
  docUid,
  navItems,
  effectiveKey,
  onSelect,
  onPrev,
  onNext,
  index,
  total,
  examinateurLabel,
}: {
  item: NavItem;
  docUid: string | null;
  navItems: NavItem[];
  effectiveKey: string;
  onSelect: (k: string) => void;
  onPrev: () => void;
  onNext: () => void;
  index: number;
  total: number;
  examinateurLabel?: string | null;
}) {
  const [alineas, setAlineas] = React.useState<AlineaData[] | null | undefined>(undefined);
  const [contentLoading, setContentLoading] = React.useState(false);

  React.useEffect(() => {
    if (item.isUncat || !docUid) {
      setAlineas(null);
      setContentLoading(false);
      return;
    }
    let active = true;
    const url = `/api/liseuse/article-content?uid=${encodeURIComponent(docUid)}&key=${encodeURIComponent(item.entry.key)}`;

    const load = async () => {
      setContentLoading(true);
      setAlineas(undefined);
      let result: AlineaData[] | null = null;
      // Une nouvelle tentative si null : l'indisponibilité est souvent transitoire.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const r = await fetch(url);
          if (r.ok) {
            const d = (await r.json()) as { alineas: AlineaData[] | null };
            result = d.alineas;
          }
        } catch {
          result = null;
        }
        if (result !== null) break;
        if (attempt === 0) await new Promise((res) => setTimeout(res, 500));
      }
      if (active) {
        setAlineas(result);
        setContentLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [docUid, item.entry.key, item.isUncat]);

  const amendments = item.amends;

  return (
    <Box>
      {/* En-tête : navigation précédent / suivant */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <IconButton onClick={onPrev} disabled={index <= 0} size="small" aria-label="Article précédent">
          <ChevronLeftIcon />
        </IconButton>
        <Box sx={{ flex: 1, textAlign: "center", minWidth: 0 }}>
          <Typography variant="h6" noWrap sx={{ fontSize: "1.05rem", fontWeight: 700 }}>
            {item.entry.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {index + 1} / {total}
          </Typography>
        </Box>
        <IconButton
          onClick={onNext}
          disabled={index >= total - 1}
          size="small"
          aria-label="Article suivant"
        >
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Sélecteur d'article (mobile uniquement — la sidebar fait office de nav en desktop) */}
      <TextField
        select
        fullWidth
        size="small"
        value={effectiveKey}
        onChange={(e) => onSelect(e.target.value)}
        sx={{ display: { xs: "block", md: "none" }, mb: 2 }}
      >
        {navItems.map((n) => (
          <MenuItem key={n.selKey} value={n.selKey}>
            {n.entry.label}
            {n.amends.length > 0 ? ` · ${n.amends.length}` : ""}
          </MenuItem>
        ))}
      </TextField>

      {/* Corps : texte | amendements */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        {/* Texte */}
        <Box
          sx={{
            flex: { md: "0 0 44%" },
            bgcolor: "grey.50",
            borderBottom: { xs: "1px solid #CCC", md: "none" },
            borderRight: { md: "1px solid #CCC" },
            overflowY: { md: "auto" },
            maxHeight: PANEL_MAX_H,
          }}
        >
          <ColumnHeader
            label="Texte de l'article"
            bg="grey.100"
            icon={<ArticleOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />}
          />
          {item.isUncat ? (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ p: 2.5, fontStyle: "italic", fontSize: "0.8rem" }}
            >
              Amendements non rattachés à un article précis (titre, annexes…).
            </Typography>
          ) : (
            <AlineaPanel alineas={alineas ?? null} loading={contentLoading} hasDoc={!!docUid} />
          )}
        </Box>

        {/* Amendements */}
        <Box sx={{ flex: 1, overflowY: { md: "auto" }, maxHeight: PANEL_MAX_H }}>
          <ColumnHeader
            label={`${amendments.length} amendement${amendments.length > 1 ? "s" : ""}`}
            subtitle={examinateurLabel}
            bg="white"
          />
          {amendments.length > 0 ? (
            <AmendList amendments={amendments} />
          ) : (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{ p: 2.5, fontStyle: "italic", fontSize: "0.8rem" }}
            >
              Aucun amendement déposé sur cet article.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ── LiseuseClient ─────────────────────────────────────────────────────────────

export default function LiseuseClient({
  dossierUid: _dossierUid,
  documents,
  defaultDocUid,
  initialSommaire,
}: {
  dossierUid: string;
  documents: DocOption[];
  defaultDocUid: string | null;
  initialSommaire: ArticleEntry[] | null;
}) {
  const [selectedDocUid, setSelectedDocUid] = React.useState(defaultDocUid ?? "");
  const [sommaire, setSommaire] = React.useState<ArticleEntry[] | null>(initialSommaire);
  const [amendments, setAmendments] = React.useState<RawAmendement[] | null>(null);
  const [amendTotal, setAmendTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeStatuses, setActiveStatuses] = React.useState<Set<string>>(new Set());
  const [govOnly, setGovOnly] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState<string | null>(null);
  const loadIdRef = React.useRef(0);

  const loadAmendments = React.useCallback(async (docUid: string) => {
    if (!docUid) return;
    const myId = ++loadIdRef.current;

    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setAmendments(null);
    setAmendTotal(0);
    setActiveStatuses(new Set());
    setGovOnly(false);

    try {
      // Page 1 — 500 items
      const res = await fetch(
        `/api/liseuse/amendements?documentRefUid=${encodeURIComponent(docUid)}&perPage=500&page=1`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: RawAmendement[]; total: number };

      if (myId !== loadIdRef.current) return;
      setAmendments(data.items);
      setAmendTotal(data.total);
      setLoading(false);

      // Pages suivantes en parallèle si nécessaire
      if (data.total > data.items.length && data.items.length >= 500) {
        setLoadingMore(true);
        const nbExtra = Math.ceil((data.total - 500) / 500);
        const extraPages = await Promise.all(
          Array.from({ length: nbExtra }, (_, i) =>
            fetch(
              `/api/liseuse/amendements?documentRefUid=${encodeURIComponent(docUid)}&perPage=500&page=${i + 2}`,
            )
              .then((r) => (r.ok ? (r.json() as Promise<{ items: RawAmendement[] }>) : { items: [] as RawAmendement[] }))
              .then((d) => d.items ?? [])
              .catch(() => [] as RawAmendement[]),
          ),
        );
        if (myId !== loadIdRef.current) return;
        setAmendments((prev) => [...(prev ?? []), ...extraPages.flat()]);
        setLoadingMore(false);
      }
    } catch {
      if (myId !== loadIdRef.current) return;
      setError("Impossible de charger les amendements.");
      setLoading(false);
    }
  }, []);

  const handleDocChange = async (uid: string) => {
    setSelectedDocUid(uid);
    setSommaire(null);
    setSelectedKey(null);
    void loadAmendments(uid);
    try {
      const res = await fetch(`/api/liseuse/sommaire?uid=${encodeURIComponent(uid)}`);
      if (res.ok) {
        const data = (await res.json()) as { articles: ArticleEntry[] | null };
        setSommaire(data.articles);
      }
    } catch {
      setSommaire(null);
    }
  };

  React.useEffect(() => {
    if (defaultDocUid) void loadAmendments(defaultDocUid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Options de filtre par statut, calculées sur l'ensemble complet des amendements.
  const statusOptions = React.useMemo(() => {
    if (!amendments) return [];
    const counts: Record<string, number> = {};
    for (const a of amendments) {
      const k = statusKey(a);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([ka, va], [kb, vb]) => {
        const ia = STATUS_ORDER.indexOf(ka);
        const ib = STATUS_ORDER.indexOf(kb);
        const oa = ia === -1 ? 99 : ia;
        const ob = ib === -1 ? 99 : ib;
        if (oa !== ob) return oa - ob;
        return vb - va;
      })
      .map(([status, count]) => ({ status, count, color: statusColor(status) }));
  }, [amendments]);

  const filterActive = activeStatuses.size > 0 || govOnly;

  // Nombre d'amendements gouvernementaux (pour la pastille de filtre)
  const govCount = React.useMemo(
    () => (amendments ? amendments.filter(isGouvernement).length : 0),
    [amendments],
  );

  const toggleStatus = React.useCallback((status: string) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);

  const resetFilters = React.useCallback(() => {
    setActiveStatuses(new Set());
    setGovOnly(false);
  }, []);

  // Amendements après application des filtres (statut + gouvernement)
  const filteredAmendments = React.useMemo(() => {
    if (!amendments) return null;
    let res = amendments;
    if (activeStatuses.size > 0) res = res.filter((a) => activeStatuses.has(statusKey(a)));
    if (govOnly) res = res.filter(isGouvernement);
    return res;
  }, [amendments, activeStatuses, govOnly]);

  // Groupe les amendements (filtrés) par identifiantDivision
  const amendsByKey = React.useMemo(() => {
    if (!filteredAmendments) return null;
    const map = new Map<string, RawAmendement[]>();
    for (const a of filteredAmendments) {
      const raw = a.identifiantDivision;
      const k = raw && raw.trim() ? normalizeDivisionKey(raw) : "__unknown__";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    return map;
  }, [filteredAmendments]);

  const articleEntries = (sommaire ?? []).filter((e) => !e.isDivisionHeader);
  const articleKeys = new Set(articleEntries.map((e) => e.key));
  const uncategorized = amendsByKey
    ? [...amendsByKey.entries()]
        .filter(([k]) => k !== "__unknown__" && !articleKeys.has(k))
        .flatMap(([, v]) => v)
        .concat(amendsByKey.get("__unknown__") ?? [])
    : [];

  // Construit la liste de la sidebar (divisions + articles) en masquant, si un
  // filtre est actif, les articles sans amendement et les divisions orphelines.
  const sidebarItems: SidebarItem[] = [];
  if (sommaire && amendsByKey) {
    let pendingDivision: { key: string; label: string } | null = null;
    sommaire.forEach((entry, i) => {
      if (entry.isDivisionHeader) {
        pendingDivision = { key: `div-${i}`, label: entry.label };
        return;
      }
      const amends = amendsByKey.get(entry.key) ?? [];
      if (filterActive && amends.length === 0) return;
      if (pendingDivision) {
        sidebarItems.push({ kind: "division", ...pendingDivision });
        pendingDivision = null;
      }
      sidebarItems.push({
        kind: "article",
        navItem: { selKey: entry.key, entry, amends, isUncat: false },
      });
    });
  }

  // Rubrique « Autres amendements » en bas de sommaire
  if (uncategorized.length > 0) {
    const uncatEntry: ArticleEntry = {
      label: "Autres amendements",
      key: UNCAT_KEY,
      isDivisionHeader: false,
    };
    sidebarItems.push({
      kind: "article",
      navItem: { selKey: UNCAT_KEY, entry: uncatEntry, amends: uncategorized, isUncat: true },
    });
  }

  // Liste plate des éléments navigables (pour précédent/suivant + sélecteur mobile)
  const navItems: NavItem[] = sidebarItems
    .filter((it): it is Extract<SidebarItem, { kind: "article" }> => it.kind === "article")
    .map((it) => it.navItem);
  const navKeys = navItems.map((n) => n.selKey);

  // Article effectivement affiché : la sélection courante si toujours valide,
  // sinon le premier article qui porte des amendements, sinon le premier.
  const effectiveKey =
    selectedKey && navKeys.includes(selectedKey)
      ? selectedKey
      : navItems.find((n) => n.amends.length > 0)?.selKey ?? navItems[0]?.selKey ?? null;
  const selIndex = effectiveKey ? navKeys.indexOf(effectiveKey) : -1;
  const selectedItem = selIndex >= 0 ? navItems[selIndex] : null;

  // Regroupe les versions par étape de navette pour le sélecteur.
  const docGroups: { label: string; items: DocOption[] }[] = [];
  for (const d of documents) {
    let g = docGroups.find((x) => x.label === d.stageLabel);
    if (!g) {
      g = { label: d.stageLabel, items: [] };
      docGroups.push(g);
    }
    g.items.push(d);
  }
  const selectedDoc = documents.find((d) => d.uid === selectedDocUid);

  // Indique quel organe a proposé les amendements affichés :
  //   typeOrder=0 (texte initial/transmis) → examiné en commission
  //   typeOrder=1 (texte de commission)    → examiné en séance
  const examinateurLabel =
    selectedDoc?.typeOrder === 0
      ? "Proposés en commission"
      : selectedDoc?.typeOrder === 1
        ? "Proposés en séance"
        : null;

  const loadedAmend = amendments?.length ?? 0;
  const shownAmend = filteredAmendments?.length ?? 0;
  const displayedTotal = loadingMore && amendTotal > loadedAmend ? amendTotal : loadedAmend;

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Barre d'outils : statistiques + sélecteur de version */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1.05rem", lineHeight: 1.2 }}>
            Texte &amp; amendements
          </Typography>
          {sommaire && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {articleEntries.length} article{articleEntries.length > 1 ? "s" : ""}
              {loading ? (
                " · chargement des amendements…"
              ) : displayedTotal > 0 && !filterActive ? (
                <>
                  {" · "}
                  <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {displayedTotal.toLocaleString("fr-FR")}
                  </Box>{" "}
                  amendement{displayedTotal > 1 ? "s" : ""}
                  {loadingMore && " (chargement…)"}
                </>
              ) : displayedTotal > 0 && filterActive ? (
                <>
                  {" · "}
                  <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {shownAmend.toLocaleString("fr-FR")}
                  </Box>{" "}
                  sur {loadedAmend.toLocaleString("fr-FR")} amendement
                  {loadedAmend > 1 ? "s" : ""} affiché{shownAmend > 1 ? "s" : ""}
                </>
              ) : null}
            </Typography>
          )}
        </Box>

        {documents.length > 1 && (
          <Box sx={{ flexShrink: 0, width: { xs: "100%", sm: 360 } }}>
          <TextField
            select
            size="small"
            label="Version du texte"
            value={selectedDocUid}
            onChange={(e) => void handleDocChange(e.target.value)}
            sx={{ width: "100%" }}
            SelectProps={{
              MenuProps: { sx: { maxHeight: 460 } },
              // Valeur empilée (label puis étape) pour tenir dans une largeur
              // FIXE (360px) : la géométrie ne dépend pas de la longueur du
              // libellé → pas de saut entre le skeleton de chargement et le
              // rendu réel. Ellipsis en garde-fou si un libellé dépasse.
              renderValue: () =>
                selectedDoc ? (
                  <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.25, py: 0.25 }}>
                    <Box
                      component="span"
                      sx={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {selectedDoc.label}
                    </Box>
                    <Box
                      component="span"
                      sx={{ color: "text.secondary", fontSize: "0.75rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                      {selectedDoc.stageLabel}
                    </Box>
                  </Box>
                ) : (
                  ""
                ),
            }}
          >
            {docGroups.flatMap((g, gi) => {
              const nodes: React.ReactNode[] = [];
              if (gi > 0) {
                nodes.push(
                  <ListSubheader
                    key={`navette-${gi}`}
                    disableSticky
                    sx={{
                      bgcolor: "transparent",
                      lineHeight: 2,
                      py: 0.5,
                      borderTop: "1px dashed",
                      borderColor: "divider",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.75,
                        color: "text.disabled",
                        fontStyle: "italic",
                        fontWeight: 500,
                        fontSize: "0.72rem",
                      }}
                    >
                      <SwapVertIcon sx={{ fontSize: 15 }} />
                      Navette — examen au Sénat (non disponible)
                    </Box>
                  </ListSubheader>,
                );
              }
              nodes.push(
                <ListSubheader
                  key={`stage-${gi}`}
                  disableSticky
                  sx={{
                    bgcolor: "grey.50",
                    lineHeight: 2.2,
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "text.secondary",
                  }}
                >
                  {g.label}
                </ListSubheader>,
              );
              for (const d of g.items) {
                nodes.push(
                  <MenuItem key={d.uid} value={d.uid} sx={{ pl: 3, py: 0.75 }}>
                    {d.label}
                  </MenuItem>,
                );
              }
              return nodes;
            })}
          </TextField>
          {examinateurLabel && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: "block", textAlign: "right", mt: 0.5, fontSize: "0.7rem" }}
            >
              {examinateurLabel}
            </Typography>
          )}
          </Box>
        )}
      </Box>

      {/* Barre de filtres par statut */}
      {!loading && sommaire && (statusOptions.length > 1 || govCount > 0) && (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 3 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "text.secondary",
              fontSize: "0.64rem",
              mr: 0.5,
            }}
          >
            Filtrer
          </Typography>

          {govCount > 0 && (() => {
            const GOV_COLOR = "#5e35b1";
            return (
              <>
                <Chip
                  size="small"
                  onClick={() => setGovOnly((v) => !v)}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: GOV_COLOR }} />
                      <span>Gouvernement</span>
                      <Box component="span" sx={{ fontWeight: 700, opacity: 0.7 }}>
                        {govCount}
                      </Box>
                    </Box>
                  }
                  sx={{
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    height: 26,
                    border: "1px solid",
                    borderColor: govOnly ? GOV_COLOR : "grey.300",
                    bgcolor: govOnly ? `${GOV_COLOR}14` : "transparent",
                    color: govOnly ? GOV_COLOR : "text.secondary",
                    "& .MuiChip-label": { px: 1 },
                    "&:hover": { bgcolor: govOnly ? `${GOV_COLOR}22` : "grey.100" },
                  }}
                />
                {statusOptions.length > 1 && (
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.25 }} />
                )}
              </>
            );
          })()}

          {statusOptions.map(({ status, count, color }) => {
            const active = activeStatuses.has(status);
            return (
              <Chip
                key={status}
                size="small"
                onClick={() => toggleStatus(status)}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
                    <span>{status}</span>
                    <Box component="span" sx={{ fontWeight: 700, opacity: 0.7 }}>
                      {count}
                    </Box>
                  </Box>
                }
                sx={{
                  cursor: "pointer",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  height: 26,
                  border: "1px solid",
                  borderColor: active ? color : "grey.300",
                  bgcolor: active ? `${color}14` : "transparent",
                  color: active ? color : "text.secondary",
                  "& .MuiChip-label": { px: 1 },
                  "&:hover": { bgcolor: active ? `${color}22` : "grey.100" },
                }}
              />
            );
          })}

          {filterActive && (
            <Box
              component="button"
              onClick={resetFilters}
              sx={{
                ml: 0.5,
                border: "none",
                bgcolor: "transparent",
                cursor: "pointer",
                color: "primary.main",
                textDecoration: "underline",
                fontSize: "0.72rem",
                p: 0,
              }}
            >
              Réinitialiser
            </Box>
          )}
        </Box>
      )}

      {/* Chargement initial */}
      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 4 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Chargement des amendements…
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Pas de sommaire */}
      {!loading && amendments && !sommaire && (
        <Alert severity="info" sx={{ mb: 2 }}>
          La structure article par article n&apos;est pas disponible pour cette version.
        </Alert>
      )}

      {/* Vue liseuse : sommaire (gauche) + article (droite) */}
      {!loading && sommaire && amendsByKey && (
        navItems.length > 0 && selectedItem ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: { md: 3 },
              alignItems: "flex-start",
            }}
          >
            <Box
              sx={{
                width: { md: 290 },
                flexShrink: 0,
                display: { xs: "none", md: "block" },
              }}
            >
              <SidebarNav items={sidebarItems} effectiveKey={effectiveKey} onSelect={setSelectedKey} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
              <ArticleView
                item={selectedItem}
                docUid={selectedDocUid || null}
                navItems={navItems}
                effectiveKey={effectiveKey ?? ""}
                onSelect={setSelectedKey}
                onPrev={() => {
                  if (selIndex > 0) setSelectedKey(navKeys[selIndex - 1]);
                }}
                onNext={() => {
                  if (selIndex < navKeys.length - 1) setSelectedKey(navKeys[selIndex + 1]);
                }}
                index={selIndex}
                total={navItems.length}
                examinateurLabel={examinateurLabel}
              />
            </Box>
          </Box>
        ) : filterActive ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Aucun amendement ne correspond au filtre sélectionné.
            </Typography>
            <Box
              component="button"
              onClick={resetFilters}
              sx={{
                mt: 1,
                border: "none",
                bgcolor: "transparent",
                cursor: "pointer",
                color: "primary.main",
                textDecoration: "underline",
                fontSize: "0.8rem",
              }}
            >
              Réinitialiser les filtres
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Aucun amendement disponible pour cette version du texte.
          </Typography>
        )
      )}

      {/* Fallback plat (pas de sommaire) */}
      {!loading && amendments && !sommaire && (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          {amendments.map((a) => (
            <AmendementCard key={a.uid} amendement={a} acteurUid={a.acteurRefUid ?? null} />
          ))}
        </Box>
      )}

      {/* État vide (pas de sommaire et pas d'amendements) */}
      {!loading && amendments && !sommaire && amendments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          Aucun amendement disponible pour cette version du texte.
        </Typography>
      )}
    </Box>
  );
}
