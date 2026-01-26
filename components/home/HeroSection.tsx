import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import SearchBar from "./SearchBar";
import FloatingIcons from "./FloatingIcons";

const HeroSection = () => {
  return (
    <Box
      component="section"
      sx={{
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        mt: { xs: 4, md: 7 }, 
        width: "100%",
      }}
    >
      <Typography 
        variant="body2" 
        color="text.secondary" 
        sx={{ 
          mb: 2,
          px: 2,
          fontSize: { xs: "0.8rem", md: "1rem" } 
        }}
      >
        Bienvenue sur le nouveau site NosDéputés.fr
      </Typography>

      <Box
        sx={{
          minHeight: { xs: "auto", md: "630px" },
          width: "100%",
          position: "relative",
          backgroundImage: "url(/background.jpg)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "top center",
          backgroundSize: { xs: "cover", md: "1088px auto" },
          overflow: "hidden",
          
          pt: { xs: 6, md: 8 },
          pb: { xs: 8, md: 5 },
        }}
      >
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <FloatingIcons />
        </Box>

        <Container maxWidth="md">
          <Stack alignItems="center" spacing={3}>
            <Typography
              variant="h1"
              fontWeight="bold"
              sx={{
                fontSize: { xs: "1.75rem", sm: "2.1rem", md: "2.2rem" },
                lineHeight: { xs: 1.3, md: 1.2 },
                color: "#1A1A1B",
              }}
            >
              Tout comprendre au travail de nos représentants à l&apos;Assemblée
              Nationale
            </Typography>           

            <Typography
              variant="body1"
              fontWeight="light"
              color="text.secondary"
              sx={{ 
                maxWidth: 580,
                fontSize: { xs: "1rem", md: "1.125rem" },
                lineHeight: 1.6,
                mb: { xs: 4, md: 6 } 
              }}
            >
              Nos Députés met en lumière l&apos;activité des députés de
          l&apos;Assemblée Nationale en synthétisant leurs
          travaux législatifs et en publiant le contenu des dossiers législatifs sur lesquels ils travaillent.
            </Typography>

            <Box sx={{ width: "100%", display: 'flex', justifyContent: 'center' }}>
              <SearchBar />
            </Box>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default HeroSection;