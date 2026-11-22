/**
 * `fetch` vers l'API Tricoteuses, borné dans le temps.
 *
 * Quand l'API est saturée, une requête peut attendre plus de 30 secondes avant
 * d'échouer ; plusieurs à la suite bloquaient une page plus de deux minutes.
 * Au-delà du délai, la requête est abandonnée et lève une erreur que chaque
 * appelant traite déjà (bloc masqué, liste vide) : la page s'affiche sans
 * l'élément manquant plutôt que d'attendre.
 *
 * Next.js ne conserve en cache que les réponses réussies : une requête
 * abandonnée sera retentée à la visite suivante.
 */
export const DELAI_TRICOTEUSES_MS = 8000;

/**
 * Délai des listes volumineuses qui constituent le contenu même d'une page
 * (amendements et scrutins d'un texte dans la liseuse) : 500 amendements du
 * PLF prennent 3 à 6 s quand l'API va bien, davantage à froid. Les couper à
 * 8 s affichait une erreur là où il suffisait d'attendre.
 */
export const DELAI_TRICOTEUSES_LISTE_MS = 25000;

function signalAvecDelai(delaiMs: number, signal?: AbortSignal | null): AbortSignal {
  const delai = AbortSignal.timeout(delaiMs);
  if (!signal) return delai;
  // AbortSignal.any : Node 20, navigateurs récents. Sans lui, le délai prime.
  return typeof AbortSignal.any === "function" ? AbortSignal.any([signal, delai]) : delai;
}

export function fetchTricoteuses(
  url: string | URL,
  init: RequestInit = {},
  delaiMs: number = DELAI_TRICOTEUSES_MS
): Promise<Response> {
  return fetch(url, { ...init, signal: signalAvecDelai(delaiMs, init.signal) });
}
