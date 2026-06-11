import React from "react";
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
import MonDeputeButton from "@/components/MonDepute/MonDeputeButton";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { getActeurAdressesElectroniques } from "@/data/getActeurContacts";
import { getActeurCollaborateurs } from "@/data/getActeurCollaborateurs";
import CollaborateursSection from "./CollaborateursSection";
import { formatCirco } from "@/utils/formatCirco";

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
    sx={{
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
    }}
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
    return <p>Deputé non trouvé</p>;
  }

  const [adressesElectroniques, collaborateurs] = await Promise.all([
    getActeurAdressesElectroniques(depute.uid),
    getActeurCollaborateurs(depute.uid),
  ]);

  // Mandat de député achevé : signal canonique = `actif: false` sur l'acteur
  // (démissionnaires, défunts, fin de législature, etc.).
  const mandatAcheve = depute.chambre === "AN" && depute.actif === false;
  const auGouvernement = depute.auGouvernement === true;

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
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              )}
              {auGouvernement && (
                <Tooltip title="Membre du gouvernement (mandat de député suspendu)">
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
                      "& .MuiChip-label": { px: 1 },
                    }}
                  />
                </Tooltip>
              )}
            </Stack>

            {circonscription && (
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
          ) : (
            <Link
              href="#contacts"
              style={{ textDecoration: "none", marginLeft: 8 }}
              data-umami-event="contact-depute"
            >
              <Box sx={contactButtonStyle}>Contacter</Box>
            </Link>
          )}

          <MonDeputeButton
            uid={depute.uid}
            slug={slug}
            prenom={depute.prenom}
            nom={depute.nom}
          />

          <AlerteButton
            subjectType="depute"
            subjectUid={depute.uid}
            subjectLabel={`${depute.prenom} ${depute.nom}`}
            variant="icon"
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
          <Tabs slug={slug} />
          {children}
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
