import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LiseuseClient from "@/app/[legislature]/dossier/[id]/amendement/LiseuseClient";
import LiseuseSkeleton from "./LiseuseSkeleton";
import { liseusePageSx, liseusePanelSx } from "./LiseuseLayout";

// Comme dans l'application (app/providers.tsx) : la liseuse lit les scrutins
// des amendements via React Query.
const avecRequetes = (element: React.ReactElement) =>
  renderToStaticMarkup(<QueryClientProvider client={new QueryClient()}>{element}</QueryClientProvider>);

describe("Géométrie de chargement de la liseuse", () => {
  it.each([null, [{ key: "art1", label: "Article 1er", isDivisionHeader: false }]])(
    "montre le skeleton dès le premier rendu, avec ou sans sommaire",
    initialSommaire => {
      const html = avecRequetes(<LiseuseClient dossierUid="DLR5L17N54372"
        documents={[]} defaultDocUid="PRJLANR5L17B2841" initialSommaire={initialSommaire} />);
      expect(html).toContain('aria-label="Chargement du texte et des amendements"');
      expect(html).toContain("data-liseuse-toolbar");
      expect(html).toContain("data-liseuse-filters");
      expect(html).toContain("data-liseuse-content");
      expect(html).not.toContain("Aucun amendement disponible");
    },
  );

  it("ne reste pas en chargement en l'absence de version disponible", () => {
    const html = avecRequetes(<LiseuseClient dossierUid="DLR5L17N54372"
      documents={[]} defaultDocUid={null} initialSommaire={null} />);
    expect(html).not.toContain('aria-busy="true"');
  });

  it("réserve les mêmes blocs dans le fallback serveur", () => {
    const html = renderToStaticMarkup(<LiseuseSkeleton />);
    for (const name of ["page", "toolbar", "filters", "content"]) {
      expect(html).toContain(`data-liseuse-${name}`);
    }
    expect(liseusePageSx.width).toBe("100%");
    expect(liseusePanelSx.height.md).toBe(liseusePanelSx.minHeight.md);
  });
});
