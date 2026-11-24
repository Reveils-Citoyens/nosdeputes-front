"use client";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Lien = { libelle: string; href: string };

const LIENS_PAR_DEFAUT: Lien[] = [
  { libelle: "Les députés", href: "/deputes" },
  { libelle: "Les dossiers législatifs", href: "/dossiers" },
  { libelle: "Rechercher", href: "/recherche" },
];

/**
 * Page « introuvable » (404), affichée dans le gabarit du site : en-tête et
 * pied de page restent là pour repartir ailleurs.
 */
export default function PageIntrouvable({
  titre = "Cette page est introuvable",
  texte = "L’adresse est peut-être mal saisie, ou la page a été déplacée ou supprimée.",
  liens = LIENS_PAR_DEFAUT,
}: {
  titre?: string;
  texte?: string;
  liens?: Lien[];
}) {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: "center" }}>
      <Typography
        component="p"
        sx={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.15em", color: "grey.600", mb: 1 }}
      >
        ERREUR 404
      </Typography>
      <Typography component="h1" fontWeight="bold" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, mb: 2 }}>
        {titre}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {texte}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="center" sx={{ mb: 3 }}>
        <Button component={Link} href="/" variant="contained" disableElevation sx={{ borderRadius: 999, px: 3 }}>
          Retour à l’accueil
        </Button>
      </Stack>
      <Box component="nav" aria-label="Autres pages">
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
          {liens.map((lien) => (
            <Typography
              key={lien.href}
              component={Link}
              href={lien.href}
              variant="body2"
              sx={{ color: "text.secondary", textDecoration: "underline" }}
            >
              {lien.libelle}
            </Typography>
          ))}
        </Stack>
      </Box>
    </Container>
  );
}
