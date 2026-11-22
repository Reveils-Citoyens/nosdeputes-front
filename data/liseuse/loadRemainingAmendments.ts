export type AmendmentsPage<T> = { items: T[]; total: number; totalIsKnown?: boolean };

/** Conserve tous les résultats, même si l'API ne fournit pas de total. */
/**
 * Pages chargées en même temps. Lancer les 27 pages du PLF d'un coup
 * multipliait les requêtes lourdes simultanées vers l'API, au risque de la
 * ralentir ou de déclencher sa limitation, et une seule page lente faisait
 * échouer l'ensemble.
 */
const PAGES_SIMULTANEES = 4;

/** Une page en échec est retentée une fois : une lenteur passagère de l'API ne suffit plus à tout perdre. */
async function avecUnNouvelEssai<R>(charger: () => Promise<R>): Promise<R> {
  try {
    return await charger();
  } catch {
    return charger();
  }
}

/** Charge les pages par groupes de PAGES_SIMULTANEES, en conservant leur ordre. */
async function chargerParGroupes<R>(numeros: number[], charger: (page: number) => Promise<R>): Promise<R[]> {
  const resultats: R[] = new Array(numeros.length);
  let suivant = 0;
  const travailleur = async () => {
    while (suivant < numeros.length) {
      const index = suivant++;
      resultats[index] = await avecUnNouvelEssai(() => charger(numeros[index]));
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAGES_SIMULTANEES, numeros.length) }, travailleur));
  return resultats;
}

export async function loadRemainingAmendments<T>(
  first: AmendmentsPage<T>,
  perPage: number,
  loadPage: (page: number) => Promise<AmendmentsPage<T>>,
): Promise<T[]> {
  if (first.items.length < perPage) return [];
  const seenPages = new Set([JSON.stringify(first.items)]);
  const checkPage = (page: AmendmentsPage<T>) => {
    const fingerprint = JSON.stringify(page.items);
    if (page.items.length > 0 && seenPages.has(fingerprint)) {
      throw new Error("Upstream pagination did not advance");
    }
    seenPages.add(fingerprint);
    return page.items;
  };
  if (first.totalIsKnown !== false) {
    const remainingPages = Math.max(0, Math.ceil(first.total / perPage) - 1);
    const pages = await chargerParGroupes(Array.from({ length: remainingPages }, (_, i) => i + 2), loadPage);
    const items = pages.flatMap(checkPage);
    if (items.length + first.items.length !== first.total) {
      throw new Error("Incomplete amendment pagination");
    }
    return items;
  }
  // Sans total, on ne peut pas déduire le nombre de pages de "perPage + 1".
  const items: T[] = [];
  for (let page = 2; ; page++) {
    const next = await avecUnNouvelEssai(() => loadPage(page));
    items.push(...checkPage(next));
    if (next.items.length < perPage) return items;
  }
}
