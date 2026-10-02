import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DossierCard from "@/components/home/Dossiers/DossierCard";
import HomeDomains from "@/components/home/Themes/Themes";
import DomainPage from "@/app/themes/domaine/[id]/page";
import type NavigationLink from "./NavigationLink";

const state = vi.hoisted(() => ({
  navigate: vi.fn(),
  links: new Map<string, { onNavigate?: (event: { preventDefault: () => void }) => void }>(),
}));
vi.mock("./PageNavigation", () => ({ usePageNavigation: () => ({ navigate: state.navigate }) }));
vi.mock("next/link", () => ({ default: (props: React.ComponentProps<typeof NavigationLink>) => {
  state.links.set(String(props.href), props);
  return <a href={String(props.href)}>{props.children}</a>;
} }));
vi.mock("@/data/mongo/getThemeGroupCounts", () => ({ getThemeGroupCounts: async () => ({}) }));
vi.mock("@/data/mongo/getDossiersByThemeGroup", () => ({ getDossiersByThemeGroup: async () => ({ items: [], total: 0 }) }));
vi.mock("@/components/ccomptes/CComptesSection", () => ({ CComptesSection: () => null }));

beforeEach(() => { state.links.clear(); vi.clearAllMocks(); });
function activate(href: string) {
  const preventDefault = vi.fn();
  expect(state.links.get(href)?.onNavigate).toBeTypeOf("function");
  state.links.get(href)!.onNavigate!({ preventDefault });
  expect(preventDefault).toHaveBeenCalledOnce();
  expect(state.navigate).toHaveBeenLastCalledWith(href, { replace: undefined, scroll: undefined });
}

describe("Liens des contenus vers le feedback immédiat", () => {
  it("la carte dossier MUI de l'accueil transmet la navigation avec sa destination intacte", () => {
    renderToStaticMarkup(<DossierCard href="/17/dossier/DLR5L17N54372" titre="Protection des enfants" typeLabel="Projet de loi" badge={null} tldr={null} themes={[]} />);
    activate("/17/dossier/DLR5L17N54372");
  });
  it("les cartes domaines serveur de l'accueil utilisent le même feedback", async () => {
    renderToStaticMarkup(await HomeDomains());
    activate("/themes/domaine/sante-solidarites");
  });
  it("les thèmes inclus et le retour d'un domaine ne restent pas sur des liens sans feedback", async () => {
    const html = renderToStaticMarkup(await DomainPage({ params: Promise.resolve({ id: "sante-solidarites" }) }));
    expect(html).toContain("Santé &amp; solidarités");
    activate("/themes/famille");
    activate("/themes/questions_sociales_et_sante");
    activate("/themes");
  });
});
