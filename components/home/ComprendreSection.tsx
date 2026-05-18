import Link from "next/link";
import { Box, Container, Stack, Typography } from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  School as SchoolIcon,
} from "@mui/icons-material";

const STEP_PREVIEW = [
  { num: 1, label: "Dépôt", color: "#2C7A7B" },
  { num: 2, label: "Commission", color: "#4A5568" },
  { num: 3, label: "1re lecture", color: "#4A5568" },
  { num: "…", label: "Navette, CMP…", color: "#A0AEC0" },
  { num: 10, label: "Promulgation", color: "#2C7A7B" },
];

export default function ComprendreSection() {
  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 3, md: 4 } }}>
      <Box
        sx={{
          position: "relative",
          borderRadius: { xs: "24px", md: "32px" },
          overflow: "hidden",
          bgcolor: "#F5F8F7",
          border: "1px solid",
          borderColor: "#D9E5E2",
          p: { xs: 4, md: 7 },
        }}
      >
        <Stack
          spacing={4}
          alignItems="center"
          sx={{ position: "relative", zIndex: 1 }}
        >
          <SchoolIcon sx={{ fontSize: 44, color: "#2C7A7B" }} />

          <Stack spacing={1.5} alignItems="center" sx={{ textAlign: "center" }}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: "bold",
                letterSpacing: "0.15em",
                color: "#2C7A7B",
                fontSize: "0.75rem",
              }}
            >
              Comprendre
            </Typography>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: "1.5rem", md: "2rem" },
                fontWeight: "bold",
                lineHeight: 1.2,
                color: "#1A1A1B",
                maxWidth: 640,
              }}
            >
              Comment une loi est-elle adoptée en France ?
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                maxWidth: 560,
                lineHeight: 1.6,
                fontSize: { xs: "0.95rem", md: "1rem" },
              }}
            >
              Du dépôt d&apos;un texte à sa publication au Journal officiel,
              découvrez chaque étape du parcours d&apos;une loi en France et le
              rôle de chaque acteur.
            </Typography>
          </Stack>

          {/* Aperçu schématique des étapes */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 0.5, md: 1.5 }}
            flexWrap="wrap"
            justifyContent="center"
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            {STEP_PREVIEW.map((step, i) => (
              <Stack key={i} direction="row" alignItems="center" spacing={{ xs: 0.5, md: 1.5 }}>
                <Stack alignItems="center" spacing={0.5}>
                  <Box
                    sx={{
                      width: { xs: 32, md: 40 },
                      height: { xs: 32, md: 40 },
                      borderRadius: "50%",
                      bgcolor: step.color,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: { xs: "0.75rem", md: "0.875rem" },
                    }}
                  >
                    {step.num}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: "0.65rem", md: "0.75rem" },
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.label}
                  </Typography>
                </Stack>
                {i < STEP_PREVIEW.length - 1 && (
                  <Box
                    sx={{
                      width: { xs: 16, md: 28 },
                      height: 1.5,
                      bgcolor: "#D9E5E2",
                      mb: 2.5,
                    }}
                  />
                )}
              </Stack>
            ))}
          </Stack>

          <Link href="/comprendre" style={{ textDecoration: "none" }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
                bgcolor: "#1A1A1B",
                color: "white",
                px: 4,
                py: 1.5,
                borderRadius: "30px",
                fontSize: "12px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                cursor: "pointer",
                transition: "background-color 0.2s, transform 0.2s",
                "&:hover": {
                  bgcolor: "#333",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Voir le parcours d&apos;une loi
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Box>
          </Link>
        </Stack>
      </Box>
    </Container>
  );
}
