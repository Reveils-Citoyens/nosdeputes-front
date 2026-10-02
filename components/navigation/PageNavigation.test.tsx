import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageNavigationProvider, PageNavigationContent, usePageNavigation, useFeedbackRouter } from "./PageNavigation";
import NavigationLink from "./NavigationLink";
import { getPageNavigationTarget, type PageNavigationTarget } from "./pageNavigationTarget";
import { NavBar } from "@/components/NavBar";
import { MAIN_NAVIGATION_PAGES, type MainNavigationPath } from "./pageNavigationTarget";
import { AboutPageSkeleton } from "./MainPageSkeleton";
import HeroSection from "@/components/home/HeroSection";
import { DomainRouteSkeleton, ThemeRouteSkeleton } from "./ThemeRouteSkeleton";

const mainPages = Object.entries(MAIN_NAVIGATION_PAGES) as [MainNavigationPath, string][];

const state = vi.hoisted(() => ({
  pathname: "/deputes", pending: false, target: null as PageNavigationTarget | null,
  select: vi.fn(), push: vi.fn(), replace: vi.fn(),
  transition: vi.fn((callback: () => void) => callback()),
  link: null as React.ComponentProps<typeof NavigationLink> | null,
}));
vi.mock("react", async importOriginal => ({
  ...await importOriginal<typeof import("react")>(),
  useOptimistic: () => [state.target, state.select],
  useTransition: () => [state.pending, state.transition],
}));
vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useRouter: () => ({ push: state.push, replace: state.replace }),
  useParams: () => ({ id: "sante-solidarites", slug: "famille" }),
}));
vi.mock("next/link", () => ({ default: (props: React.ComponentProps<typeof NavigationLink>) => {
  state.link = props;
  return <a href={String(props.href)} aria-current={props["aria-current"]} className={props.className} target={props.target} data-umami-event={props["data-umami-event" as keyof typeof props] as string}>{props.children}</a>;
} }));

let navigation: ReturnType<typeof usePageNavigation>;
let router: ReturnType<typeof useFeedbackRouter>;
function Probe() { navigation = usePageNavigation(); router = useFeedbackRouter(); return null; }
function render(extra?: React.ReactNode) {
  return renderToStaticMarkup(<PageNavigationProvider>
    <Probe />{extra}<PageNavigationContent><p>Ancienne page</p></PageNavigationContent>
  </PageNavigationProvider>);
}
beforeEach(() => { vi.clearAllMocks(); state.pending = false; state.target = null; state.pathname = "/deputes"; state.link = null; });

describe("Choix du feedback de page", () => {
  it("reconnaît l'accueil depuis le logo sans flasher un loader sur l'accueil courant", () => {
    expect(getPageNavigationTarget("/", "/about")).toEqual({ kind: "home", href: "/" });
    expect(getPageNavigationTarget("/?source=logo", "/deputes")).toEqual({ kind: "home", href: "/?source=logo" });
    expect(getPageNavigationTarget("/", "/")).toBeNull();
  });
  it("décode la recherche sans perdre ses filtres ni son URL", () => {
    expect(getPageNavigationTarget("/recherche?q=nucl%C3%A9aire&sort=date", "/")).toEqual({
      kind: "search", query: "nucléaire", href: "/recherche?q=nucl%C3%A9aire&sort=date",
    });
  });
  it("ouvre une nouvelle fiche sans remplacer les navigations internes d'une même fiche", () => {
    expect(getPageNavigationTarget("/depute/francois-ruffin", "/deputes")?.kind).toBe("depute");
    expect(getPageNavigationTarget("/depute/francois-ruffin", "/depute/francois-ruffin/votes")).toBeNull();
    expect(getPageNavigationTarget("/depute/francois-ruffin/votes", "/depute/francois-ruffin")).toBeNull();
    expect(getPageNavigationTarget("/depute/emilie-bonnivard", "/depute/francois-ruffin")?.kind).toBe("depute");
  });
  it.each(mainPages)("reconnaît la destination principale %s sans perdre ses filtres", (page) => {
    expect(getPageNavigationTarget(`${page}?filtre=actif`, "/recherche")).toEqual({ kind: "main", page, href: `${page}?filtre=actif` });
    expect(getPageNavigationTarget(page, page)).toBeNull();
    expect(getPageNavigationTarget(`${page}/detail`, "/")).toBeNull();
  });
  it.each(["https://example.org/depute/a", "//example.org/recherche", "mailto:contact@example.org", "#contacts", "/mentions-legales", "/17/dossier/DLR5L17N54372/votes"])("ne remplace pas les autres destinations : %s", href => {
    expect(getPageNavigationTarget(href, "/")).toBeNull();
  });
  it("reconnaît domaines et thèmes, y compris avec slash final, sans accepter les slugs inconnus", () => {
    expect(getPageNavigationTarget("/themes/domaine/sante-solidarites/?source=home", "/")).toEqual({ kind: "domain", slug: "sante-solidarites", href: "/themes/domaine/sante-solidarites/?source=home" });
    expect(getPageNavigationTarget("/themes/famille", "/themes/domaine/sante-solidarites")?.kind).toBe("theme");
    for (const href of ["/themes/inconnu", "/themes/constructor", "/themes/domaine/inconnu", "/themes/domaine/constructor"]) expect(getPageNavigationTarget(href, "/")).toBeNull();
    expect(getPageNavigationTarget("/themes/famille/", "/themes/famille")).toBeNull();
    expect(getPageNavigationTarget("/themes/domaine/sante-solidarites", "/themes/domaine/sante-solidarites")).toBeNull();
    expect(getPageNavigationTarget("/dossiers/", "/")?.kind).toBe("main");
  });
  it("reconnaît l'ouverture d'un autre dossier mais conserve les onglets du dossier courant", () => {
    expect(getPageNavigationTarget("/17/dossier/DLR5L17N54372/", "/")).toEqual({ kind: "dossier", href: "/17/dossier/DLR5L17N54372/", legislature: "17", id: "DLR5L17N54372" });
    expect(getPageNavigationTarget("/17/dossier/DLR5L17N54372", "/17/dossier/DLR5L17N54372/amendement")).toBeNull();
    expect(getPageNavigationTarget("/17/dossier/DLR5L17N54372", "/17/dossier/autre")).toHaveProperty("kind", "dossier");
  });
});

