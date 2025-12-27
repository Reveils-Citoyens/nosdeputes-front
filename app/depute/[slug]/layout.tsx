import React from "react";
import { Avatar, Box, Container, Stack, Typography } from "@mui/material";
import { X as XIcon, Facebook as FacebookIcon, Language as LanguageIcon } from "@mui/icons-material";
import Link from "next/link";
import CircleDiv from "@/icons/CircleDiv";
import Mandats from "./Mandats";
import Contacts from "./Contacts";
import Tabs from "./Tabs";
import InfoPersonelles from "./InfoPersonelles";
import { getActeurBySlug } from "@/data/getActeurBySlug";


const SocialLink = ({ Icon, href }: { Icon: React.ElementType; href: string }) => (
<Box
    component="a"
    href={href}
    target="_blank"
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
      color: "#1A1A1B", // Couleur de l'icône
      transition: "all 0.2s",
      "&:hover": { 
        transform: "scale(1.1)",
        color: "#000" // L'icône devient un peu plus foncée au survol
      },
    }}
  >
    <Icon sx={{ fontSize: 20 }} />
  </Box>
);


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
    return <p>Deputé Not Found</p>;
  }

  const circonscription = depute.mandatPrincipal;

  return (
    <Box sx={{ maxWidth: "1024px", width: "100%", mx: "auto", my: 5, px: { xs: 2, md: 0 } }}>
      
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent="space-between" 
        sx={{ mb: 4 }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{ bgcolor: "grey.200", width: 90, height: 90 }}
            alt={`${depute.prenom} ${depute.nom}`}
            src={depute.urlImage ?? ""}
          >
            {depute.prenom[0]}
            {depute.nom[0]}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: "#1A1A1B" }}>
              {depute.prenom} {depute.nom}
            </Typography>

            {circonscription && (
              <Typography variant="body1" fontWeight="light" color="text.secondary">
                {circonscription.numCirco}° circonscription de {circonscription.departement} ({circonscription.numDepartement})
              </Typography>
            )}
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5}>
          <SocialLink Icon={XIcon} href="#" />
          <SocialLink Icon={FacebookIcon} href="#" />
          <SocialLink Icon={LanguageIcon} href="#" />
          <Link href="#contacts" style={{ textDecoration: "none" }}>
            <Box
              sx={{
                bgcolor: "#1A1A1B",
                color: "white",
                px: 3.5,
                py: 1.2,
                borderRadius: "30px",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                ml: 1,
                cursor: "pointer",
                transition: "background-color 0.2s",
                "&:hover": { bgcolor: "#333" }
              }}
            >
              Contacter
            </Box>
          </Link>
        </Stack>
      </Stack>

      <Container
        disableGutters
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
        <Stack spacing={3} useFlexGap flex={2}>
          <InfoPersonelles acteurUid={depute.uid} depute={depute} />
          <Mandats acteurUid={depute.uid} />
          <Contacts acteurUid={depute.uid} />
        </Stack>

        <Stack spacing={3} flex={5} sx={{ minWidth: 0 }}>
          <Tabs slug={slug} />
          {children}
        </Stack>
      </Container>
    </Box>
  );
}