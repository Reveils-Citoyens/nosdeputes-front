"use client";

import * as React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { QuestionAnswer as QuestionIcon } from "@mui/icons-material";
import type { FamilleQuestions, QuestionSearchResult } from "@/data/mongo/searchQuestion";
import SearchQuestionCard from "./SearchQuestionCard";
import QuestionsLoadMore from "./QuestionsLoadMore";
import SectionShell, { EmptyRow } from "./SectionShell";

/** Premiers résultats affichés, comme les autres catégories de la page. */
const PREMIERS = 5;

const FILTRES: { valeur: FamilleQuestions | null; libelle: string }[] = [
  { valeur: null, libelle: "Toutes" },
  { valeur: "orales", libelle: "Orales" },
  { valeur: "ecrites", libelle: "Écrites" },
];

type ApiItem = Omit<QuestionSearchResult, "dateDepot"> & { dateDepot: string | null };

/**
 * Section « Questions » de /recherche, filtrable sans recharger la page :
 * seules les questions sont redemandées. Le filtre est reporté dans l'adresse
 * (`questions=orales`), pour qu'un lien partagé l'affiche.
 */
export default function QuestionsResultats({
  initialItems,
  initialTotal,
  initialFamille,
  query,
  legislature,
  sort,
}: {
  initialItems: QuestionSearchResult[];
  initialTotal: number;
  initialFamille: FamilleQuestions | null;
  query: string;
  legislature: string | null;
  sort: "relevance" | "date";
}) {
  const [famille, setFamille] = React.useState(initialFamille);
  const [resultats, setResultats] = React.useState({ items: initialItems, total: initialTotal });
  const [chargement, setChargement] = React.useState(false);
  const [erreur, setErreur] = React.useState(false);
  const requete = React.useRef<AbortController | null>(null);

  // Nouvelle recherche (navigation) : on repart des résultats du serveur.
  React.useEffect(() => {
    setFamille(initialFamille);
    setResultats({ items: initialItems, total: initialTotal });
  }, [initialItems, initialTotal, initialFamille]);

  const choisir = async (valeur: FamilleQuestions | null) => {
    if (valeur === famille) return;
    setFamille(valeur);
    setErreur(false);

    // Adresse à jour sans navigation : le reste de la page ne bouge pas.
    const url = new URL(window.location.href);
    if (valeur) url.searchParams.set("questions", valeur);
    else url.searchParams.delete("questions");
    window.history.replaceState(window.history.state, "", url);

    requete.current?.abort();
    const controleur = new AbortController();
    requete.current = controleur;
    setChargement(true);
    try {
      const parametres = new URLSearchParams({ q: query, skip: "0", limit: String(PREMIERS) });
      if (legislature) parametres.set("legislature", legislature);
      if (sort === "date") parametres.set("sort", "date");
      if (valeur) parametres.set("questions", valeur);
      const reponse = await fetch(`/api/search/questions?${parametres}`, { signal: controleur.signal });
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      const donnees = (await reponse.json()) as { items: ApiItem[]; total: number };
      setResultats({
        items: donnees.items.map((q) => ({ ...q, dateDepot: q.dateDepot ? new Date(q.dateDepot) : null })),
        total: donnees.total,
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") setErreur(true);
    } finally {
      if (requete.current === controleur) setChargement(false);
    }
  };

  const filtres = (
    <Stack direction="row" spacing={0.75}>
      {FILTRES.map(({ valeur, libelle }) => {
        const actif = famille === valeur;
        return (
          <Chip
            key={libelle}
            label={libelle}
            size="small"
            clickable
            onClick={() => choisir(valeur)}
            variant={actif ? "filled" : "outlined"}
            aria-pressed={actif}
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              ...(actif ? { bgcolor: "grey.900", color: "white", "&:hover": { bgcolor: "grey.800" } } : {}),
            }}
          />
        );
      })}
    </Stack>
  );

  const { items, total } = resultats;
  return (
    <SectionShell icon={QuestionIcon} title="Questions" count={total || undefined} action={filtres}>
      <Box
        aria-busy={chargement}
        sx={{ opacity: chargement ? 0.5 : 1, transition: "opacity 0.15s", pointerEvents: chargement ? "none" : "auto" }}
      >
        {erreur ? (
          <EmptyRow message="Les questions n'ont pas pu être chargées. Réessayez dans quelques instants." />
        ) : items.length === 0 ? (
          <EmptyRow
            message={
              famille === "orales"
                ? "Aucune question orale trouvée."
                : famille === "ecrites"
                  ? "Aucune question écrite trouvée."
                  : "Aucune question trouvée."
            }
          />
        ) : (
          <>
            <Stack spacing={0}>
              {items.map((q) => (
                <SearchQuestionCard key={q.uid} question={q} />
              ))}
            </Stack>
            <QuestionsLoadMore
              // Remis à zéro à chaque filtre : les questions déjà chargées n'en relèvent plus.
              key={famille ?? "toutes"}
              query={query}
              legislature={legislature}
              famille={famille}
              alreadyShown={items.length}
              total={total}
            />
          </>
        )}
      </Box>
    </SectionShell>
  );
}
