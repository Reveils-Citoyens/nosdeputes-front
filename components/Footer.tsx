import * as React from "react";
import { Box, Container, Typography, Link, Divider } from "@mui/material";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "grey.50",
        py: 6,
        mt: 7,
        // borderTop: "1px solid",
        // borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        {/* Conteneur principal en Flexbox */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" }, // Colonne sur mobile, ligne sur desktop
            justifyContent: "space-between",
            gap: 4,
            alignItems: "flex-start",
          }}
        >
          {/* Section 1 : Logo et identité */}
          <Box sx={{ flex: "1 1 300px" }}>
            <Box sx={{ mb: 2 }}>
              <Image
                src="/logo-inline.png"
                alt="Logo NosDéputés.fr"
                width={140}
                height={30}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Observatoire citoyen de l'activité parlementaire. 
              Un outil pour une démocratie plus transparente et accessible.
            </Typography>
          </Box>

          {/* Section 2 : Association */}
          <Box sx={{ flex: "1 1 350px" }}>
            <Typography variant="subtitle2" color="text.primary" gutterBottom fontWeight="bold">
              À propos de nous
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              NosDéputés.fr est géré par l'association transpartisane Loi 1901
              <strong> Réveils Citoyens</strong>. 
            </Typography>
            <Typography variant="body2">
              Contact :{" "}
              <Link href="mailto:info@reveilscitoyens.org" underline="hover" color="primary">
                hello@reveilscitoyens.org
              </Link>
            </Typography>
          </Box>

          {/* Section 3 : Ressources */}
          <Box sx={{ flex: "0 1 200px" }}>
            <Typography variant="subtitle2" color="text.primary" gutterBottom fontWeight="bold">
              Ressources
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Link 
                href="https://github.com/Reveils-Citoyens/nosdeputes-front" 
                target="_blank" 
                color="text.secondary" 
                variant="body2" 
                underline="hover"
              >
                Code Source
              </Link>
              <Link href="/mentions-legales" color="text.secondary" variant="body2" underline="hover">
                Mentions Légales
              </Link>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Barre de copyright */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            © {currentYear} NosDéputés.fr par Réveils Citoyens.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Données et code sous licence libre.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}