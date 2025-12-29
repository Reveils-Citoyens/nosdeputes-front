import React from "react";
import { Avatar, Box, Container, Stack, Typography } from "@mui/material";
import { 
  X as XIcon, 
  Facebook as FacebookIcon, 
  Language as WebsiteIcon, 
  Instagram as InstagramIcon, 
  LinkedIn as LinkedInIcon 
} from "@mui/icons-material";
import Link from "next/link";
import Mandats from "./Mandats";
import Contacts from "./Contacts";
import Tabs from "./Tabs";
import InfoPersonelles from "./InfoPersonelles";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { getActeurAdressesElectroniques } from "@/data/getActeurContacts";

const SocialLink = ({ Icon, href }: { Icon: React.ElementType; href: string }) => (
  <Box
    component="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
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
        color: "#000"
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
  "&:hover": { bgcolor: "#333" }
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

  const adressesElectroniques = await getActeurAdressesElectroniques(depute.uid);

  const twitter = adressesElectroniques.find(c => c.typeLibelle === "Twitter")?.valElec;
  const facebook = adressesElectroniques.find(c => c.typeLibelle === "Facebook")?.valElec;
  const instagram = adressesElectroniques.find(c => c.typeLibelle === "Instagram")?.valElec;
  const linkedin = adressesElectroniques.find(c => c.typeLibelle === "Linkedin")?.valElec;
  const website = adressesElectroniques.find(c => c.typeLibelle === "Site internet")?.valElec;
  
  const emails = adressesElectroniques.filter(c => c.typeLibelle === "Mèl");
  const emailAN = emails.find(e => e.valElec?.includes("assemblee-nationale.fr"))?.valElec;
  const email = emailAN || emails[0]?.valElec;

  const circonscription = depute.mandatPrincipal;

  return (
    <Box sx={{ maxWidth: "1400px", width: "100%", mx: "auto", my: 5, px: { xs: 2, md: 4 } }}>
      
<Stack 
        direction={{ xs: "column", md: "row" }} // Colonne sur mobile, Ligne sur Desktop
        alignItems={{ xs: "flex-start", md: "center" }} // Aligné à gauche sur mobile
        justifyContent="space-between" 
        spacing={{ xs: 3, md: 0 }} // Espace vertical sur mobile
        sx={{ mb: 4 }}
      >
        
        {/* Bloc Identité (Avatar + Nom) */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{ 
              bgcolor: "grey.200", 
              // Avatar légèrement plus petit sur mobile
              width: { xs: 70, md: 90 }, 
              height: { xs: 70, md: 90 } 
            }}
            alt={`${depute.prenom} ${depute.nom}`}
            src={depute.urlImage ?? ""}
          >
            {depute.prenom[0]}
            {depute.nom[0]}
          </Avatar>
          <Box>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                color: "#1A1A1B",
                // Taille de police responsive
                fontSize: { xs: "1.5rem", md: "2.125rem" } 
              }}
            >
              {depute.prenom} {depute.nom}
            </Typography>

            {circonscription && (
              <Typography variant="body1" fontWeight="light" color="text.secondary">
                {circonscription.numCirco}° circ. de {circonscription.departement} ({circonscription.numDepartement})
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Bloc Actions (Réseaux + Contact) */}
        <Stack 
          direction="row" 
          alignItems="center" 
          flexWrap="wrap" // Permet aux icônes de passer à la ligne si besoin
          gap={1.5} // Utilisation de gap pour mieux gérer le flexWrap
          sx={{ width: { xs: "100%", md: "auto" } }} // Prend toute la largeur sur mobile
        >
          {website && <SocialLink Icon={WebsiteIcon} href={`https://${website}`} />}
          {twitter && <SocialLink Icon={XIcon} href={`https://x.com/${twitter}`} />}
          {facebook && <SocialLink Icon={FacebookIcon} href={`https://facebook.com/${facebook}`} />}
          {instagram && <SocialLink Icon={InstagramIcon} href={`https://instagram.com/${instagram}`} />}
          {linkedin && <SocialLink Icon={LinkedInIcon} href={`https://linkedin.com/${linkedin}`} />}
          
          {email ? (
            <Box component="a" href={`mailto:${email}`} sx={{ ...contactButtonStyle, ml: { md: 1 } }}>
              Contacter
            </Box>
          ) : (
            <Link href="#contacts" style={{ textDecoration: "none", marginLeft: 8 }}>
              <Box sx={contactButtonStyle}>
                Contacter
              </Box>
            </Link>
          )}
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
        {/* Colonne de Gauche (Infos) */}
        <Stack 
          spacing={3} 
          flex={2} 
          // Force les cartes enfants (InfoPersonelles, etc.) à prendre 100% de la largeur du conteneur
          sx={{ 
             minWidth: 0, 
             width: "100%",
             "& > *": { width: "100% !important" } // Hack CSS pour forcer la largeur des Paper enfants qui ont width: 300
          }}
        >
          <InfoPersonelles acteurUid={depute.uid} depute={depute} />
          <Mandats acteurUid={depute.uid} />
          <Contacts acteurUid={depute.uid} />
        </Stack>

        {/* Colonne de Droite (Tabs et Contenu principal) */}
        <Stack spacing={3} flex={5} sx={{ minWidth: 0 }}>
          <Tabs slug={slug} />
          {children}
        </Stack>
      </Container>
    </Box>
  );
}