import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Travaux from "@/app/depute/[slug]/travaux/page";
import Amendements from "@/app/depute/[slug]/amendements/page";
import VotesClient from "@/app/depute/[slug]/votes/VotesClient";
import PaginatedQuestions from "@/app/depute/[slug]/qag/PaginatedQuestions";

const state = vi.hoisted(() => ({ pending: true }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "francois-ruffin" }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@tanstack/react-query", async importOriginal => ({
  ...await importOriginal<typeof import("@tanstack/react-query")>(),
  useQuery: ({ queryKey }: { queryKey: unknown[] }) => ({
    isPending: state.pending,
    data: state.pending ? undefined : queryKey[0] === "acteur"
      ? { uid: "PA718868" }
      : { data: [], pagination: { totalPage: 1 } },
  }),
}));

beforeEach(() => { state.pending = true; });

const pages = [
  ["travaux", <Travaux key="travaux" />, "Chargement des travaux législatifs du député", "Aucune proposition de loi trouvée."],
  ["amendements", <Amendements key="amendements" />, "Chargement des amendements du député", "Aucun amendement trouvé pour cette recherche."],
  ["votes", <VotesClient key="votes" acteur={{ uid: "PA718868" } as React.ComponentProps<typeof VotesClient>["acteur"]} />, "Chargement des votes du député", "Aucun vote ne correspond à vos critères."],
  ["questions", <PaginatedQuestions key="questions" acteurUid="PA718868" />, "Chargement des questions du député", "Aucune question enregistrée pour ce député."],
] as const;

describe("Skeletons pendant la récupération des données client", () => {
  it.each(pages)("%s garde un skeleton et n'affiche pas prématurément un état vide", (_name, page, label, empty) => {
    const html = renderToStaticMarkup(page);
    expect(html).toContain(`aria-label="${label}"`);
    expect(html).not.toContain(empty);
    expect(html).not.toContain("MuiCircularProgress");
  });

  it.each(pages)("%s retrouve son état vide habituel après une réponse sans résultats", (_name, page, _label, empty) => {
    state.pending = false;
    const html = renderToStaticMarkup(page);
    expect(html).toContain(empty);
    expect(html).not.toContain('role="status"');
  });
});
