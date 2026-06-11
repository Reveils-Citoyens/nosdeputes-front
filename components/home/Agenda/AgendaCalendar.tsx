"use client";

import React from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Collapse,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import type { ReunionAgenda, ReunionType } from "@/data/getAgendaSemaine";

// ─── Config calendrier ────────────────────────────────────────────────────────
const START_HOUR = 8;
const END_HOUR = 20;
const HOUR_HEIGHT = 64; // px par heure
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => i + START_HOUR
);
const DAY_NAMES_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_NAMES_FULL = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const TYPE_CONFIG: Record<
  ReunionType,
  { label: string; bg: string; border: string; text: string }
> = {
  seance_type: {
    label: "Séance plénière",
    bg: "#F3E8FF",
    border: "#9333EA",
    text: "#6B21A8",
  },
  reunionCommission_type: {
    label: "Commission",
    bg: "#DBEAFE",
    border: "#3B82F6",
    text: "#1D4ED8",
  },
  reunionInitParlementaire_type: {
    label: "Initiative parlementaire",
    bg: "#D1FAE5",
    border: "#10B981",
    text: "#065F46",
  },
};

const ALL_TYPES = Object.keys(TYPE_CONFIG) as ReunionType[];

const COMMISSIONS_PERMANENTES: { uid: string; label: string; abrev: string }[] =
  [
    { uid: "PO59046",   label: "Commission de la défense nationale et des forces armées",                                                          abrev: "Défense" },
    { uid: "PO419604",  label: "Commission des affaires culturelles et de l'éducation",                                                            abrev: "Culture & Éducation" },
    { uid: "PO420120",  label: "Commission des affaires sociales",                                                                                 abrev: "Affaires sociales" },
    { uid: "PO419610",  label: "Commission des affaires économiques",                                                                              abrev: "Affaires économiques" },
    { uid: "PO59047",   label: "Commission des affaires étrangères",                                                                               abrev: "Affaires étrangères" },
    { uid: "PO59048",   label: "Commission des finances, de l'économie générale et du contrôle budgétaire",                                        abrev: "Finances" },
    { uid: "PO59051",   label: "Commission des lois constitutionnelles, de la législation et de l'administration générale de la République",        abrev: "Lois" },
    { uid: "PO419865",  label: "Commission du développement durable et de l'aménagement du territoire",                                            abrev: "Développement durable" },
  ];

const ALL_COMMISSION_UIDS = new Set(COMMISSIONS_PERMANENTES.map((c) => c.uid));

// ─── Utilitaires ─────────────────────────────────────────────────────────────
function toParisMinutes(isoString: string): number {
  const date = new Date(isoString);
  const [h, m] = date
    .toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
      hour12: false,
    })
    .split(":")
    .map(Number);
  return h * 60 + m;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
    hour12: false,
  });
}

function isSameDay(isoString: string, day: Date): boolean {
  const d = new Date(isoString);
  const parisFmt = new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Paris",
  });
  return parisFmt.format(d) === parisFmt.format(day);
}

function isToday(day: Date): boolean {
  return isSameDay(new Date().toISOString(), day);
}

function normalizeOdj(odj: string | string[] | null | undefined): string[] {
  if (!odj) return [];
  return Array.isArray(odj) ? odj : [odj];
}

function getEventLabel(reunion: ReunionAgenda): string {
  if (reunion.type === "seance_type") return "Séance plénière";
  if (reunion.type === "reunionInitParlementaire_type")
    return reunion.organeLibelle ?? "Initiative parlementaire";
  return reunion.organeLibelle ?? TYPE_CONFIG[reunion.type].label;
}

