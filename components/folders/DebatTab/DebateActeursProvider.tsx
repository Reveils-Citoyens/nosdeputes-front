"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getActeur } from "@/data/getActeur";
import type { DebateActeur } from "@/data/getDebateActeurs";

const Context = React.createContext<{
  items: Record<string, DebateActeur>;
  pending: boolean;
} | null>(null);

export function DebateActeursProvider({ uids, children }: React.PropsWithChildren<{ uids: string[] }>) {
  const unique = [...new Set(uids)].sort();
  const { data, isPending } = useQuery({
    queryKey: ["debate-acteurs", unique],
    enabled: unique.length > 0,
    staleTime: 60_000,
    queryFn: async ({ signal }) => {
      const batches: string[][] = [];
      for (let i = 0; i < unique.length; i += 50) batches.push(unique.slice(i, i + 50));
      const items = await Promise.all(batches.map(async (batch): Promise<DebateActeur[]> => {
        const response = await fetch(`/api/debats/acteurs?uids=${encodeURIComponent(batch.join(","))}`, { signal });
        if (!response.ok) throw new Error("Actors unavailable");
        const body = await response.json();
        if (!Array.isArray(body.items)) throw new Error("Invalid actors response");
        return body.items;
      }));
      return Object.fromEntries(items.flat().map((a) => [a.uid, a]));
    },
  });
  const value = React.useMemo(() => ({
    items: data ?? {}, pending: unique.length > 0 && isPending,
  }), [data, isPending, unique.length]);
  return <Context.Provider value={value}>
    {children}
  </Context.Provider>;
}

export function useDebateActeur(uid: string | null) {
  const batch = React.useContext(Context);
  const initial = uid ? batch?.items[uid] : undefined;
  const fallback = useQuery({
    // Seul le repli utilise le cache des profils complets. Les profils
    // minimaux du batch restent dans le contexte dédié.
    queryKey: ["acteur", uid],
    queryFn: () => uid ? getActeur(uid) : null,
    enabled: !!uid && !initial && !batch?.pending,
  });
  return { data: initial ?? fallback.data, isPending: !!uid && !initial && (!!batch?.pending || fallback.isPending) };
}

export function useDebateActeurs() {
  return React.useContext(Context);
}
