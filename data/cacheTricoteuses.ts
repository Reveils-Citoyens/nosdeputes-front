/**
 * Durées de cache des appels à l'API Tricoteuses (cache de données de Next).
 *
 * Next ne conserve que les réponses HTTP 200 et sert une entrée expirée
 * immédiatement en la rafraîchissant en arrière-plan : la durée règle la
 * fraîcheur des données, pas le temps de réponse d'une instance déjà servie.
 * Sans option, `fetch` n'est pas mis en cache (Next 15) et chaque visite
 * repayait tous les appels.
 *
 * Côté navigateur, l'option `next` est ignorée : ces helpers peuvent être
 * utilisés dans du code partagé client/serveur.
 */
export const DUREES_CACHE = {
  /** Référentiels : organes, mandats, coordonnées. */
  stable: 86400,
  /** Contenus : dossiers, députés, documents, recherches de textes. */
  contenu: 3600,
  /** Activité en cours : votes, amendements, compteurs. */
  activite: 60,
} as const;

export function cacheTricoteuses(duree: keyof typeof DUREES_CACHE): RequestInit {
  return { next: { revalidate: DUREES_CACHE[duree] } };
}