describe("Feedback immédiat de navigation", () => {
  it.each([
    { kind: "domain" as const, slug: "sante-solidarites", href: "/themes/domaine/sante-solidarites", title: "Santé &amp; solidarités" },
    { kind: "theme" as const, slug: "famille", href: "/themes/famille", title: "Famille" },
  ])("montre la destination $kind sans attendre les compteurs", ({ title, ...target }) => {
    state.pending = true; state.target = target;
    const html = render();
    expect(html).toContain(title); expect(html).toContain('aria-busy="true"');
    expect(html).not.toContain("Ancienne page"); expect(html).not.toContain("0 dossier");
    state.pending = false; expect(render()).toContain("Ancienne page");
  });
  it("le fallback des routes conserve le domaine/thème demandé dans les paramètres", () => {
    expect(renderToStaticMarkup(<DomainRouteSkeleton />)).toContain("Santé &amp; solidarités");
    expect(renderToStaticMarkup(<ThemeRouteSkeleton />)).toContain("Famille");
  });
  it("montre le skeleton d'un dossier complet, pas un onglet sans identité", () => {
    state.pending = true; state.target = { kind: "dossier", href: "/17/dossier/DLR5L17N54372", legislature: "17", id: "DLR5L17N54372" };
    const html = render();
    expect(html).toContain('aria-label="Chargement du dossier législatif"'); expect(html).toContain("min-height:272px"); expect(html).not.toContain("Ancienne page");
  });
  it("montre l'introduction de l'accueil sans champ de recherche provisoire avant la réponse serveur", () => {
    state.pathname = "/about"; state.pending = true; state.target = { kind: "home", href: "/" };
    const html = render(<NavBar navigation={mainPages.map(([href, name]) => ({ href, name }))} />);
    expect(html).toContain('aria-label="Chargement de l’accueil"');
    expect(html).toContain("Bienvenue sur le nouveau site NosDéputés.fr");
    expect(html).not.toContain('Entrez un code postal, un nom de député ou un nom de dossier législatif');
    expect(html).toContain('href="/" aria-current="page"');
    expect(html).not.toContain("Ancienne page");
    state.pending = false;
    expect(render()).toContain("Ancienne page");
  });
  it("lance le retour à l'accueil dans la transition du routeur", () => {
    render(<NavigationLink href="/">Logo</NavigationLink>);
    const preventDefault = vi.fn(); state.link!.onNavigate!({ preventDefault });
    expect(state.select).toHaveBeenCalledWith({ kind: "home", href: "/", scroll: undefined });
    expect(state.push).toHaveBeenCalledWith("/", { scroll: undefined });
  });
  it("conserve le véritable champ de recherche dans l'accueil chargé", () => {
    const html = renderToStaticMarkup(<HeroSection />);
    expect(html).toContain("Entrez un code postal, un nom de député ou un nom de dossier législatif");
    expect(html).toContain('role="combobox"');
    expect(html).toContain("Bienvenue sur le nouveau site NosDéputés.fr");
  });
  it("le skeleton À propos garde la typographie réelle et dessine les cartes au lieu de blocs pleins", () => {
    const html = renderToStaticMarkup(<AboutPageSkeleton />);
    expect(html).toContain("MuiTypography-h2");
    expect(html).toContain("NosDéputés.fr est un site transpartisan");
    for (const title of ["Notre Histoire", "Ce qui nous unit", "Neutralité", "Transparence", "Open Source"]) expect(html).toContain(title);
    expect(html).toContain("MuiSkeleton-circular");
    expect(html).not.toContain("height:240px");
    expect(html).not.toContain("font-size:2rem;");
  });
  it("garde le contenu réel au repos et après la transition", () => {
    expect(render()).toContain("Ancienne page");
    state.target = { kind: "depute", href: "/depute/francois-ruffin", slug: "francois-ruffin" };
    expect(render()).toContain("Ancienne page");
  });
  it("montre la recherche cible sans attendre l'URL ni les résultats", () => {
    state.pending = true; state.target = { kind: "search", href: "/recherche?q=nucl%C3%A9aire", query: "nucléaire" };
    const html = render();
    expect(html).toContain("« nucléaire »");
    expect(html).toContain('aria-label="Chargement des résultats pour nucléaire"');
    expect(html).not.toContain("Ancienne page");
  });
  it("montre le skeleton complet d'une fiche avant son arrivée", () => {
    state.pending = true; state.target = { kind: "depute", href: "/depute/francois-ruffin", slug: "francois-ruffin" };
    expect(render()).toContain('aria-label="Chargement de la fiche du député"');
    expect(render()).not.toContain("Ancienne page");
  });
  it("sélectionne la cible et lance le routeur dans la même transition", () => {
    render(); navigation!.navigate("/recherche?q=nucl%C3%A9aire", { scroll: false });
    expect(state.transition).toHaveBeenCalledOnce();
    expect(state.select).toHaveBeenCalledWith({ kind: "search", href: "/recherche?q=nucl%C3%A9aire", query: "nucléaire", scroll: false });
    expect(state.push).toHaveBeenCalledWith("/recherche?q=nucl%C3%A9aire", { scroll: false });
  });
  it("couvre aussi Entrée/autocomplete et préserve replace/scroll", () => {
    render(); router.push("/depute/francois-ruffin");
    expect(state.select).toHaveBeenCalledWith(expect.objectContaining({ kind: "depute" }));
    router.replace("/recherche?q=logement", { scroll: false });
    expect(state.replace).toHaveBeenCalledWith("/recherche?q=logement", { scroll: false });
  });
  it("la navigation suivante remplace la cible provisoire, y compris vers une autre surface", () => {
    render(); navigation!.navigate("/recherche?q=nucléaire"); navigation!.navigate("/depute/francois-ruffin"); navigation!.navigate("/dossiers"); navigation!.navigate("/mentions-legales");
    expect(state.select.mock.calls.map(([target]) => target?.kind ?? null)).toEqual(["search", "depute", "main", null]);
  });
  it.each(mainPages)("affiche le skeleton et sélectionne %s avant le changement d'URL", (page, name) => {
    state.pathname = "/recherche"; state.pending = true;
    state.target = { kind: "main", page, href: page };
    const html = render(<NavBar navigation={mainPages.map(([href, name]) => ({ href, name }))} />);
    expect(html).not.toContain("Ancienne page");
    expect(html).toContain('aria-busy="true"');
    const labels = { "/deputes": "Chargement des députés", "/dossiers": "Chargement des dossiers", "/themes": "Chargement des thèmes", "/comprendre": "Chargement de Comprendre", "/about": "Chargement de À propos" };
    expect(html).toContain(`aria-label="${labels[page]}"`);
    expect(html).toContain(`href="${page}" aria-current="page"`);
    expect(html).toContain(name);
    state.pending = false;
    const finished = render(<NavBar navigation={mainPages.map(([href, name]) => ({ href, name }))} />);
    expect(finished).toContain("Ancienne page");
    expect(finished).not.toContain('aria-current="page"');
  });
});

