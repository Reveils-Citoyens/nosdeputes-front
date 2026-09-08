"use client";

import * as React from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  Box,
  Chip,
  Stack,
  Avatar,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import DossierBadge from "@/components/folders/DossierBadge";
import debounce from "@/utils/debounce";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ActeurSearchResult } from "@/data/mongo/searchActeurParNom";
import type { DossierSearchResult } from "@/data/mongo/searchDossierParTitre";

function toSlug(prenom: string, nom: string): string {
  return `${prenom}-${nom}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function deputePhotoUrl(uid: string): string {
  return `https://tricoteuses-assets.s3.fr-par.scw.cloud/photos/${uid.replace(/^PA/, "")}_124x124.jpg`;
}

function isActeur(
  item: ActeurSearchResult | DossierSearchResult
): item is ActeurSearchResult {
  return "nom" in item;
}

const fetchActeurs = debounce(
  (query: string, cb: (r: ActeurSearchResult[]) => void) =>
    fetch(`/api/search/acteurs?q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(cb)
      .catch(() => cb([]))
);

const fetchDossiers = debounce(
  (query: string, cb: (r: DossierSearchResult[]) => void) =>
    fetch(`/api/search/dossiers?q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => (Array.isArray(data) ? (data as DossierSearchResult[]) : []))
      .then(cb)
      .catch(() => cb([]))
);

const MIN_CHARS = 5;
const emptyOptions = [] as const;

/**
 * Identifiants fixes des deux champs de recherche de la barre de navigation.
 *
 * Sans eux, MUI les dérive de `useId`, dont la valeur encode la position du
 * composant dans l'arbre React — y compris les frontières de Suspense que
 * Next.js ouvre pendant le rendu en flux. La barre de navigation vit dans le
 * layout racine, donc au-dessus des pages qui streament : sur certaines pages
 * député, l'arbre du serveur compte une frontière de plus que celui du client,
 * les deux `useId` divergent, et React signale une erreur d'hydratation sur
 * l'attribut `id` de l'input.
 *
 * Une valeur écrite en dur ne dépend de rien. Les deux variantes coexistent
 * dans le DOM — l'une masquée par media query — d'où deux identifiants.
 */
const ID_RECHERCHE_BUREAU = "recherche-nav";
const ID_RECHERCHE_MOBILE = "recherche-nav-mobile";

// Height matches the nav pill container (p-1 + py-2.5 + text ≈ 44px outer)
const PILL_HEIGHT = 50;
const EXPANDED_WIDTH = 360;
const DROPDOWN_WIDTH = 460;

