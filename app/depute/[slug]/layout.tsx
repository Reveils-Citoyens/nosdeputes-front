import { notFound } from "next/navigation";
import React from "react";
import type { Metadata } from "next";
import { Avatar, Box, Chip, Container, Stack, Tooltip, Typography } from "@mui/material";
import {
  X as XIcon,
  Facebook as FacebookIcon,
  Language as WebsiteIcon,
  Instagram as InstagramIcon,
  LinkedIn as LinkedInIcon,
} from "@mui/icons-material";
import Link from "next/link";
import Mandats from "./Mandats";
import Contacts from "./Contacts";
import Tabs from "./Tabs";
import InfoPersonelles from "./InfoPersonelles";
import AlerteButton from "@/components/AlerteButton";
import { LecteurPersistantProvider } from "@/components/LecteurPersistant";
import MonDeputeButton from "@/components/MonDepute/MonDeputeButton";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { getActeurAdressesElectroniques, getActeurAdressesPostales } from "@/data/getActeurContacts";
import { getActeurCollaborateurs } from "@/data/getActeurCollaborateurs";
import CollaborateursSection from "./CollaborateursSection";
import { formatCirco } from "@/utils/formatCirco";
import { SITE_URL } from "@/lib/site";
import { openGraphPage } from "@/lib/metadata";
import { alternateRss } from "@/lib/rss";
import { TabNavigationProvider, TabNavigationContent } from "@/components/navigation/TabNavigation";
import TabRouteSkeleton from "@/components/navigation/TabRouteSkeleton";
import { urlDepute } from "@/lib/sourcesAN";
import { getSituationActeur } from "@/data/getSituationActeur";
import { horsAssemblee } from "@/lib/situationActeur";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const depute = await getActeurBySlug(slug);

  if (depute === null) {
    return { title: "Député introuvable — NosDéputés.fr" };
  }

  const nomComplet = `${depute.prenom} ${depute.nom}`;
  const groupe = depute.groupeParlementaire?.libelle ?? null;
  const circo = depute.mandatPrincipal
    ? formatCirco(
        depute.mandatPrincipal.numCirco,
        depute.mandatPrincipal.departement,
        depute.mandatPrincipal.numDepartement,
      )
    : null;

  // Description : « <Nom>, député [de la <circo>] [(<groupe>)]. Activité… »
  // Membre du Gouvernement qui n'a pas siégé : sa fonction, pas « député ».
  const situation = depute.chambre === "AN" ? await getSituationActeur(depute.uid) : null;
  const fonction =
    situation && horsAssemblee(situation) && situation.gouvernement
      ? situation.gouvernement.intitule
      : null;
  const qualite = fonction ?? (depute.chambre === "AN" ? "député" : "parlementaire");
  const segments = [`${nomComplet}, ${qualite}`];
  if (circo) segments.push(circo);
  const intro = segments.join(" ");
  const description = fonction
    ? `${intro}. Interventions à l'Assemblée nationale au nom du Gouvernement.`
    : `${intro}${groupe ? ` (${groupe})` : ""}. Activité parlementaire à l'Assemblée nationale : votes, amendements, interventions, présence en commission et travaux.`;

  const title = `${nomComplet}${circo ? ` — ${qualite} ${circo}` : fonction ? ` — ${fonction}` : ""} — NosDéputés.fr`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/depute/${slug}`,
      types: alternateRss(`/depute/${slug}/rss.xml`, `${nomComplet} — flux RSS`),
    },
    // Image : ./opengraph-image.tsx (photo, groupe, circonscription).
    openGraph: openGraphPage(
      {
        type: "profile",
        title: nomComplet,
        description,
        url: `${SITE_URL}/depute/${slug}`,
      },
      { imageDediee: true },
    ),
  };
}

// Bouton rond des liens sortants (réseaux sociaux, fiche officielle).
const socialLinkSx = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "white",
  boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid #f0f0f0",
  color: "#1A1A1B",
  transition: "all 0.2s",
  "&:hover": {
    transform: "scale(1.1)",
    color: "#000",
  },
};

const SocialLink = ({
  Icon,
  href,
}: {
  Icon: React.ElementType;
  href: string;
}) => (
  <Box
    component="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    data-umami-event="lien-sortant"
    data-umami-event-type="reseau-social"
    sx={socialLinkSx}
  >
    <Icon sx={{ fontSize: 20 }} />
  </Box>
);

const contactButtonStyle = {
  bgcolor: "#1A1A1B",
  color: "white",
  px: 3.5,
  py: 1.2,
  borderRadius: "30px",
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  whiteSpace: "nowrap",
  transition: "background-color 0.2s",
  "&:hover": { bgcolor: "#333" },
};

export default async function Page({
  children,
  params,
}: {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}) {
  const { slug } = await params;
  const depute = await getActeurBySlug(slug);

  if (depute === null) {
    notFound();
  }

  const [adressesElectroniques, adressesPostales, collaborateurs, situation] = await Promise.all([
    getActeurAdressesElectroniques(depute.uid),
    getActeurAdressesPostales(depute.uid),
    getActeurCollaborateurs(depute.uid),
    getSituationActeur(depute.uid),
  ]);

  // Mandat de député achevé : signal canonique = `actif: false` sur l'acteur
  // (démissionnaires, défunts, fin de législature, etc.).
  const mandatAcheve = depute.chambre === "AN" && depute.actif === false;
  const gouvernement = situation.gouvernement;
  // Jamais député de la législature (ministre venu du Sénat, par exemple) :
  // ni circonscription, ni votes, ni amendements, ni questions.
  const sansMandat = depute.chambre === "AN" && horsAssemblee(situation);
  const ficheOfficielle = urlDepute(depute.uid);

  const twitter = adressesElectroniques.find(
    (c) => c.typeLibelle === "Twitter"
  )?.valElec;
  const facebook = adressesElectroniques.find(
    (c) => c.typeLibelle === "Facebook"
  )?.valElec;
  const instagram = adressesElectroniques.find(
    (c) => c.typeLibelle === "Instagram"
  )?.valElec;
  const linkedin = adressesElectroniques.find(
    (c) => c.typeLibelle === "Linkedin"
  )?.valElec;
  const website = adressesElectroniques.find(
    (c) => c.typeLibelle === "Site internet"
  )?.valElec;

  const emails = adressesElectroniques.filter((c) => c.typeLibelle === "Mèl");
  const emailAN = emails.find((e) =>
    e.valElec?.includes("assemblee-nationale.fr")
  )?.valElec;
  const email = emailAN || emails[0]?.valElec;
  // Mêmes rubriques que l'encart Contacts : sans aucune, l'encart est masqué
  // et le bouton « Contacter » ne mènerait nulle part.
  const aDesContacts =
    adressesPostales.some((a) => a.typeLibelle.startsWith("Adresse ")) ||
    adressesElectroniques.some((a) =>
      ["Mèl", "Téléphone", "Site internet", "Twitter", "Facebook", "Instagram", "Linkedin"].includes(
        a.typeLibelle
      )
    );

  const circonscription = depute.mandatPrincipal;

  return (
    <Box
      sx={{
        maxWidth: "1400px",
        width: "100%",
        mx: "auto",
        my: 5,
        px: { xs: 2, md: 4 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 3, md: 0 }}
        sx={{ mb: 4 }}
      >
        {/* Bloc Identité (Avatar + Nom) */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              bgcolor: "grey.200",
              width: { xs: 70, md: 90 },
              height: { xs: 70, md: 90 },
            }}
            alt={`${depute.prenom} ${depute.nom}`}
            src={depute.urlImage ?? ""}
          >
            {depute.prenom[0]}
            {depute.nom[0]}
          </Avatar>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              <Typography
                variant="h3"
                fontWeight="bold"
                sx={{
                  color: "#1A1A1B",
                  fontSize: { xs: "1.5rem", md: "1.7rem" },
                }}
              >
                {depute.prenom} {depute.nom}
              </Typography>
              {mandatAcheve && (
                <Chip
                  label="Mandat achevé"
                  size="small"
                  sx={{
                    bgcolor: "grey.200",
                    color: "grey.800",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    height: 22,
                    // Centrée sur le corps du nom (surtout des minuscules),
                    // non sur ses capitales : sans ce décalage, elle paraît haute.
                    transform: "translateY(2px)",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              )}
              {gouvernement && (
                <Tooltip
                  title={
                    situation.enExercice
                      ? "Membre du Gouvernement"
                      : sansMandat
                        ? "Membre du Gouvernement, sans mandat de député pendant la législature"
                        : "Membre du Gouvernement (mandat de député suspendu)"
                  }
                >
                  <Chip
                    label="Gouv."
                    size="small"
                    sx={{
                      bgcolor: "#dbeafe",
                      color: "#1e40af",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      height: 22,
                      transform: "translateY(2px)",
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </Tooltip>
              )}
            </Stack>

            {gouvernement && !situation.enExercice ? (
              <Typography variant="body1" fontWeight="light" color="text.secondary">
                {gouvernement.intitule}
              </Typography>
            ) : circonscription && (
              <Typography
                variant="body1"
                fontWeight="light"
                color="text.secondary"
              >
                {formatCirco(
                  circonscription.numCirco,
                  circonscription.departement,
                  circonscription.numDepartement,
                )}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Bloc Actions (Réseaux + Contact) */}
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={1.5}
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {/* Source officielle, en tête des liens sortants. */}
          {ficheOfficielle && (
            <Tooltip title="Fiche officielle sur le site de l’Assemblée nationale">
              <Box
                component="a"
                href={ficheOfficielle}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Fiche officielle sur le site de l’Assemblée nationale (nouvel onglet)"
                data-umami-event="source-an"
                data-umami-event-type="depute"
                sx={socialLinkSx}
              >
                {/* Bâtiment du logo de l'Assemblée, sans le lettrage, illisible à cette taille. */}
                <Box component="img" src="/logo-an-hemicycle.svg" alt="" sx={{ width: 28, borderRadius: "3px" }} />
              </Box>
            </Tooltip>
          )}
          {website && (
            <SocialLink Icon={WebsiteIcon} href={`https://${website}`} />
          )}
          {twitter && (
            <SocialLink Icon={XIcon} href={`https://x.com/${twitter}`} />
          )}
          {facebook && (
            <SocialLink
              Icon={FacebookIcon}
              href={`https://facebook.com/${facebook}`}
            />
          )}
          {instagram && (
            <SocialLink
              Icon={InstagramIcon}
              href={`https://instagram.com/${instagram}`}
            />
          )}
          {linkedin && (
            <SocialLink
              Icon={LinkedInIcon}
              href={`https://linkedin.com/${linkedin}`}
            />
          )}

          {email ? (
            <Box
              component="a"
              href={`mailto:${email}`}
              data-umami-event="contact-depute"
              sx={{ ...contactButtonStyle, ml: { md: 1 } }}
            >
              Contacter
            </Box>
          ) : aDesContacts ? (
            <Link
              href="#contacts"
              style={{ textDecoration: "none", marginLeft: 8 }}
              data-umami-event="contact-depute"
            >
              <Box sx={contactButtonStyle}>Contacter</Box>
            </Link>
          ) : null}

          {/* « Député de ma circo » n'a de sens que pour un député en exercice. */}
          {situation.enExercice && (
            <MonDeputeButton
              uid={depute.uid}
              slug={slug}
              prenom={depute.prenom}
              nom={depute.nom}
            />
          )}

          <AlerteButton
            subjectType="depute"
            subjectUid={depute.uid}
            subjectLabel={`${depute.prenom} ${depute.nom}`}
            variant="icon"
            fluxRss={`/depute/${slug}/rss.xml`}
          />
        </Stack>
      </Stack>

      <Container
        disableGutters
        maxWidth={false}
        sx={{
          pt: 1,
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          gap: 4,
        }}
      >
        {/* Fiche d'identité — visible en 1er sur mobile, colonne gauche sur desktop */}
        <Box
          sx={{
            flex: { xs: "unset", md: 2 },
            order: { xs: 0, md: 0 },
            display: { xs: "block", md: "none" },
            width: "100%",
          }}
        >
          <InfoPersonelles acteurUid={depute.uid} depute={depute} />
        </Box>

        {/* Tabs + contenu — 2e sur mobile */}
        <Stack spacing={3} flex={5} sx={{ minWidth: 0, order: { xs: 1, md: 0 } }}>
          {/* Le lecteur vidéo vit ici, au-dessus des onglets : une vidéo lancée
              continue quand on passe d'Activités à Travaux ou Amendements. */}
          <LecteurPersistantProvider>
            <TabNavigationProvider fallback={<TabRouteSkeleton kind="depute" />}>
              <Tabs slug={slug} sansMandat={sansMandat} />
              <TabNavigationContent>{children}</TabNavigationContent>
            </TabNavigationProvider>
          </LecteurPersistantProvider>
        </Stack>

        {/* Colonne latérale complète (desktop) / reste des infos en bas (mobile) */}
        <Stack
          spacing={3}
          flex={2}
          sx={{
            minWidth: 0,
            width: "100%",
            order: { xs: 2, md: -1 },
            "& > *": { width: "100% !important" },
          }}
        >
          {/* InfoPersonelles masquée sur mobile (déjà rendue au-dessus) */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <InfoPersonelles acteurUid={depute.uid} depute={depute} />
          </Box>
          <Mandats acteurUid={depute.uid} />
          <Contacts acteurUid={depute.uid} />
          <CollaborateursSection collaborateurs={collaborateurs} />
        </Stack>
      </Container>
    </Box>
  );
}