// ─── Bloc événement (grille) ─────────────────────────────────────────────────
function EventBlock({ event }: { event: ReunionAgenda }) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.reunionCommission_type;
  const startMin = toParisMinutes(event.timeStampDebut);
  const endMin = event.timeStampFin
    ? toParisMinutes(event.timeStampFin)
    : startMin + 60;
  const durationMin = Math.max(30, endMin - startMin);

  const top = Math.max(0, (startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const height = Math.min(
    (durationMin / 60) * HOUR_HEIGHT,
    TOTAL_HEIGHT - top
  );
  if (top >= TOTAL_HEIGHT) return null;

  const label = getEventLabel(event);
  const odj = normalizeOdj(event.odj);
  const time = formatTime(event.timeStampDebut);

  return (
    <Tooltip
      title={
        <Box sx={{ maxWidth: 300 }}>
          <Typography variant="caption" sx={{ color: "#fff", fontWeight: "bold", display: "block", mb: odj.length > 0 ? 0.75 : 0 }}>
            {label}
          </Typography>
          {odj.length > 0 && (
            <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.2)", pt: 0.75 }}>
              {odj.slice(0, 4).map((item, i) => (
                <Typography key={i} variant="caption" display="block" sx={{ mb: 0.5, color: "#fff" }}>
                  • {item}
                </Typography>
              ))}
              {odj.length > 4 && (
                <Typography variant="caption" sx={{ opacity: 0.6, color: "#fff" }}>
                  +{odj.length - 4} point{odj.length - 4 > 1 ? "s" : ""}
                </Typography>
              )}
            </Box>
          )}
        </Box>
      }
      arrow
      placement="right"
      slotProps={{ tooltip: { sx: { bgcolor: "#1A1A1B", color: "#fff", fontSize: 12 } }, arrow: { sx: { color: "#1A1A1B" } } }}
    >
      <Box
        sx={{
          position: "absolute",
          top,
          left: 2,
          right: 2,
          height: Math.max(height - 2, 24),
          bgcolor: cfg.bg,
          borderLeft: `3px solid ${cfg.border}`,
          borderRadius: "0 4px 4px 0",
          px: 0.75,
          pt: 0.5,
          overflow: "hidden",
          cursor: odj.length > 0 ? "pointer" : "default",
          "&:hover": { filter: "brightness(0.95)" },
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: cfg.text, fontWeight: "bold", lineHeight: 1.2, display: "block" }}
        >
          {time}
        </Typography>
        {height > 36 && (
          <Typography
            variant="caption"
            sx={{ color: cfg.text, lineHeight: 1.2, display: "block" }}
          >
            {label}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

// ─── Vue liste (mobile) ──────────────────────────────────────────────────────
function EventListItem({ event }: { event: ReunionAgenda }) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.reunionCommission_type;
  const label = getEventLabel(event);
  const time = formatTime(event.timeStampDebut);
  const odj = normalizeOdj(event.odj);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        py: 1.25,
        borderBottom: "1px solid #f0f0f0",
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box
        sx={{
          width: 3,
          borderRadius: 2,
          bgcolor: cfg.border,
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: cfg.text, fontWeight: "bold" }}>
          {time}
        </Typography>
        <Typography
          variant="body2"
          fontWeight="medium"
          sx={{ lineHeight: 1.3, mt: 0.25 }}
        >
          {label}
        </Typography>
        {odj.length > 0 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              mt: 0.25,
            }}
          >
            {odj[0]}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────
type Props = {
  initialReunions: ReunionAgenda[];
  initialWeekStart: string; // "YYYY-MM-DD"
};

export default function AgendaCalendar({
  initialReunions,
  initialWeekStart,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [weekStart, setWeekStart] = React.useState<Date>(
    () => new Date(initialWeekStart + "T00:00:00")
  );
  const [reunions, setReunions] =
    React.useState<ReunionAgenda[]>(initialReunions);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTypes, setActiveTypes] = React.useState<Set<ReunionType>>(
    new Set(ALL_TYPES)
  );
  const [activeCommissions, setActiveCommissions] = React.useState<Set<string>>(
    new Set(COMMISSIONS_PERMANENTES.map((c) => c.uid))
  );
  const [showOtherCommissions, setShowOtherCommissions] = React.useState(false);
  const [filterAnchor, setFilterAnchor] =
    React.useState<null | HTMLElement>(null);
  const [selectedDay, setSelectedDay] = React.useState<number>(0); // pour mobile

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  async function navigate(offsetWeeks: number) {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + offsetWeeks * 7);
    setWeekStart(newStart);
    setIsLoading(true);
    try {
      const dateStr = newStart.toISOString().slice(0, 10);
      const res = await fetch(`/api/agenda?weekStart=${dateStr}`);
      const data = await res.json();
      setReunions(data);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleType(type: ReunionType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        if (next.size === 1) return prev;
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  function toggleCommission(uid: string) {
    setActiveCommissions((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        if (next.size === 1) return prev;
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  }

  const allCommissionsActive =
    activeCommissions.size === COMMISSIONS_PERMANENTES.length;

  const filteredReunions = reunions.filter((r) => {
    if (!activeTypes.has(r.type)) return false;
    if (r.type === "reunionCommission_type") {
      const isComper = r.organeUid && ALL_COMMISSION_UIDS.has(r.organeUid);
      if (isComper) {
        // Commission permanente : vérifier le sous-filtre individuel
        if (!activeCommissions.has(r.organeUid!)) return false;
      } else {
        // Mission d'info, enquête, délégation… : vérifier "Autres"
        if (!showOtherCommissions) return false;
      }
    }
    return true;
  });

  const monthLabel = (() => {
    const months = Array.from(
      new Set(weekDays.map((d) => `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`))
    );
    return months.join(" – ");
  })();

  // ── Mobile: liste par jour ────────────────────────────────────────────────
  if (isMobile) {
    const dayEvents = filteredReunions.filter((r) =>
      isSameDay(r.timeStampDebut, weekDays[selectedDay])
    );

    return (
      <Box>
        {/* En-tête section */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" component="h2" fontWeight="bold">
            Cette semaine à l&apos;assemblée
          </Typography>
          <Button
            size="small"
            startIcon={<FilterListIcon />}
            variant="outlined"
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{ borderRadius: 30, textTransform: "none", fontSize: 11, borderColor: "#ccc" }}
          >
            Filtrer
          </Button>
        </Stack>

        {/* Nav semaine */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Typography variant="caption" color="text.secondary" fontWeight="medium">
            {monthLabel}
          </Typography>
          <Stack direction="row" spacing={0.5}>
            <Button size="small" sx={{ minWidth: 32, p: 0 }} onClick={() => navigate(-1)}>
              <ChevronLeftIcon />
            </Button>
            <Button size="small" sx={{ minWidth: 32, p: 0 }} onClick={() => navigate(1)}>
              <ChevronRightIcon />
            </Button>
          </Stack>
        </Stack>

        {/* Sélecteur de jour */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 2, overflowX: "auto", pb: 0.5 }}>
          {weekDays.map((day, i) => {
            const count = filteredReunions.filter((r) =>
              isSameDay(r.timeStampDebut, day)
            ).length;
            const today = isToday(day);
            return (
              <Box
                key={i}
                onClick={() => setSelectedDay(i)}
                sx={{
                  flexShrink: 0,
                  width: 48,
                  textAlign: "center",
                  py: 0.75,
                  borderRadius: 2,
                  cursor: "pointer",
                  bgcolor:
                    selectedDay === i
                      ? "#1A1A1B"
                      : today
                      ? "#f0f0f0"
                      : "transparent",
                  "&:hover": {
                    bgcolor: selectedDay === i ? "#333" : "#f5f5f5",
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: selectedDay === i ? "#fff" : "text.secondary",
                    fontSize: 10,
                  }}
                >
                  {DAY_NAMES_SHORT[i]}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: selectedDay === i ? "#fff" : "inherit" }}
                >
                  {day.getDate()}
                </Typography>
                {count > 0 && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      bgcolor: selectedDay === i ? "#fff" : "#9333EA",
                      mx: "auto",
                      mt: 0.25,
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Stack>

        {/* Liste des événements du jour */}
        <Box
          sx={{
            border: "1px solid #ebebeb",
            borderRadius: 3,
            p: 2,
            minHeight: 120,
          }}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : dayEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", pt: 2 }}>
              Pas de réunion ce jour
            </Typography>
          ) : (
            dayEvents.map((event) => (
              <EventListItem key={event.uid} event={event} />
            ))
          )}
        </Box>

        <FilterMenu
          anchor={filterAnchor}
          onClose={() => setFilterAnchor(null)}
          activeTypes={activeTypes}
          onToggleType={toggleType}
          activeCommissions={activeCommissions}
          onToggleCommission={toggleCommission}
          showOtherCommissions={showOtherCommissions}
          onToggleOtherCommissions={() => setShowOtherCommissions((v) => !v)}
        />
      </Box>
    );
  }

  // ── Desktop: grille calendrier ────────────────────────────────────────────
  return (
    <Box>
      {/* En-tête section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" component="h2" fontWeight="bold">
          Cette semaine à l&apos;assemblée
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FilterListIcon />}
          onClick={(e) => setFilterAnchor(e.currentTarget)}
          sx={{
            borderRadius: 30,
            textTransform: "uppercase",
            fontSize: 11,
            fontWeight: "bold",
            letterSpacing: "0.08em",
            borderColor: "#ccc",
            color: "#1A1A1B",
          }}
        >
          Filtrer par type
        </Button>
      </Stack>

      {/* Calendrier */}
      <Box
        sx={{
          border: "1px solid #ebebeb",
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255,255,255,0.7)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}

        {/* Nav mois */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, borderBottom: "1px solid #ebebeb" }}
        >
          <Typography variant="body2" fontWeight="bold">
            {monthLabel}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              sx={{ minWidth: 32, p: 0.5 }}
              onClick={() => navigate(-1)}
            >
              <ChevronLeftIcon fontSize="small" />
            </Button>
            <Button
              size="small"
              sx={{
                textTransform: "uppercase",
                fontSize: 11,
                fontWeight: "bold",
                letterSpacing: "0.08em",
                px: 1.5,
              }}
              onClick={() => {
                // Recalculer la semaine courante
                const today = new Date();
                const day = today.getDay();
                let daysToMonday =
                  day === 0 ? 1 : day >= 5 ? 8 - day : 1 - day;
                const monday = new Date(today);
                monday.setDate(today.getDate() + daysToMonday);
                monday.setHours(0, 0, 0, 0);
                setWeekStart(monday);
                const dateStr = monday.toISOString().slice(0, 10);
                setIsLoading(true);
                fetch(`/api/agenda?weekStart=${dateStr}`)
                  .then((r) => r.json())
                  .then(setReunions)
                  .finally(() => setIsLoading(false));
              }}
            >
              Aujourd&apos;hui
            </Button>
            <Button
              size="small"
              sx={{ minWidth: 32, p: 0.5 }}
              onClick={() => navigate(1)}
            >
              <ChevronRightIcon fontSize="small" />
            </Button>
          </Stack>
        </Stack>

        {/* En-têtes des jours */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "52px repeat(7, 1fr)",
            borderBottom: "1px solid #ebebeb",
          }}
        >
          <Box /> {/* coin vide */}
          {weekDays.map((day, i) => {
            const today = isToday(day);
            return (
              <Box
                key={i}
                sx={{
                  textAlign: "center",
                  py: 1.25,
                  borderLeft: "1px solid #ebebeb",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {DAY_NAMES_SHORT[i]}
                </Typography>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    bgcolor: today ? "#1A1A1B" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mt: 0.25,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ color: today ? "#fff" : "inherit" }}
                  >
                    {day.getDate()}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Corps : grille horaire */}
        <Box sx={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)" }}>
          {/* Colonne heures */}
          <Box sx={{ position: "relative", height: TOTAL_HEIGHT }}>
            {HOURS.map((h) => (
              <Box
                key={h}
                sx={{
                  position: "absolute",
                  top: (h - START_HOUR) * HOUR_HEIGHT - 8,
                  right: 6,
                  fontSize: 10,
                  color: "#999",
                  userSelect: "none",
                }}
              >
                {h}:00
              </Box>
            ))}
          </Box>

          {/* Colonnes par jour */}
          {weekDays.map((day, i) => {
            const dayEvents = filteredReunions.filter((r) =>
              isSameDay(r.timeStampDebut, day)
            );
            return (
              <Box
                key={i}
                sx={{
                  position: "relative",
                  height: TOTAL_HEIGHT,
                  borderLeft: "1px solid #ebebeb",
                }}
              >
                {/* Lignes horaires */}
                {HOURS.map((h) => (
                  <Box
                    key={h}
                    sx={{
                      position: "absolute",
                      top: (h - START_HOUR) * HOUR_HEIGHT,
                      left: 0,
                      right: 0,
                      borderTop: "1px solid #f5f5f5",
                    }}
                  />
                ))}
                {/* Événements */}
                {dayEvents.map((event) => (
                  <EventBlock key={event.uid} event={event} />
                ))}
              </Box>
            );
          })}
        </Box>
      </Box>

      <FilterMenu
        anchor={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        activeTypes={activeTypes}
        onToggleType={toggleType}
        activeCommissions={activeCommissions}
        onToggleCommission={toggleCommission}
        showOtherCommissions={showOtherCommissions}
        onToggleOtherCommissions={() => setShowOtherCommissions((v) => !v)}
      />
    </Box>
  );
}

// ─── Menu filtre ─────────────────────────────────────────────────────────────
function FilterMenu({
  anchor,
  onClose,
  activeTypes,
  onToggleType,
  activeCommissions,
  onToggleCommission,
  showOtherCommissions,
  onToggleOtherCommissions,
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  activeTypes: Set<ReunionType>;
  onToggleType: (t: ReunionType) => void;
  activeCommissions: Set<string>;
  onToggleCommission: (uid: string) => void;
  showOtherCommissions: boolean;
  onToggleOtherCommissions: () => void;
}) {
  const [commissionsOpen, setCommissionsOpen] = React.useState(true);
  const commissionActive = activeTypes.has("reunionCommission_type");
  const cfg = TYPE_CONFIG.reunionCommission_type;

  return (
    <Menu
      anchorEl={anchor}
      open={Boolean(anchor)}
      onClose={onClose}
      slotProps={{
        paper: { sx: { borderRadius: 2, mt: 1, minWidth: 280, maxHeight: 560 } },
      }}
    >
      {/* Séance plénière */}
      <MenuItem onClick={() => onToggleType("seance_type")} dense>
        <Checkbox
          checked={activeTypes.has("seance_type")}
          size="small"
          sx={{ p: 0.5, mr: 1, color: TYPE_CONFIG.seance_type.border, "&.Mui-checked": { color: TYPE_CONFIG.seance_type.border } }}
        />
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: TYPE_CONFIG.seance_type.border, mr: 1, flexShrink: 0 }} />
        <ListItemText primary={TYPE_CONFIG.seance_type.label} slotProps={{ primary: { variant: "body2" } }} />
      </MenuItem>

      {/* Commission — ligne parente cliquable pour cocher/décocher le type */}
      <MenuItem
        dense
        disableRipple
        sx={{ display: "flex", alignItems: "center", pr: 1 }}
      >
        <Checkbox
          checked={commissionActive}
          size="small"
          onClick={(e) => { e.stopPropagation(); onToggleType("reunionCommission_type"); }}
          sx={{ p: 0.5, mr: 1, color: cfg.border, "&.Mui-checked": { color: cfg.border } }}
        />
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: cfg.border, mr: 1, flexShrink: 0 }} />
        <ListItemText primary={cfg.label} slotProps={{ primary: { variant: "body2" } }} sx={{ flex: 1 }} />
        {/* Bouton expand/collapse des sous-commissions */}
        <Box
          component="span"
          onClick={(e) => { e.stopPropagation(); setCommissionsOpen((o) => !o); }}
          sx={{
            display: "flex",
            alignItems: "center",
            p: 0.5,
            borderRadius: 1,
            cursor: "pointer",
            color: "text.secondary",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <ExpandMoreIcon
            fontSize="small"
            sx={{ transition: "transform 0.2s", transform: commissionsOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
        </Box>
      </MenuItem>

      {/* Sous-liste commissions permanentes */}
      <Collapse in={commissionsOpen} timeout="auto" unmountOnExit>
        {COMMISSIONS_PERMANENTES.map((c) => (
          <MenuItem
            key={c.uid}
            onClick={() => onToggleCommission(c.uid)}
            dense
            disabled={!commissionActive}
            sx={{ pl: 4 }}
          >
            <Checkbox
              checked={activeCommissions.has(c.uid)}
              size="small"
              sx={{ p: 0.5, mr: 1, color: cfg.border, "&.Mui-checked": { color: cfg.border } }}
            />
            <ListItemText
              primary={c.abrev}
              secondary={c.label}
              slotProps={{
                primary: { variant: "body2" },
                secondary: { variant: "caption", sx: { lineHeight: 1.3, mt: 0.25 } },
              }}
            />
          </MenuItem>
        ))}

        {/* Autres : missions d'information, commissions d'enquête, délégations… */}
        <Divider sx={{ mx: 2, my: 0.5 }} />
        <MenuItem
          onClick={onToggleOtherCommissions}
          dense
          disabled={!commissionActive}
          sx={{ pl: 4 }}
        >
          <Checkbox
            checked={showOtherCommissions}
            size="small"
            sx={{ p: 0.5, mr: 1, color: cfg.border, "&.Mui-checked": { color: cfg.border } }}
          />
          <ListItemText
            primary="Autres"
            secondary="Missions d'info, enquêtes, délégations…"
            slotProps={{
              primary: { variant: "body2" },
              secondary: { variant: "caption", sx: { lineHeight: 1.3, mt: 0.25 } },
            }}
          />
        </MenuItem>
      </Collapse>

      {/* Initiative parlementaire */}
      <MenuItem onClick={() => onToggleType("reunionInitParlementaire_type")} dense>
        <Checkbox
          checked={activeTypes.has("reunionInitParlementaire_type")}
          size="small"
          sx={{ p: 0.5, mr: 1, color: TYPE_CONFIG.reunionInitParlementaire_type.border, "&.Mui-checked": { color: TYPE_CONFIG.reunionInitParlementaire_type.border } }}
        />
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: TYPE_CONFIG.reunionInitParlementaire_type.border, mr: 1, flexShrink: 0 }} />
        <ListItemText primary={TYPE_CONFIG.reunionInitParlementaire_type.label} slotProps={{ primary: { variant: "body2" } }} />
      </MenuItem>
    </Menu>
  );
}
