"use client";
import * as React from "react";
import {
  Autocomplete,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Stack,
  Avatar,
} from "@mui/material";
import debounce from "@/utils/debounce";
import { Dossier, Acteur } from "@prisma/client";
import { searchDossier } from "@/data/searchDossier";
import { searchActeur } from "@/data/searchActeur";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  type CirconscriptionLegislative Suggestion,
  deputeAutocompletions,
} from "@/data/autocomplet/suggestions";
import { useQuery } from "@tanstack/react-query";
import { getActeur } from "@/data/getActeur";

type Require<T, K extends keyof T> = T & { [P in K]-?: T[P] };
type Circonscription = Require<CirconscriptionLegislativeSuggestion, "depute">;

// Call 1: code4code.eu (location-based)
const fetchActeurs = debounce(
  (
    search: string,
    callback: (results: readonly CirconscriptionLegislativeSuggestion[]) => void
  ) => deputeAutocompletions(search).then(callback)
);

// Call 2: internal API (name-based, with prefixSearch)
const fetchActeursByName = debounce(
  (search: string, callback: (results: Acteur[]) => void) =>
    searchActeur(search).then(callback)
);

// Call 3: dossiers (with prefixSearch)
const fetchDossiers = debounce(
  (search: string, callback: (results: null | readonly Dossier[]) => void) =>
    searchDossier({ search }).then((result) => callback(result?.data ?? null))
);

const emptyOptions = [] as const;

type SearchOption = Circonscription | Acteur | Dossier;

function isCirconscriptionActeur(item: SearchOption): item is Circonscription {
  return "depute" in item && (item as CirconscriptionLegislativeSuggestion).depute !== undefined;
}

function isPrismaActeur(item: SearchOption): item is Acteur {
  return "prenom" in item && !("depute" in item) && !("titre" in item);
}

