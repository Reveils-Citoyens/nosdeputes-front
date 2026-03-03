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
import { Dossier } from "@prisma/client";
import { searchDossier } from "@/data/searchDossier";
import { searchActeur, ActeurWithGroupe } from "@/data/searchActeur";
import { useRouter } from "next/navigation";
import { TYPES_DE_DOSSIERS } from "@/components/const";

// ─── Circo search (code4code.eu) — désactivé pour l'instant, à réactiver si besoin ───
// import {
//   type CirconscriptionLegislativeSuggestion,
//   deputeAutocompletions,
// } from "@/data/autocomplet/suggestions";
// import { useQuery } from "@tanstack/react-query";
// import { getActeur } from "@/data/getActeur";
//
// type Require<T, K extends keyof T> = T & { [P in K]-?: T[P] };
// type Circonscription = Require<CirconscriptionLegislativeSuggestion, "depute">;
//
// const ENABLE_CIRCO_SEARCH = false;
//
// const fetchActeurs = debounce(
//   (search: string, callback: (results: readonly CirconscriptionLegislativeSuggestion[]) => void) =>
//     deputeAutocompletions(search).then(callback)
// );
// ─────────────────────────────────────────────────────────────────────────────

const fetchActeursByName = debounce(
  (search: string, callback: (results: ActeurWithGroupe[]) => void) =>
    searchActeur(search).then(callback)
);

const fetchDossiers = debounce(
  (search: string, callback: (results: null | readonly Dossier[]) => void) =>
    searchDossier({ search }).then((result) => callback(result?.data ?? null))
);

const emptyOptions = [] as const;

type SearchOption = ActeurWithGroupe | Dossier;

function isActeur(item: SearchOption): item is ActeurWithGroupe {
  return "prenom" in item;
}

export default function SearchBar() {
  const router = useRouter();
  const [inputValue, setInputValue] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [acteurOptions, setActeurOptions] =
    React.useState<readonly ActeurWithGroupe[]>(emptyOptions);
  const [dossierOptions, setDossierOptions] =
    React.useState<readonly Dossier[]>(emptyOptions);

  React.useEffect(() => {
    if (inputValue === "") {
      setIsSearching(false);
      setActeurOptions(emptyOptions);
      setDossierOptions(emptyOptions);
      return undefined;
    }

    let active = true;
    setIsSearching(true);

    fetchActeursByName(inputValue, (results: ActeurWithGroupe[]) => {
      if (!active) return;
      setActeurOptions(results);
      setIsSearching(false);
    });

    fetchDossiers(inputValue, (results: null | readonly Dossier[]) => {
      if (!active) return;
      setDossierOptions(results ?? emptyOptions);
    });

    return () => {
      active = false;
    };
  }, [inputValue]);

  const options: SearchOption[] = React.useMemo(
    () => [...acteurOptions.slice(0, 5), ...dossierOptions.slice(0, 5)],
    [acteurOptions, dossierOptions]
  );

  return (
    <Box sx={{ maxWidth: 709, width: "100%" }}>
      <Autocomplete
        getOptionLabel={(option) => {
          if (typeof option === "string") return option;
          if (isActeur(option)) return `${option.prenom} ${option.nom}`;
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
        inputValue={inputValue}
        value={null}
        noOptionsText={isSearching ? "" : "Aucun résultat"}
        openOnFocus={false}
        open={inputValue.length > 2}
        groupBy={(option) =>
          isActeur(option) ? "Député·e·s" : "Dossiers législatifs"
        }
        renderGroup={(params) => (
          <li key={params.key}>
            <Box sx={{ px: 2.5, pt: 1.5, pb: 0.75 }}>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  letterSpacing: "0.07em",
                  color: "text.primary",
                  textTransform: "uppercase",
                }}
              >
                {params.group}
              </Typography>
            </Box>
            <ul style={{ padding: 0 }}>{params.children}</ul>
          </li>
        )}
        onInputChange={(event, newInputValue, reason) => {
          // Ignorer 'reset' (sélection d'une option) pour éviter de relancer le search
          if (reason === "input") setInputValue(newInputValue);
          if (reason === "clear") setInputValue("");
        }}
        onChange={(event, selectedOption) => {
          if (!selectedOption || typeof selectedOption === "string") return;
          setInputValue("");
          if (isActeur(selectedOption)) {
            const slug = selectedOption.slug;
            if (slug) router.push(`/depute/${slug}`);
          } else {
            const d = selectedOption as Dossier;
            router.push(`/${d.legislature ?? 17}/dossier/${d.uid}`);
          }
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
            placeholder="Entrez un nom de député ou un nom de dossier législatif"
            inputProps={{ ...params.inputProps }}
            InputProps={{
              ...params.InputProps,
            }}
          />
        )}
        renderOption={({ key, ...props }, option) => {
          if (isActeur(option)) {
            return (
              <li key={key} {...props} style={{ padding: "8px 16px" }}>
                <ActeurOption acteur={option} />
              </li>
            );
          }
          return (
            <li key={key} {...props} style={{ padding: "8px 16px" }}>
              <DossierOption dossier={option as Dossier} />
            </li>
          );
        }}
      />
      <Typography variant="caption" sx={{ mt: 2 }} fontWeight="light">
        Ex. Yaël Braun-Pivet, Loi Finance, ...
      </Typography>
    </Box>
  );
}

