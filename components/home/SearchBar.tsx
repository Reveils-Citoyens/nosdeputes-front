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
        filterOptions={(x) => x}
        options={options}
        autoComplete
        includeInputInList
        filterSelectedOptions
        value={value}
        noOptionsText="Aucun résultat"
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
                pl: 1,
                pr: 1,
              },
            }}
            fullWidth
            placeholder="Entrez un code postal ou un nom de député"
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
              <li key={key} {...props}>
                <ActeurOption {...option} />
              </li>
            );
          }
          return (
            <li key={key} {...props}>
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
      <Typography variant="body2" sx={{ mt: 2 }} fontWeight="light">
        Yaël Braun-Pivet, Budget, Transport, 59650, Lyon, ...
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
      <Stack direction="row" spacing={2}>
        <Avatar
          sx={{ height: 42, width: 42 }}
          alt={"photo de " + prenom + " " + nom}
          src={acteur?.urlImage ?? ""}
        >
          {prenom[0].toUpperCase()}
          {nom[0].toUpperCase()}
        </Avatar>
        <div style={{ flexGrow: 1 }}>
          <Typography variant="body1">
            {props.depute.etatCivil.ident.nom}{" "}
            {props.depute.etatCivil.ident.prenom}
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="space-between">
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
