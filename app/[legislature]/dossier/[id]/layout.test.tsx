import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Layout from "./layout";

const state = vi.hoisted(() => ({
  code: "1", amendments: 1, votes: 1,
  getDebats: vi.fn(() => new Promise(() => {})),
}));
vi.mock("@/data/getDebats", () => ({ getDebats: state.getDebats }));
vi.mock("@/data/getDossier", () => ({ getDossier: async () => ({
  titre: "Dossier test", codeProcedure: state.code, actesLegislatifs: [],
}) }));
vi.mock("@/data/getDossierCounts", () => ({
  getAmendementCount: async () => state.amendments,
  getScrutinCount: async () => state.votes,
}));
vi.mock("@/data/mongo/getDossierEnrichment", () => ({ getDossierEnrichment: async () => null }));
vi.mock("./dataFunctions", () => ({ getCurrentStatus: () => "" }));
vi.mock("@/components/folders/HeroSection", () => ({ HeroSection: () => null }));
vi.mock("@/components/folders/ComprendreBanner", () => ({ default: () => null }));
vi.mock("@/components/folders/MonDeputeSurDossier", () => ({ default: () => null }));
vi.mock("@/components/navigation/TabRouteSkeleton", () => ({ default: () => null }));
vi.mock("@/components/navigation/TabNavigation", () => ({
  TabNavigationProvider: ({ children }: React.PropsWithChildren) => children,
  TabNavigationContent: ({ children }: React.PropsWithChildren) => children,
}));
vi.mock("./Tabs", () => ({ default: (props: { hasAmendements: boolean; hasVotes: boolean; showComptesRendus: boolean }) =>
  <nav aria-label="Onglets" data-amendements={props.hasAmendements}
    data-votes={props.hasVotes} data-comptes-rendus={props.showComptesRendus} />,
}));

beforeEach(() => { vi.clearAllMocks(); state.code = "1"; state.amendments = 1; state.votes = 1; });

async function render() {
  return renderToStaticMarkup(await Layout({ params: Promise.resolve({ legislature: "17", id: "DLR5L17N54372" }), children: <p>Contenu</p> }));
}

describe("Priorité des onglets dossiers", () => {
  it("affiche les onglets sans attendre la liste complète des comptes rendus", async () => {
    expect(await render()).toContain('aria-label="Onglets"');
    expect(state.getDebats).not.toHaveBeenCalled();
  });
  it("conserve les indicateurs des onglets sans amendement ni vote", async () => {
    state.amendments = 0; state.votes = 0;
    const html = await render();
    expect(html).toContain('data-amendements="false"');
    expect(html).toContain('data-votes="false"');
  });
  it.each(["9", "10"])("conserve les comptes rendus des missions/enquêtes %s", async code => {
    state.code = code;
    expect(await render()).toContain('data-comptes-rendus="true"');
    expect(state.getDebats).not.toHaveBeenCalled();
  });
});
