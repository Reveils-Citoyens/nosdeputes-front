/**
 * Lecture d'un acteur depuis le navigateur, par notre route /api/acteurs.
 *
 * Avec un délai maximal et un nouvel essai : sans eux, une requête restée sans
 * réponse (route en cours de compilation, base momentanément lente) laissait
 * les cartes d'auteur en squelette indéfiniment, par exemple dans les
 * résultats de recherche d'amendements.
 */
const DELAI_MS = 8000;
const ESSAIS = 2;

export async function lireActeurNavigateur<T>(parametre: "uid" | "slug", valeur: string): Promise<T | null> {
  for (let essai = 1; essai <= ESSAIS; essai++) {
    try {
      const reponse = await fetch(`/api/acteurs?${parametre}=${encodeURIComponent(valeur)}`, {
        signal: AbortSignal.timeout(DELAI_MS),
      });
      // 404 : acteur inconnu, inutile de réessayer.
      if (reponse.status === 404) return null;
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      const { data } = await reponse.json();
      return (data ?? null) as T | null;
    } catch (erreur) {
      if (essai === ESSAIS) {
        console.warn("Acteur indisponible", parametre, valeur, erreur);
        return null;
      }
    }
  }
  return null;
}
