"use client";
import * as React from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  Box,
  Stack,
  Avatar,
} from "@mui/material";
import debounce from "@/utils/debounce";
import Link from "next/link";
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
      .then((r) => r.json())
      .then(cb)
);

const fetchDossiers = debounce(
  (query: string, cb: (r: DossierSearchResult[]) => void) =>
    fetch(`/api/search/dossiers?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then(cb)
);

// ─── Type guard ───────────────────────────────────────────────────────────────

function isActeur(
  item: ActeurSearchResult | DossierSearchResult
): item is ActeurSearchResult {
  return "nom" in item;
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

const emptyOptions = [] as const;

const MIN_CHARS = 3;

export default function SearchBar() {
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
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {option.titre}
                </Typography>
                {option.typeLibelle && (
                  <Typography variant="caption" color="text.secondary">
                    {option.typeLibelle}
                  </Typography>
                )}
              </Link>
            </li>
          );
        }}
      />
      <Typography variant="caption" sx={{ mt: 2 }} fontWeight="light">
        Ex. Yaël Braun-Pivet, Loi Finance, 59650, Lyon, ...
      </Typography>
    </Box>
  );
}

// ─── ActeurOption ─────────────────────────────────────────────────────────────

function deputePhotoUrl(uid: string): string {
  return `https://tricoteuses-assets.s3.fr-par.scw.cloud/photos/${uid.replace(/^PA/, "")}_124x124.jpg`;
}

function ActeurOption({ acteur }: { acteur: ActeurSearchResult }) {
  const { uid, prenom, nom, departement, numCirco } = acteur;
  const href = `/depute/${toSlug(prenom, nom)}`;

  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", width: "100%" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar src={deputePhotoUrl(uid)} sx={{ height: 46, width: 46, flexShrink: 0 }}>
          {prenom[0]?.toUpperCase()}
          {nom[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" fontWeight="bold" noWrap>
            {prenom} {nom}
          </Typography>
          {departement && numCirco && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {numCirco}e circ. — {departement}
            </Typography>
          )}
        </Box>
      </Stack>
    </Link>
  );
}