export default function NavSearchBar({ mobile = false }: { mobile?: boolean }) {
  const [isExpanded, setIsExpanded] = React.useState(mobile);
  const [value, setValue] = React.useState<
    ActeurSearchResult | DossierSearchResult | null
  >(null);
  const [inputValue, setInputValue] = React.useState("");
  const [acteurOptions, setActeurOptions] = React.useState<
    readonly ActeurSearchResult[]
  >(emptyOptions);
  const [dossierOptions, setDossierOptions] = React.useState<
    readonly DossierSearchResult[]
  >(emptyOptions);
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const closeSearch = React.useCallback(() => {
    setIsExpanded(false);
    setInputValue("");
    setValue(null);
    inputRef.current?.blur();
  }, []);

  React.useEffect(() => {
    closeSearch();
  }, [pathname, closeSearch]);

  React.useEffect(() => {
    if (inputValue.length < MIN_CHARS) {
      setActeurOptions(value && isActeur(value) ? [value] : emptyOptions);
      setDossierOptions(
        value && !isActeur(value) ? [value] : emptyOptions
      );
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    let acteursSettled = false;
    let dossiersSettled = false;

    const checkDone = () => {
      if (acteursSettled && dossiersSettled && active) setLoading(false);
    };

    fetchActeurs(inputValue, (results) => {
      if (active) setActeurOptions(results ?? emptyOptions);
      acteursSettled = true;
      checkDone();
    });
    fetchDossiers(inputValue, (results) => {
      if (active) setDossierOptions(results ?? emptyOptions);
      dossiersSettled = true;
      checkDone();
    });

    return () => {
      active = false;
    };
  }, [value, inputValue]);

  const options = React.useMemo(
    () => [...acteurOptions.slice(0, 4), ...dossierOptions.slice(0, 4)],
    [acteurOptions, dossierOptions]
  );

  const handleExpand = () => {
    setIsExpanded(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleBlur = () => {
    if (!inputValue) setIsExpanded(false);
  };

  if (mobile) {
    return (
      <MobileSearch
        inputRef={inputRef}
        value={value}
        inputValue={inputValue}
        loading={loading}
        options={options}
        setValue={setValue}
        setInputValue={setInputValue}
      />
    );
  }

  return (
    <div
      onClick={!isExpanded ? handleExpand : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        height: PILL_HEIGHT,
        width: isExpanded ? EXPANDED_WIDTH : PILL_HEIGHT,
        borderRadius: PILL_HEIGHT / 2,
        backgroundColor: "rgba(249,250,251,0.8)",
        border: "1px solid rgba(229,231,235,0.5)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        backdropFilter: "blur(8px)",
        transition: "width 250ms cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        cursor: isExpanded ? "text" : "pointer",
        flexShrink: 0,
      }}
    >
      {/* Icon — always visible, centered when collapsed */}
      <SearchIcon
        style={{
          fontSize: 20,
          color: "#6b7280",
          flexShrink: 0,
          marginLeft: isExpanded ? 12 : (PILL_HEIGHT - 20) / 2,
          marginRight: isExpanded ? 4 : 0,
          transition: "margin 250ms cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: "none",
        }}
      />

      {/* Input — hidden (zero-width) when collapsed */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          opacity: isExpanded ? 1 : 0,
          transition: "opacity 200ms ease",
          minWidth: 0,
        }}
      >
        <Autocomplete
          id={ID_RECHERCHE_BUREAU}
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            if (isActeur(option)) return `${option.prenom} ${option.nom}`;
            return option.titre ?? "";
          }}
          slotProps={{
            paper: {
              sx: {
                mt: "6px",
                borderRadius: "16px",
                boxShadow: "0px 4px 20px rgba(0,0,0,0.10)",
                "&:empty": { display: "none" },
              },
            },
            popper: {
              style: { width: DROPDOWN_WIDTH },
              placement: "bottom-end",
            },
          }}
          filterOptions={(x) => x}
          options={options}
          autoComplete
          includeInputInList
          filterSelectedOptions
          popupIcon={null}
          value={value}
          inputValue={inputValue}
          loading={loading}
          loadingText="Recherche…"
          noOptionsText="Aucun résultat"
          openOnFocus={false}
          open={inputValue.length >= MIN_CHARS}
          onChange={(_e, newValue) => {
            if (newValue) {
              if (isActeur(newValue)) {
                router.push(`/depute/${toSlug(newValue.prenom, newValue.nom)}`);
              } else {
                router.push(`/${newValue.legislature}/dossier/${newValue.uid}`);
              }
            }
            closeSearch();
          }}
          onInputChange={(_e, v) => setInputValue(v)}
          PaperComponent={({ children, ...paperProps }) => (
            <Box
              {...paperProps}
              sx={{
                ...((paperProps as { sx?: object }).sx ?? {}),
                bgcolor: "white",
                borderRadius: "16px",
                boxShadow: "0px 4px 20px rgba(0,0,0,0.10)",
                overflow: "hidden",
              }}
            >
              {children}
              {inputValue.trim().length >= MIN_CHARS && (
                <Box
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{ borderTop: "1px solid", borderColor: "grey.100" }}
                >
                  <Link
                    href={`/recherche?q=${encodeURIComponent(inputValue.trim())}`}
                    onClick={closeSearch}
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ p: 1.25, "&:hover": { bgcolor: "grey.50" } }}
                    >
                      <Typography variant="body2" fontWeight="bold" sx={{ color: "#1A1A1B", fontSize: "0.8rem" }}>
                        Voir tous les résultats
                      </Typography>
                      <Box sx={{ fontSize: 12, color: "grey.600" }}>→</Box>
                    </Stack>
                  </Link>
                </Box>
              )}
            </Box>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim().length >= MIN_CHARS) {
                  e.preventDefault();
                  router.push(`/recherche?q=${encodeURIComponent(inputValue.trim())}`);
                  closeSearch();
                }
              }}
              sx={{
                "&&& .MuiInputBase-root": {
                  height: PILL_HEIGHT,
                  bgcolor: "transparent",
                  p: 0,
                  pr: 1,
                },
                "&&& input": {
                  p: 0,
                  fontSize: "0.8rem",
                  color: "#374151",
                  "&::placeholder": { color: "#9ca3af", opacity: 1 },
                },
                "&&& fieldset": { border: "none" },
              }}
              fullWidth
              placeholder="Député, dossier, code postal…"
              InputProps={{ ...params.InputProps, startAdornment: null }}
            />
          )}
          renderOption={({ key, ...props }, option) => {
            if (isActeur(option)) {
              const href = `/depute/${toSlug(option.prenom, option.nom)}`;
              return (
                <li key={key} {...props} style={{ padding: "8px 10px" }}>
                  <Link
                    href={href}
                    onClick={closeSearch}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      width: "100%",
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        src={deputePhotoUrl(option.uid)}
                        sx={{ height: 36, width: 36, flexShrink: 0 }}
                      >
                        {option.prenom[0]?.toUpperCase()}
                        {option.nom[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={0.8}>
                          <Typography variant="body2" fontWeight="bold" noWrap>
                            {option.prenom} {option.nom}
                          </Typography>
                          {option.mandatAcheve && <MandatAcheveChip />}
                        </Stack>
                        <DeputeSubline option={option} />
                      </Box>
                    </Stack>
                  </Link>
                </li>
              );
            }
            return (
              <li key={key} {...props} style={{ padding: "8px 10px" }}>
                <Link
                  href={`/${option.legislature}/dossier/${option.uid}`}
                  onClick={closeSearch}
                  style={{
                    width: "100%",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <DossierOptionRow dossier={option} />
                </Link>
              </li>
            );
          }}
        />
      </div>
    </div>
  );
}

// ─── Mobile variant ───────────────────────────────────────────────────────────

function MobileSearch({
  inputRef,
  value,
  inputValue,
  loading,
  options,
  setValue,
  setInputValue,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  value: ActeurSearchResult | DossierSearchResult | null;
  inputValue: string;
  loading: boolean;
  options: (ActeurSearchResult | DossierSearchResult)[];
  setValue: (v: ActeurSearchResult | DossierSearchResult | null) => void;
  setInputValue: (v: string) => void;
}) {
  return (
    <Autocomplete
      id={ID_RECHERCHE_MOBILE}
      getOptionLabel={(option) => {
        if (typeof option === "string") return option;
        if (isActeur(option)) return `${option.prenom} ${option.nom}`;
        return option.titre ?? "";
      }}
      slotProps={{
        paper: {
          sx: {
            mt: "6px",
            borderRadius: "16px",
            boxShadow: "0px 4px 20px rgba(0,0,0,0.10)",
          },
        },
      }}
      filterOptions={(x) => x}
      options={options}
      autoComplete
      includeInputInList
      filterSelectedOptions
      popupIcon={null}
      value={value}
      inputValue={inputValue}
      loading={loading}
      loadingText="Recherche…"
      noOptionsText="Aucun résultat"
      openOnFocus={false}
      open={inputValue.length >= MIN_CHARS}
      onChange={(_e, newValue) => {
        setValue(newValue);
        setInputValue("");
      }}
      onInputChange={(_e, v) => setInputValue(v)}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          sx={{
            "&&& .MuiInputBase-root": {
              height: 44,
              borderRadius: 22,
              bgcolor: "rgba(249,250,251,0.9)",
              border: "1px solid rgba(229,231,235,0.6)",
              pl: 1.5,
              pr: 1,
            },
            "&&& fieldset": { border: "none" },
          }}
          fullWidth
          placeholder="Député, dossier, code postal…"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <SearchIcon sx={{ fontSize: 20, color: "#6b7280", mr: 0.5, flexShrink: 0 }} />
            ),
          }}
        />
      )}
      renderOption={({ key, ...props }, option) => {
        if (isActeur(option)) {
          const href = `/depute/${toSlug(option.prenom, option.nom)}`;
          return (
            <li key={key} {...props} style={{ padding: "8px 10px" }}>
              <Link href={href} style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar src={deputePhotoUrl(option.uid)} sx={{ height: 36, width: 36 }}>
                    {option.prenom[0]?.toUpperCase()}{option.nom[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {option.prenom} {option.nom}
                      </Typography>
                      {option.mandatAcheve && <MandatAcheveChip />}
                    </Stack>
                    <DeputeSubline option={option} />
                  </Box>
                </Stack>
              </Link>
            </li>
          );
        }
        return (
          <li key={key} {...props} style={{ padding: "8px 10px" }}>
            <Link href={`/${option.legislature}/dossier/${option.uid}`} style={{ width: "100%", textDecoration: "none", color: "inherit" }}>
              <DossierOptionRow dossier={option} />
            </Link>
          </li>
        );
      }}
    />
  );
}

