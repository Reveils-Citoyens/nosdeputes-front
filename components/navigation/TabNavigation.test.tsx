import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TabNavigationContent, TabNavigationLoading, TabNavigationProvider, useTabNavigation } from "./TabNavigation";
import TabRouteSkeleton from "./TabRouteSkeleton";
import DossierTabs from "@/app/[legislature]/dossier/[id]/Tabs";
import DeputeTabs from "@/app/depute/[slug]/Tabs";

const state = vi.hoisted(() => ({
  actual: null as string | null,
  optimistic: undefined as string | undefined,
  select: vi.fn(),
  push: vi.fn(),
  transition: vi.fn((callback: () => void) => callback()),
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useOptimistic: (actual: string) => [state.optimistic ?? actual, state.select],
  startTransition: state.transition,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: state.push }),
  useSelectedLayoutSegment: () => state.actual,
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: { initialData?: unknown }) => ({ data: options.initialData }),
}));

let navigation: ReturnType<typeof useTabNavigation>;
function Probe() {
  navigation = useTabNavigation();
  return <span data-selected-segment={navigation.segment} />;
}

function render(children: React.ReactNode = <Probe />, kind: "depute" | "dossier" = "depute") {
  return renderToStaticMarkup(
    <TabNavigationProvider fallback={<TabRouteSkeleton kind={kind} />}>
      {children}
      <TabNavigationContent><p>Contenu de la page courante</p></TabNavigationContent>
    </TabNavigationProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  state.actual = null;
  state.optimistic = undefined;
});

describe("Navigation immédiate des onglets", () => {
  it("rend le contenu initial sans écran de chargement", () => {
    const html = render();
    expect(html).toContain("Contenu de la page courante");
    expect(html).not.toContain('role="status"');
    expect(navigation.segment).toBe("");
  });

  it("remplace immédiatement l'ancien contenu par un skeleton accessible", () => {
    state.optimistic = "votes";
    const html = render();
    expect(navigation.segment).toBe("votes");
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Contenu de la page courante");
  });

  it("réaffiche le contenu dès que la route rejoint l'onglet sélectionné", () => {
    state.actual = "votes";
    state.optimistic = "votes";
    expect(render()).toContain("Contenu de la page courante");
    expect(navigation.isNavigating).toBe(false);
  });

  it("suit la route après retour arrière, lien direct ou fin de transition", () => {
    state.actual = "amendements";
    render();
    expect(navigation.segment).toBe("amendements");
    state.actual = null;
    render();
    expect(navigation.segment).toBe("");
    expect(navigation.isNavigating).toBe(false);
  });

  it("sélectionne et navigue dans la même transition sans remplacer l'historique", () => {
    render();
    const event = { preventDefault: vi.fn() };
    navigation.navigate(event, "/17/dossier/DLR5L17N54372/votes", "votes");
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(state.transition).toHaveBeenCalledOnce();
    expect(state.select).toHaveBeenCalledWith("votes");
    expect(state.push).toHaveBeenCalledWith("/17/dossier/DLR5L17N54372/votes");
  });

  it("sélectionne le nouvel onglet de député avant l'arrivée de la route", () => {
    state.optimistic = "travaux";
    const html = render(<DeputeTabs slug="francois-ruffin" />);
    expect(html).toMatch(/aria-selected="true"[^>]*href="\/depute\/francois-ruffin\/travaux"/);
    expect(html).toMatch(/href="\/depute\/francois-ruffin\/?"/);
    expect(html).toContain("Chargement des travaux législatifs du député");
  });

  it("ne sélectionne pas d'onglet pour le détail quotidien du député", () => {
    state.actual = "activite-inconnue";
    expect(render(<DeputeTabs slug="francois-ruffin" />)).not.toContain('aria-selected="true"');
  });

  it("conserve les onglets désactivés et les liens directs vers les réunions", () => {
    state.optimistic = "commission";
    const html = render(<DossierTabs
      legislature="17" dossierUid="DLR5L17N54372"
      showApercu showDebats showAmendements showVotes
      hasAmendements hasVotes={false}
      initialDebats={[{
        uid: "CRCANR5L17S2026PO420120N001", debateType: "commission",
        _count: { paragraphes: 10 },
      }] as React.ComponentProps<typeof DossierTabs>["initialDebats"]}
    />, "dossier");
    expect(html).toMatch(/aria-selected="true"[^>]*href="\/17\/dossier\/DLR5L17N54372\/commission\/CRCANR5L17S2026PO420120N001"/);
    expect(html).toMatch(/aria-disabled="true"[^>]*href="\/17\/dossier\/DLR5L17N54372\/votes"/);
    expect(html).toMatch(/aria-disabled="true"[^>]*href="\/17\/dossier\/DLR5L17N54372\/debat"/);
  });

  it("rend les liens commission/séance pendant la recherche puis désactive une absence confirmée", () => {
    const props = { legislature: "17", dossierUid: "DLR5L17N54372", showApercu: true,
      showDebats: true, showAmendements: true, showVotes: true, hasAmendements: true, hasVotes: true };
    const pending = render(<DossierTabs {...props} />, "dossier");
    expect(pending).toContain('href="/17/dossier/DLR5L17N54372/commission"');
    expect(pending).toContain('href="/17/dossier/DLR5L17N54372/debat"');
    expect(pending).not.toContain('aria-disabled="true"');
    const empty = render(<DossierTabs {...props} initialDebats={[]} />, "dossier");
    expect(empty).toMatch(/aria-disabled="true"[^>]*href="\/17\/dossier\/DLR5L17N54372\/commission"/);
    expect(empty).toMatch(/aria-disabled="true"[^>]*href="\/17\/dossier\/DLR5L17N54372\/debat"/);
  });

  it.each([
    ["depute", "", "Chargement de l’activité du député"],
    ["depute", "travaux", "Chargement des travaux législatifs du député"],
    ["depute", "amendements", "Chargement des amendements du député"],
    ["depute", "votes", "Chargement des votes du député"],
    ["depute", "qag", "Chargement des questions du député"],
    ["depute", "activite", "Chargement du détail quotidien du député"],
    ["dossier", "", "Chargement de l’aperçu du dossier"],
    ["dossier", "amendement", "Chargement du texte et des amendements"],
    ["dossier", "votes", "Chargement des votes du dossier"],
    ["dossier", "commission", "Chargement des réunions en commission"],
    ["dossier", "debat", "Chargement des débats en séance"],
    ["dossier", "comptes-rendus", "Chargement des comptes rendus"],
  ] as const)("choisit le skeleton %s/%s même si l'URL est encore sur un autre onglet", (kind, segment, label) => {
    state.actual = "autre";
    state.optimistic = segment;
    expect(render(<Probe />, kind)).toContain(`aria-label="${label}"`);
  });

  it("utilise le même skeleton au clic et au chargement serveur de la route", () => {
    function routeFallback() {
      return renderToStaticMarkup(<TabNavigationProvider fallback={<TabRouteSkeleton kind="depute" />}>
        <TabNavigationContent><TabNavigationLoading /></TabNavigationContent>
      </TabNavigationProvider>);
    }
    state.optimistic = "votes";
    const optimistic = routeFallback();
    state.actual = "votes";
    state.optimistic = undefined;
    expect(routeFallback()).toBe(optimistic);
  });
});
