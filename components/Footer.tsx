import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  Stack,
} from "@mui/material";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: "grey.50",
        pt: 8,
        pb: 4,
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        {/* Conteneur principal : Stack responsive */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 6, md: 4 }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "flex-start" }}
        >
          {/* Section 1 : Logo et identité */}
          <Box sx={{ width: "100%", maxWidth: { md: 300 } }}>
            <Box sx={{ mb: 2 }}>
              <Image
                src="/logo-inline.png"
                alt="Logo NosDéputés.fr"
                width={140}
                height={30}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.6 }}
            >
              Observatoire citoyen de l&apos;activité parlementaire. Un outil
              pour une démocratie plus transparente et accessible.
            </Typography>
          </Box>

          {/* Section 2 : Association */}
          <Box sx={{ width: "100%", maxWidth: { md: 350 } }}>
            <Typography
              variant="subtitle2"
              color="text.primary"
              gutterBottom
              fontWeight="bold"
            >
              À propos de nous
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                NosDéputés.fr est géré par l&apos;association transpartisane Loi
                1901
                <strong> Réveils Citoyens</strong>.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contact :{" "}
                <Link
                  href="mailto:info@reveilscitoyens.org"
                  underline="hover"
                  color="primary"
                  fontWeight="medium"
                >
                  hello@reveilscitoyens.org
                </Link>
              </Typography>
            </Stack>
          </Box>

          {/* Section 3 : Ressources */}
          <Box sx={{ width: "100%", maxWidth: { md: 200 } }}>
            <Typography
              variant="subtitle2"
              color="text.primary"
              gutterBottom
              fontWeight="bold"
            >
              Ressources
            </Typography>
            <Stack component="nav" spacing={1}>
              <Link
                href="https://github.com/Reveils-Citoyens/nosdeputes-front"
                target="_blank"
                rel="noopener noreferrer"
                color="text.secondary"
                variant="body2"
                underline="hover"
              >
                Code Source
              </Link>
              <Link
                href="/mentions-legales"
                color="text.secondary"
                variant="body2"
                underline="hover"
              >
                Mentions Légales
              </Link>
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 4 }} />

        {/* Barre de copyright */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "center", sm: "center" }}
          spacing={2}
          sx={{ textAlign: { xs: "center", sm: "left" } }}
        >
          <Typography variant="caption" color="text.secondary">
            © {currentYear} NosDéputés.fr par Réveils Citoyens.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Données et code sous licence libre.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
