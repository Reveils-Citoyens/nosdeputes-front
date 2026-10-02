"use client";

import React, { createContext, useContext, useOptimistic, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getPageNavigationTarget, type PageNavigationTarget } from "./pageNavigationTarget";
import SearchPageSkeleton from "./SearchPageSkeleton";
import DeputePageSkeleton from "./DeputePageSkeleton";
import MainPageSkeleton from "./MainPageSkeleton";
import HomePageSkeleton from "./HomePageSkeleton";
import ThemeDestinationSkeleton from "./ThemeDestinationSkeleton";
import DossierPageSkeleton from "./DossierPageSkeleton";

type Router = ReturnType<typeof useRouter>;
type NavigateOptions = NonNullable<Parameters<Router["push"]>[1]> & { replace?: boolean };
type PageNavigation = {
  target: PageNavigationTarget | null;
  navigate: (href: string, options?: NavigateOptions) => void;
};

const PageNavigationContext = createContext<PageNavigation | null>(null);

export function PageNavigationProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  // Base state is always null: completion, errors and cancelled transitions
  // automatically restore the route's real content, without timers/history hacks.
  const [target, selectTarget] = useOptimistic<PageNavigationTarget | null>(null);

  function navigate(href: string, options?: NavigateOptions) {
    startTransition(() => {
      const nextTarget = getPageNavigationTarget(href, pathname);
      selectTarget(nextTarget ? { ...nextTarget, scroll: options?.scroll } : null);
      const { replace, ...routerOptions } = options ?? {};
      if (replace) router.replace(href, routerOptions);
      else router.push(href, routerOptions);
    });
  }

  return <PageNavigationContext.Provider value={{ target: isPending ? target : null, navigate }}>
    {children}
  </PageNavigationContext.Provider>;
}

export function usePageNavigation() {
  return useContext(PageNavigationContext);
}

/** Select the destination in the navbar before the server commits its URL. */
export function useNavigationPathname() {
  const pathname = usePathname();
  const navigation = usePageNavigation();
  return (navigation?.target?.href.split(/[?#]/)[0] ?? pathname).replace(/\/+$/, "") || "/";
}

/** Include programmatic autocomplete/Enter navigation, not just link clicks. */
export function useFeedbackRouter(): Router {
  const router = useRouter();
  const navigation = usePageNavigation();
  return {
    ...router,
    push: (href, options) => navigation ? navigation.navigate(href, options) : router.push(href, options),
    replace: (href, options) => navigation ? navigation.navigate(href, { ...options, replace: true }) : router.replace(href, options),
  };
}

export function PageNavigationContent({ children }: React.PropsWithChildren) {
  const navigation = usePageNavigation();
  const target = navigation?.target;
  React.useLayoutEffect(() => {
    // The source may be scrolled far down. Reveal the target header at once,
    // rather than retaining that offset until Next commits the real route.
    if (target && target.scroll !== false && !target.href.includes("#")) window.scrollTo(0, 0);
  }, [target]);
  if (navigation?.target?.kind === "search") return <SearchPageSkeleton query={navigation.target.query} />;
  if (navigation?.target?.kind === "depute") return <DeputePageSkeleton />;
  if (navigation?.target?.kind === "main") return <MainPageSkeleton page={navigation.target.page} />;
  if (navigation?.target?.kind === "home") return <HomePageSkeleton />;
  if (navigation?.target?.kind === "domain" || navigation?.target?.kind === "theme") return <ThemeDestinationSkeleton kind={navigation.target.kind} slug={navigation.target.slug} />;
  if (navigation?.target?.kind === "dossier") return <DossierPageSkeleton />;
  return <>{children}</>;
}