function DossierOptionRow({ dossier }: { dossier: DossierSearchResult }) {
  const statBits: string[] = [];
  if (dossier.amendementsTotal > 0) {
    statBits.push(`${dossier.amendementsTotal} amd.`);
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ width: "100%", minWidth: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight="bold" noWrap>{dossier.titre}</Typography>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" sx={{ mt: 0.25 }}>
          {dossier.typeLibelle && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {dossier.typeLibelle}
            </Typography>
          )}
          {statBits.length > 0 && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {dossier.typeLibelle ? "· " : ""}{statBits.join(" · ")}
            </Typography>
          )}
        </Stack>
      </Box>
      <DossierBadge badge={dossier.badge} />
    </Stack>
  );
}

function MandatAcheveChip() {
  return (
    <Chip
      label="Mandat achevé"
      size="small"
      sx={{
        bgcolor: "grey.200",
        color: "grey.800",
        fontWeight: 600,
        fontSize: "0.6rem",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        height: 16,
        "& .MuiChip-label": { px: 0.7 },
      }}
    />
  );
}

function DeputeSubline({ option }: { option: ActeurSearchResult }) {
  const gp = option.groupeParlementaire;
  const hasGp = !!gp;
  const hasCirco = !!(option.departement && option.numCirco);
  if (!hasGp && !hasCirco) return null;
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.7}
      flexWrap="wrap"
      sx={{ mt: 0.1 }}
    >
      {gp && (
        <>
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: gp.couleurAssociee ?? "#9ca3af",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            noWrap
            sx={{ fontWeight: 500 }}
          >
            {gp.libelleAbrev ?? gp.libelle}
          </Typography>
        </>
      )}
      {hasGp && hasCirco && (
        <Typography variant="caption" color="text.secondary">·</Typography>
      )}
      {hasCirco && (
        <Typography variant="caption" color="text.secondary" noWrap>
          {option.numCirco}e circ. — {option.departement}
        </Typography>
      )}
    </Stack>
  );
}
