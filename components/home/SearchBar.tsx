"use client";
import * as React from "react";
import Image from "next/image";
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
import { Dossier } from "@prisma/client";
import { searchDossier } from "@/data/searchDossier";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  type CirconscriptionLegislativeSuggestion,
  deputeAutocompletions,
} from "@/data/autocomplet/suggestions";
import { useQuery } from "@tanstack/react-query";
import { getActeur } from "@/data/getActeur";

const fetchActeurs = debounce(
  (
    search: string,
    callback: (results: readonly CirconscriptionLegislativeSuggestion[]) => void
  ) => deputeAutocompletions(search).then(callback)
);

const fetchDossiers = debounce(
  (search: string, callback: (results: null | readonly Dossier[]) => void) =>
    searchDossier({ search }).then((result) => callback(result?.data ?? null))
);
const emptyOptions = [] as const;

function isActeur(
  item: Dossier | CirconscriptionLegislativeSuggestion
): item is CirconscriptionLegislativeSuggestion {
  return (item as CirconscriptionLegislativeSuggestion).depute !== undefined;
}

type Require<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type Circonscription = Require<CirconscriptionLegislativeSuggestion, "depute">;
export default function SearchBar() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = React.useState<Circonscription | Dossier | null>(
    null
  );
  const [inputValue, setInputValue] = React.useState("");
  const [deputesOptions, setDeputesOptions] =
    React.useState<readonly Circonscription[]>(emptyOptions);
  const [dossierOptions, setDossierOptions] =
    React.useState<readonly Dossier[]>(emptyOptions);

  React.useEffect(() => {
    if (inputValue === "") {
      setDeputesOptions(value && isActeur(value) ? [value] : emptyOptions);
      setDossierOptions(value && !isActeur(value) ? [value] : emptyOptions);
      return undefined;
    }

    // Allow to resolve the out of order request resolution.
    let active = true;

    fetchActeurs(
      inputValue,
      (results: readonly CirconscriptionLegislativeSuggestion[]) => {
        if (!active) {
          return;
        }

        setDeputesOptions(
          results.filter(
            (suggestion): suggestion is Circonscription =>
              suggestion.depute !== undefined && suggestion.score > 0.5
          )
        );
      }
    );
    fetchDossiers(inputValue, (results: null | readonly Dossier[]) => {
      if (!active) {
        return;
      }

      if (results === null) {
        setDossierOptions(emptyOptions);
        return;
      }
      setDossierOptions(results);
    });

    return () => {
      active = false;
    };
  }, [value, inputValue]);

  const options: (Circonscription | Dossier)[] = React.useMemo(
    () => [...deputesOptions.slice(0, 5), ...dossierOptions.slice(0, 5)],
    [deputesOptions, dossierOptions]
  );

  return (
    <Box sx={{ maxWidth: 709, width: "100%" }}>
      <Autocomplete
        getOptionLabel={(option) => {
          if (typeof option === "string") {
            return option;
          }
          if (isActeur(option)) {
            return `${option.depute.etatCivil.ident.prenom} ${option.depute.etatCivil.ident.nom}`;
          }
          return option.titre!;
        }}
        slotProps={{
            paper: {
              sx: {
                marginTop: "8px",
                borderRadius: "20px",
                boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
                "&:empty": { display: "none" }
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
                }
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
          if (isActeur(option)) {
            return (
              <li key={key} {...props} style={{ padding: '12px 10px' }}>
                <ActeurOption {...option} />
              </li>
            );
          }
          return (
            <li key={key} {...props} style={{ padding: '12px 10px' }}>
              <Link
                href={`/17/dossier/${option.uid}`}
                style={{ width: "100%" }}
              >
                {option.titre}
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
            {props.depute.etatCivil.ident.prenom}{" "}
            {props.depute.etatCivil.ident.nom}
            
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
