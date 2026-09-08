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
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import DossierBadge from "@/components/folders/DossierBadge";
import debounce from "@/utils/debounce";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// ─── Fetchers ────────────────────────────────────────────────────────────────

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
      .then(cb)
      .catch(() => cb([]))
);

// ─── Type guard ───────────────────────────────────────────────────────────────

function isActeur(
  item: ActeurSearchResult | DossierSearchResult
): item is ActeurSearchResult {
  return "nom" in item;
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

const emptyOptions = [] as const;

const MIN_CHARS = 5;

export default function SearchBar() {
  const router = useRouter();
  const [value, setValue] = React.useState<
    ActeurSearchResult | DossierSearchResult | null
  >(null);
  const [inputValue, setInputValue] = React.useState("");
  const [actuersOptions, setActeursOptions] = React.useState<
    readonly ActeurSearchResult[]
  >(emptyOptions);
  const [dossierOptions, setDossierOptions] = React.useState<
    readonly DossierSearchResult[]
  >(emptyOptions);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (inputValue.length < MIN_CHARS) {
      setActeursOptions(value && isActeur(value) ? [value] : emptyOptions);
      setDossierOptions(value && !isActeur(value) ? [value] : emptyOptions);
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
      if (active) setActeursOptions(results ?? emptyOptions);
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

  const options: (ActeurSearchResult | DossierSearchResult)[] =
    React.useMemo(
      () => [...actuersOptions.slice(0, 5), ...dossierOptions.slice(0, 5)],
      [actuersOptions, dossierOptions]
    );

  return (
    <Box sx={{ maxWidth: 709, width: "100%" }}>
      <Autocomplete
        // Identifiant fixe plutôt que dérivé de `useId` : celui-ci encode la
        // position dans l'arbre React, qui diffère entre le rendu serveur en
        // flux et l'hydratation, d'où une erreur d'hydratation sur l'`id` de
        // l'input. Même raison que dans NavSearchBar.
        id="recherche-accueil"
        getOptionLabel={(option) => {
          if (typeof option === "string") return option;
          if (isActeur(option)) return `${option.prenom} ${option.nom}`;
          return option.titre ?? "";
        }}
        slotProps={{
          paper: {
            sx: {
              marginTop: "8px",
              borderRadius: "20px",
              boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
              "&:empty": { display: "none" },
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
        loadingText="Recherche en cours…"
        noOptionsText="Aucun résultat"
        openOnFocus={false}
        open={inputValue.length >= MIN_CHARS}
        onChange={(_e, newValue) => setValue(newValue)}
        onInputChange={(_e, newInputValue) => setInputValue(newInputValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue.trim().length >= MIN_CHARS) {
                e.preventDefault();
                router.push(`/recherche?q=${encodeURIComponent(inputValue.trim())}`);
              }
            }}
            sx={{
              "&&& .MuiInputBase-root": {
                bgcolor: "#fff",
                height: 68,
                borderRadius: 34,
                pl: 2,
                pr: 1,
                boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.08)",
                "&:hover": {
                  boxShadow: "0px 6px 25px rgba(0, 0, 0, 0.12)",
                },
              },
            }}
            fullWidth
            placeholder="Entrez un code postal, un nom de député ou un nom de dossier législatif"
            InputProps={{
              ...params.InputProps,
              endAdornment: params.InputProps.endAdornment,
            }}
          />
        )}
        PaperComponent={({ children, ...paperProps }) => (
          <Box
            {...paperProps}
            sx={{
              ...((paperProps as { sx?: object }).sx ?? {}),
              bgcolor: "white",
              borderRadius: "20px",
              boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
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
                  style={{ textDecoration: "none", color: "inherit", display: "block" }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 1.75, "&:hover": { bgcolor: "grey.50" } }}
                  >
                    <Typography variant="body2" fontWeight="bold" sx={{ color: "#1A1A1B" }}>
                      Voir tous les résultats pour « {inputValue.trim()} »
                    </Typography>
                    <ArrowForwardIcon sx={{ fontSize: 18, color: "grey.600" }} />
                  </Stack>
                </Link>
              </Box>
            )}
          </Box>
        )}
        renderOption={({ key, ...props }, option) => {
          if (isActeur(option)) {
            return (
              <li key={key} {...props} style={{ padding: "12px 10px" }}>
                <ActeurOption acteur={option} />
              </li>
            );
          }
          return (
            <li key={key} {...props} style={{ padding: "12px 10px" }}>
              <Link
                href={`/${option.legislature}/dossier/${option.uid}`}
                style={{ width: "100%", textDecoration: "none", color: "inherit" }}
              >
                <DossierOption dossier={option} />
              </Link>
            </li>
          );
        }}
      />
      <Typography variant="caption" sx={{ mt: 2 }} fontWeight="light">
        Ex. Yaël Braun-Pivet, Loi Finance, 59650...
      </Typography>
    </Box>
  );
}

// ─── ActeurOption ─────────────────────────────────────────────────────────────

function deputePhotoUrl(uid: string): string {
  return `https://tricoteuses-assets.s3.fr-par.scw.cloud/photos/${uid.replace(/^PA/, "")}_124x124.jpg`;
}

function DossierOption({ dossier }: { dossier: DossierSearchResult }) {
  const statBits: string[] = [];
  if (dossier.amendementsTotal > 0) {
    statBits.push(`${dossier.amendementsTotal} amendement${dossier.amendementsTotal > 1 ? "s" : ""}`);
  }

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight="bold" noWrap>
            {dossier.titre}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.25 }}>
            {dossier.typeLibelle && (
              <Typography variant="caption" color="text.secondary">
                {dossier.typeLibelle}
              </Typography>
            )}
            {statBits.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                {dossier.typeLibelle ? "· " : ""}{statBits.join(" · ")}
              </Typography>
            )}
          </Stack>
        </Box>
        <DossierBadge badge={dossier.badge} />
      </Stack>
    </Box>
  );
}

function ActeurOption({ acteur }: { acteur: ActeurSearchResult }) {
  const {
    uid,
    prenom,
    nom,
    departement,
    numCirco,
    mandatAcheve,
    groupeParlementaire,
  } = acteur;
  const href = `/depute/${toSlug(prenom, nom)}`;
  const hasGp = !!groupeParlementaire;
  const hasCirco = !!(departement && numCirco);

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar src={deputePhotoUrl(uid)} sx={{ height: 46, width: 46, flexShrink: 0 }}>
          {prenom[0]?.toUpperCase()}
          {nom[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={0.8}>
            <Typography variant="body1" fontWeight="bold" noWrap>
              {prenom} {nom}
            </Typography>
            {mandatAcheve && (
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
            )}
          </Stack>
          {(hasGp || hasCirco) && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.7}
              flexWrap="wrap"
              sx={{ mt: 0.15 }}
            >
              {groupeParlementaire && (
                <>
                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor:
                        groupeParlementaire.couleurAssociee ?? "#9ca3af",
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ fontWeight: 500 }}
                  >
                    {groupeParlementaire.libelleAbrev ??
                      groupeParlementaire.libelle}
                  </Typography>
                </>
              )}
              {hasGp && hasCirco && (
                <Typography variant="body2" color="text.secondary">·</Typography>
              )}
              {hasCirco && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {numCirco}e circ. — {departement}
                </Typography>
              )}
            </Stack>
          )}
        </Box>
      </Stack>
    </Link>
  );
}
