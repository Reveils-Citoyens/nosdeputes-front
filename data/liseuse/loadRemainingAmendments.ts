export type AmendmentsPage<T> = { items: T[]; total: number; totalIsKnown?: boolean };

/** Conserve tous les résultats, même si l'API ne fournit pas de total. */
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
    const pages = await Promise.all(Array.from({ length: remainingPages }, (_, i) => loadPage(i + 2)));
    const items = pages.flatMap(checkPage);
    if (items.length + first.items.length !== first.total) {
      throw new Error("Incomplete amendment pagination");
    }
    return items;
  }
  // Sans total, on ne peut pas déduire le nombre de pages de "perPage + 1".
  const items: T[] = [];
  for (let page = 2; ; page++) {
    const next = await loadPage(page);
    items.push(...checkPage(next));
    if (next.items.length < perPage) return items;
  }
}
