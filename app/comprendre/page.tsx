import * as React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { ETAPES_LEGISLATIVES } from "@/data/processusLegislatif";
import EtapeCard from "./EtapeCard";

export const metadata = {
  title: "Comprendre — Nos Députés",
  description:
    "Comment une loi est-elle adoptée en France ? Découvrez chaque étape du parcours d'un texte de loi.",
};

export default function ComprendrePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Hero */}
      <Stack spacing={2} sx={{ mb: 6, textAlign: { xs: "left", md: "center" } }}>
        <Typography
          variant="overline"
          sx={{
            fontWeight: "bold",
            letterSpacing: "0.15em",
            color: "grey.600",
          }}
        >
          Comprendre
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "1.75rem", md: "2.5rem" },
            fontWeight: "bold",
            lineHeight: 1.2,
            color: "#1A1A1B",
          }}
        >
          Comment une loi est-elle adoptée en France ?
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 620,
            width: "100%",
            alignSelf: { xs: "flex-start", md: "center" },
            lineHeight: 1.6,
            textAlign: { xs: "left", md: "center" },
          }}
        >
          Du dépôt d&apos;un texte à sa publication au Journal officiel, un
          projet de loi passe par une dizaine d&apos;étapes principales.
          Cliquez sur chaque étape pour en savoir plus. Les mots soulignés
          ouvrent une définition.
        </Typography>
      </Stack>

      {/* Frise verticale */}
      <Box>
        {ETAPES_LEGISLATIVES.map((etape) => (
          <EtapeCard key={etape.id} etape={etape} />
        ))}
      </Box>

      {/* Note de bas de page */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          bgcolor: "grey.50",
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          <strong>À noter :</strong> ce parcours décrit le cas général de la
          loi ordinaire. Certains textes (loi organique, loi de finances, loi
          constitutionnelle) suivent une procédure spécifique. La procédure
          accélérée, fréquente, raccourcit notamment la navette parlementaire.
        </Typography>
      </Box>
    </Container>
  );
}
