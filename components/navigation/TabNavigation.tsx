"use client";

import React, { createContext, startTransition, useContext, useOptimistic } from "react";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";

export type TabNavigateEvent = { preventDefault(): void };

type TabNavigation = {
  segment: string;
  isNavigating: boolean;
  navigate: (event: TabNavigateEvent, href: string, segment: string) => void;
  fallback: React.ReactNode;
};

const TabNavigationContext = createContext<TabNavigation | null>(null);

/** The URL stays authoritative; the optimistic selection only lasts for the
 * router transition. Back/forward, redirects and failed navigations therefore
 * cannot leave a permanently selected tab that differs from the actual route.
 */
export function TabNavigationProvider({ children, fallback }: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const router = useRouter();
  const actualSegment = useSelectedLayoutSegment() ?? "";
  const [segment, selectSegment] = useOptimistic(actualSegment);

  function navigate(event: TabNavigateEvent, href: string, target: string) {
    // This handler is only passed to Link.onNavigate: Cmd/Ctrl-click, middle
    // click and native open-in-new-tab keep their normal link behavior.
    event.preventDefault();
    startTransition(() => {
      selectSegment(target);
      router.push(href);
    });
  }

  return (
    <TabNavigationContext.Provider value={{
      segment,
      isNavigating: segment !== actualSegment,
      navigate,
      fallback,
    }}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const navigation = useContext(TabNavigationContext);
  if (!navigation) throw new Error("Tab navigation must be inside its provider");
  return navigation;
}

export function TabNavigationContent({ children }: { children: React.ReactNode }) {
  const { isNavigating, fallback } = useTabNavigation();
  // Do not show the previous tab's content under the newly selected tab.
  return <>{isNavigating ? fallback : children}</>;
}

/** Reuse the parent-configured target skeleton for Next's route fallback. */
export function TabNavigationLoading() {
  const { fallback } = useTabNavigation();
  return <>{fallback}</>;
}