describe("Liens Next/MUI", () => {
  it("utilise onNavigate sans détourner onClick et conserve les attributs", () => {
    const onClick = vi.fn();
    render(<NavigationLink href="/depute/francois-ruffin" onClick={onClick} target="_blank" data-umami-event="recherche-resultat">Ruffin</NavigationLink>);
    expect(state.link?.onClick).toBe(onClick);
    expect(state.link?.target).toBe("_blank");
    expect(state.link?.href).toBe("/depute/francois-ruffin");
    expect(state.push).not.toHaveBeenCalled();
  });
  it("préserve l'annulation onNavigate de l'appelant", () => {
    render(<NavigationLink href="/recherche?q=nucléaire" onNavigate={e => e.preventDefault()}>Recherche</NavigationLink>);
    const preventDefault = vi.fn(); state.link!.onNavigate!({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(state.push).not.toHaveBeenCalled();
  });
  it("déclenche le feedback et respecte replace et scroll", () => {
    render(<NavigationLink href="/recherche?q=nucléaire" replace scroll={false}>Recherche</NavigationLink>);
    const preventDefault = vi.fn(); state.link!.onNavigate!({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(state.replace).toHaveBeenCalledWith("/recherche?q=nucléaire", { scroll: false });
  });
  it("reste un lien normal sans provider", () => {
    renderToStaticMarkup(<NavigationLink href="/depute/francois-ruffin">Ruffin</NavigationLink>);
    const preventDefault = vi.fn(); state.link!.onNavigate!({ preventDefault });
    expect(preventDefault).not.toHaveBeenCalled(); expect(state.push).not.toHaveBeenCalled();
  });
});