export default function SearchBar() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = React.useState<SearchOption | null>(null);
  const [inputValue, setInputValue] = React.useState("");
  const [deputesOptions, setDeputesOptions] =
    React.useState<readonly Circonscription[]>(emptyOptions);
  const [nameActeurOptions, setNameActeurOptions] =
    React.useState<readonly Acteur[]>(emptyOptions);
  const [dossierOptions, setDossierOptions] =
    React.useState<readonly Dossier[]>(emptyOptions);

  React.useEffect(() => {
    if (inputValue === "") {
      if (value && isCirconscriptionActeur(value)) {
        setDeputesOptions([value]);
      } else {
        setDeputesOptions(emptyOptions);
      }
      setNameActeurOptions(emptyOptions);
      if (value && !isCirconscriptionActeur(value) && !isPrismaActeur(value)) {
        setDossierOptions([value as Dossier]);
      } else {
        setDossierOptions(emptyOptions);
      }
      return undefined;
    }

    let active = true;

    // Call 1 — code4code.eu (location-based)
    fetchActeurs(
      inputValue,
      (results: readonly CirconscriptionLegislativeSuggestion[]) => {
        if (!active) return;
        setDeputesOptions(
          results.filter(
            (suggestion): suggestion is Circonscription =>
              suggestion.depute !== undefined && suggestion.score > 0.5
          )
        );
      }
    );

    // Call 2 — internal API (name-based)
    fetchActeursByName(inputValue, (results: Acteur[]) => {
      if (!active) return;
      setNameActeurOptions(results);
    });

    // Call 3 — dossiers
    fetchDossiers(inputValue, (results: null | readonly Dossier[]) => {
      if (!active) return;
      setDossierOptions(results ?? emptyOptions);
    });

    return () => {
      active = false;
    };
  }, [value, inputValue]);

  // Merge location-based and name-based deputies, deduplicating by uid
  const mergedActeurs = React.useMemo(() => {
    const locationUids = new Set(deputesOptions.map((s) => s.depute.uid));
    const nameOnly = nameActeurOptions.filter((a) => !locationUids.has(a.uid));
    const maxLocation = Math.min(3, deputesOptions.length);
    return [
      ...deputesOptions.slice(0, maxLocation),
      ...nameOnly.slice(0, 5 - maxLocation),
    ];
  }, [deputesOptions, nameActeurOptions]);

  const options: SearchOption[] = React.useMemo(
    () => [...mergedActeurs, ...dossierOptions.slice(0, 5)],
    [mergedActeurs, dossierOptions]
  );

  return (
    <Box sx={{ maxWidth: 709, width: "100%" }}>
      <Autocomplete
        getOptionLabel={(option) => {
          if (typeof option === "string") return option;
          if (isCirconscriptionActeur(option)) {
            return `${option.depute.etatCivil.ident.prenom} ${option.depute.etatCivil.ident.nom}`;
          }
          if (isPrismaActeur(option)) {
            return `${option.prenom} ${option.nom}`;
          }
          return (option as Dossier).titre ?? "";
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
        noOptionsText={isPending ? "Recherche en cours..." : "Aucun résultat"}
        openOnFocus={false}
        open={inputValue.length > 2}
        groupBy={(option) =>
          "titre" in option ? "Dossiers législatifs" : "Député·e·s"
        }
        renderGroup={(params) => (
          <li key={params.key}>
            <Box
              sx={{
                px: 2,
                py: 0.75,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  letterSpacing: "0.08em",
                  color: "text.secondary",
                }}
              >
                {params.group}
              </Typography>
            </Box>
            <ul style={{ padding: 0 }}>{params.children}</ul>
          </li>
        )}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
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
            inputProps={{
              ...params.inputProps,
            }}
            InputProps={{
              ...params.InputProps,
              endAdornment: isPending ? (
                <CircularProgress size={20} />
              ) : (
                params.InputProps.endAdornment
              ),
            }}
          />
        )}
        renderOption={({ key, ...props }, option) => {
          if (isCirconscriptionActeur(option)) {
            return (
              <li key={key} {...props} style={{ padding: "12px 10px" }}>
                <ActeurOption {...option} />
              </li>
            );
          }
          if (isPrismaActeur(option)) {
            return (
              <li key={key} {...props} style={{ padding: "12px 10px" }}>
                <PrismaActeurOption acteur={option} />
              </li>
            );
          }
          return (
            <li key={key} {...props} style={{ padding: "12px 10px" }}>
              <Link
                href={`/17/dossier/${(option as Dossier).uid}`}
                style={{ width: "100%" }}
              >
                {(option as Dossier).titre}
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

// For location-based results (code4code.eu) — still needs useQuery for slug/urlImage
export function ActeurOption(props: Circonscription) {
  const { data: acteur } = useQuery({
    queryKey: ["acteur", props.depute.uid],
    queryFn: async () =>
      props.depute.uid == null ? null : await getActeur(props.depute.uid),
    enabled: !!props.depute.uid,
  });

  const { nom, prenom } = props.depute.etatCivil.ident;

  if (!acteur) {
    return null;
  }
  return (
    <Link href={`/depute/${acteur.slug}`}>
      <Stack direction="row" spacing={1.5}>
        <Avatar
          sx={{ height: 46, width: 46 }}
          alt={"photo de " + prenom + " " + nom}
          src={acteur?.urlImage ?? ""}
        >
          {prenom[0].toUpperCase()}
          {nom[0].toUpperCase()}
        </Avatar>
        <div style={{ flexGrow: 1 }}>
          <Typography variant="body1" fontWeight="bold">
            {prenom} {nom}
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="space-between">
            {props.circonscription_legislative && (
              <Typography variant="body1" fontWeight="light">
                {props.circonscription_legislative.libelle}
              </Typography>
            )}
            {props.role !== "député" && (
              <Typography variant="body1" fontWeight="light" textAlign="end">
                {props.autocompletion}
              </Typography>
            )}
          </Stack>
        </div>
      </Stack>
    </Link>
  );
}

// For name-based results (internal API) — data already available, no extra query needed
function PrismaActeurOption({ acteur }: { acteur: Acteur }) {
  if (!acteur.slug) return null;
  return (
    <Link href={`/depute/${acteur.slug}`}>
      <Stack direction="row" spacing={1.5}>
        <Avatar
          sx={{ height: 46, width: 46 }}
          alt={"photo de " + acteur.prenom + " " + acteur.nom}
          src={acteur.urlImage ?? ""}
        >
          {acteur.prenom?.[0]?.toUpperCase()}
          {acteur.nom?.[0]?.toUpperCase()}
        </Avatar>
        <div style={{ flexGrow: 1 }}>
          <Typography variant="body1" fontWeight="bold">
            {acteur.prenom} {acteur.nom}
          </Typography>
        </div>
      </Stack>
    </Link>
  );
}
