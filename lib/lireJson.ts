/** Réponse JSON d'une route du site ; une erreur HTTP fait échouer la requête. */
export async function lireJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const reponse = await fetch(url, { signal });
  if (!reponse.ok) throw new Error(`${url} : HTTP ${reponse.status}`);
  return (await reponse.json()) as T;
}
