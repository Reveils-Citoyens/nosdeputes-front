import type { Metadata } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { NavBar, NavigationItem } from "@/components/NavBar";
import Footer from "@/components/Footer";
import theme from "./theme";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import Providers from "./providers";
import InfoDialogProvider from "@/components/InfoDialog/InfoDialogProvider";
import InfoDialog from "@/components/InfoDialog/InfoDialog";
import { IS_INDEXABLE, SITE_URL } from "@/lib/site";
import { SITE_NAME } from "@/lib/metadata";
import { PageNavigationProvider, PageNavigationContent } from "@/components/navigation/PageNavigation";

// Fichier embarqué : la compilation ne dépend pas de l'API Google Fonts.
const raleway = localFont({
  src: [
    { path: "./fonts/Raleway-Variable.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Raleway-Variable.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Raleway-Variable.ttf", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-raleway",
});

export const metadata: Metadata = {
  // Domaine du déploiement : les URL des images de partage doivent pointer
  // vers un serveur qui les génère (beta compris).
  metadataBase: new URL(SITE_URL),
  // Indexation autorisée uniquement sur le domaine de prod canonique ; beta et
  // autres environnements sont en noindex (cf. lib/site).
  robots: IS_INDEXABLE ? "index, follow" : "noindex, nofollow",
  title: "NosDéputés.fr : Observatoire citoyen de l'activité parlementaire",
  description:
    "Observatoire citoyen de l'activité parlementaire à l'Assemblée nationale",

  // Ni titre, ni description, ni image : Next les reprend de `openGraph`, donc
  // de chaque page. Les fixer ici affichait la carte générique du site sur X
  // pour toutes les pages.
  twitter: {
    card: "summary_large_image",
    site: "@ReveilsCitoyens",
  },
  // Titre et description repris de ceux de la page ; image fournie par
  // app/opengraph-image.tsx, remplacée par les routes qui ont la leur.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "fr_FR",
  },
};

const navigation: NavigationItem[] = [
  { name: "Députés", href: "/deputes" },
  { name: "Dossiers", href: "/dossiers" },
  { name: "Thèmes", href: "/themes" },
  { name: "Comprendre", href: "/comprendre" },
  { name: "À Propos", href: "/about" },
];

export default function RootLayout({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={raleway.variable}>
        <NuqsAdapter>
          <InfoDialogProvider>
            <AppRouterCacheProvider>
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <main className="flex min-h-screen flex-col">
                  <PageNavigationProvider>
                    <NavBar navigation={navigation} />
                    <Providers>
                      <PageNavigationContent>{children}</PageNavigationContent>
                    </Providers>
                    <Footer />
                    <InfoDialog />
                  </PageNavigationProvider>
                </main>
              </ThemeProvider>
            </AppRouterCacheProvider>
          </InfoDialogProvider>
        </NuqsAdapter>
        <Script
          src="https://burrowing-partridge.pikapod.net/script.js"
          data-website-id="48ac37d3-b378-4072-b628-b69f5b91f843"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
