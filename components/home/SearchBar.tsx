"use client";
import * as React from "react";
import Image from "next/image";
import {
  Autocomplete,
  TextField,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import debounce from "@/utils/debounce";
import { Dossier } from "@prisma/client";
import { ReturnedSearchActeur, searchActeur } from "@/data/searchActeur";
import { searchDossier } from "@/data/searchDossier";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ActeurOption } from "./ActeurOption";

const fetchActeurs = debounce(
  (
    search: string,
    callback: (results: null | readonly ReturnedSearchActeur[]) => void
  ) => searchActeur(search).then(callback)
);

const fetchDossiers = debounce(
  (search: string, callback: (results: null | readonly Dossier[]) => void) =>
    searchDossier({ search }).then((result) => callback(result?.data ?? null))
);
const emptyOptions = [] as const;

function isActeur(
  item: Dossier | ReturnedSearchActeur
): item is ReturnedSearchActeur {
  return (item as ReturnedSearchActeur).prenom !== undefined;
}

export default function SearchBar() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = React.useState<
    ReturnedSearchActeur | Dossier | null
  >(null);
  const [inputValue, setInputValue] = React.useState("");
  const [deputesOptions, setDeputesOptions] =
    React.useState<readonly ReturnedSearchActeur[]>(emptyOptions);
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
      (results: null | readonly ReturnedSearchActeur[]) => {
        if (!active) {
          return;
        }

        if (results === null) {
          setDeputesOptions(emptyOptions);
          return;
        }
        setDeputesOptions(results);
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

  const options: (ReturnedSearchActeur | Dossier)[] = React.useMemo(
    () => [...deputesOptions, ...dossierOptions],
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
            return `${option.prenom} ${option.nom}`;
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
        onChange={(
          event: any,
          newValue: ReturnedSearchActeur | Dossier | null
        ) => {
          if (newValue && isActeur(newValue)) {
            setDeputesOptions([newValue, ...deputesOptions]);
            startTransition(() => {
              router.push(`/depute/${newValue.slug}`);
            });
          }
          if (newValue && !isActeur(newValue)) {
            setDossierOptions([newValue, ...dossierOptions]);
            startTransition(() => {
              router.push(`/17/dossier/${newValue.uid}`);
            });
          }
          setValue(newValue);
        }}
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
                <Link
                  href={`/depute/${option.slug}`}
                  onClick={(e) => {
                    // Prevent default navigation since onChange handles it
                    // This allows right-click/open in new tab to still work via href
                    e.preventDefault();
                  }}
                >
                  <ActeurOption {...option} />
                </Link>
              </li>
            );
          }
          return (
            <li key={key} {...props}>
              <Link
                href={`/17/dossier/${option.uid}`}
                onClick={(e) => {
                  // Prevent default navigation since onChange handles it
                  // This allows right-click/open in new tab to still work via href
                  e.preventDefault();
                }}
              >
                {option.titre}
              </Link>
            </li>
          );
        }}
      />

      <Typography variant="body2" sx={{ mt: 2 }} fontWeight="light">
        Yaël Braun-Pivet, Budget, Transport
      </Typography>
    </Box>
  );
}