function ActeurOption({ acteur }: { acteur: ActeurWithGroupe }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
      <Avatar
        sx={{ height: 46, width: 46, flexShrink: 0 }}
        alt={`photo de ${acteur.prenom} ${acteur.nom}`}
        src={acteur.urlImage ?? ""}
      >
        {acteur.prenom?.[0]?.toUpperCase()}
        {acteur.nom?.[0]?.toUpperCase()}
      </Avatar>
      <Box>
        <Typography variant="body2" fontWeight={700} lineHeight={1.3}>
          {acteur.prenom} {acteur.nom}
        </Typography>
        {acteur.groupeParlementaire?.libelleTronque && (
          <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
            {acteur.groupeParlementaire.libelleTronque}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

const DOSSIER_ABBREV: Record<string, string> = {
  "1": "PL",
  "2": "PP",
  "3": "LF",
  "4": "SS",
  "5": "LO",
  "6": "RT",
  "7": "LC",
  "8": "RS",
  "9": "CE",
  "10": "MI",
  "13": "49",
  "16": "PT",
  "17": "MR",
  "19": "RI",
};

function DossierOption({ dossier }: { dossier: Dossier }) {
  const typeInfo = TYPES_DE_DOSSIERS.find(
    (t) => t.code === dossier.codeProcedure
  );
  const typeLabel = typeInfo?.label ?? "Dossier législatif";
  const abbrev = (dossier.codeProcedure && DOSSIER_ABBREV[dossier.codeProcedure]) ?? "DL";

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: "100%" }}>
      <Avatar
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          bgcolor: "transparent",
          border: "1.5px solid",
          borderColor: "grey.400",
          color: "grey.600",
          fontSize: "0.8rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
        }}
      >
        {abbrev}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          fontWeight={700}
          lineHeight={1.3}
          sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {dossier.titre}
        </Typography>
        <Typography variant="caption" color="text.secondary" lineHeight={1.3}>
          {typeLabel}
        </Typography>
      </Box>
    </Stack>
  );
}

// ─── Circo search — kept for future reactivation ────────────────────────────
// export function ActeurOptionFromCirco(props: Circonscription) {
//   const { data: acteur } = useQuery({
//     queryKey: ["acteur", props.depute.uid],
//     queryFn: async () =>
//       props.depute.uid == null ? null : await getActeur(props.depute.uid),
//     enabled: !!props.depute.uid,
//   });
//
//   const { nom, prenom } = props.depute.etatCivil.ident;
//   if (!acteur) return null;
//
//   return (
//     <Link href={`/depute/${acteur.slug}`} style={{ width: "100%" }}>
//       <Stack direction="row" spacing={1.5} alignItems="center">
//         <Avatar sx={{ height: 46, width: 46 }} src={acteur.urlImage ?? ""}>
//           {prenom[0].toUpperCase()}{nom[0].toUpperCase()}
//         </Avatar>
//         <Box>
//           <Typography variant="body2" fontWeight={700}>{prenom} {nom}</Typography>
//           {props.circonscription_legislative && (
//             <Typography variant="caption" color="text.secondary">
//               {props.circonscription_legislative.libelle}
//             </Typography>
//           )}
//         </Box>
//       </Stack>
//     </Link>
//   );
// }
// ─────────────────────────────────────────────────────────────────────────────
