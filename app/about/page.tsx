import React from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Paper,
  Divider,
} from "@mui/material";
import {
  Balance as NeutralityIcon,
  Visibility as TransparencyIcon,
  Code as OpenSourceIcon,
  Group as TeamIcon,
  History as HistoryIcon,
  Favorite as ContributeIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";

// Composant pour les cartes de valeurs
const ValueCard = ({
  title,
  text,
  icon: Icon,
}: {
  title: string;
  text: string;
  icon: React.ElementType;
}) => (
  <Card
    elevation={0}
    sx={{
      height: "100%",
      bgcolor: "grey.50",
      border: "1px solid",
      borderColor: "grey.200",
      transition: "0.3s",
      "&:hover": { borderColor: "primary.main", transform: "translateY(-4px)" },
    }}
  >
    <CardContent sx={{ textAlign: "center", p: 3 }}>
      <Avatar
        sx={{
          bgcolor: "primary.main",
          width: 56,
          height: 56,
          mb: 2,
          mx: "auto",
        }}
      >
        <Icon sx={{ fontSize: 30, color: "white" }} />
      </Avatar>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="start">
        {text}
      </Typography>
    </CardContent>
  </Card>
);

const TeamMember = ({ name }: { name: string }) => (
  <Stack alignItems="center" spacing={1}>
    <Avatar
      sx={{
        width: 64,
        height: 64,
        bgcolor: "secondary.main",
        color: "text.primary",
        fontWeight: "bold",
      }}
    >
      {name[0]}
    </Avatar>
    <Typography variant="body2" fontWeight="bold">
      {name}
    </Typography>
  </Stack>
);

export default function About() {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* HEADER SECTION */}
      <Stack alignItems="center" mb={8} textAlign="center">
        <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
          À propos de NosDéputés.fr
        </Typography>
        <Typography
          variant="h5"
          color="text.secondary"
          sx={{ maxWidth: 800, fontWeight: "light" }}
        >
          NosDéputés.fr est un site transpartisan géré par une équipe bénévole
          de citoyens, avec pour objectif de promouvoir l’accès à l’activité
          parlementaire française.
        </Typography>
      </Stack>

      {/* HISTOIRE SECTION */}
      <Paper
        elevation={0}
        sx={{ p: 4, mb: 6, bgcolor: "grey.50", borderRadius: 2 }}
      >
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <HistoryIcon color="primary" />
          <Typography variant="h4" fontWeight="bold">
            Notre Histoire
          </Typography>
        </Stack>
        <Typography paragraph>
          Initié en 2009 par l&apos;association{" "}
          <strong>Regards Citoyens</strong>, NosDéputés.fr est un projet
          pionnier de l&apos;ouverture des données publiques en France. Après
          plus de dix ans d&apos;existence, l&apos;équipe fondatrice a passé le
          flambeau en 2022 à une nouvelle équipe de citoyens bénévoles.
        </Typography>
        <Typography>
          Notre mission reste inchangée : moderniser l&apos;accès à
          l&apos;information parlementaire pour la rendre intelligible à tous,
          experts comme novices.
        </Typography>
      </Paper>

      {/* VALEURS SECTION */}
      <Box mb={8}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={4}>
          Ce qui nous unit
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={4}
          justifyContent="center"
          alignItems="stretch"
        >
          <Box flex={1}>
            <ValueCard
              title="Neutralité"
              icon={NeutralityIcon}
              text="Une initiative transpartisane. Les données brutes et les indicateurs sont présentés sans biais idéologique pour permettre à chacun de se forger sa propre opinion."
            />
          </Box>
          <Box flex={1}>
            <ValueCard
              title="Transparence"
              icon={TransparencyIcon}
              text="Nous rendons accessibles et intelligibles les données complexes de l'Assemblée. Toutes nos méthodes de calcul sont documentées et publiques."
            />
          </Box>
          <Box flex={1}>
            <ValueCard
              title="Open Source"
              icon={OpenSourceIcon}
              text="Le code du site est libre (licence AGPL-3.0). Nous croyons en la collaboration et permettons à d'autres initiatives non commerciales de réutiliser notre travail."
            />
          </Box>
        </Stack>
      </Box>

      <Divider sx={{ my: 6 }} />

      {/* VISION / FUTURE SECTION */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={6}
        alignItems="center"
        mb={8}
      >
        <Box flex={7}>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <TrendingUpIcon color="primary" />
            <Typography variant="h4" fontWeight="bold">
              Notre ambition
            </Typography>
          </Stack>
          <Typography mb={2} color="text.secondary">
            L&apos;information parlementaire reste souvent réservée aux initiés.
            Nous voulons lever trois obstacles majeurs :
          </Typography>

          <Box component="ol" sx={{ "& li": { mt: 2 } }}>
            <li>
              <Typography variant="subtitle1" fontWeight="bold">
                1. La thématisation
              </Typography>
              <Typography variant="body2">
                Classer les dossiers par sujets concrets (santé, énergie...)
                plutôt que par commission administrative.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle1" fontWeight="bold">
                2. Le vocabulaire
              </Typography>
              <Typography variant="body2">
                Décrypter le jargon législatif (amendement, navette, projet de
                loi) pour le rendre accessible.
              </Typography>
            </li>
            <li>
              <Typography variant="subtitle1" fontWeight="bold">
                3. La synthèse
              </Typography>
              <Typography variant="body2">
                Utiliser la technologie pour résumer des heures de débats et
                identifier les arguments clés.
              </Typography>
            </li>
          </Box>
        </Box>

        <Box flex={5} width="100%">
          <Paper
            sx={{
              p: 4,
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
              borderRadius: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" fontStyle="italic">
              &quot;À une époque de désinformation, il est primordial de revenir
              aux faits tels qu&apos;ils sont rendus accessibles
              publiquement.&quot;
            </Typography>
          </Paper>
        </Box>
      </Stack>

      {/* EQUIPE SECTION */}
      <Box mb={8} textAlign="center">
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          mb={4}
        >
          <TeamIcon color="primary" />
          <Typography variant="h4" fontWeight="bold">
            L&apos;équipe bénévole
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={4}>
          {["Alex", "David", "Emmanuel", "Henry", "Samuel", "Thomas"].map(
            (name) => (
              <TeamMember key={name} name={name} />
            )
          )}
        </Stack>
      </Box>

      {/* CALL TO ACTION */}
      <Paper
        sx={{
          p: 6,
          textAlign: "center",
          background: "linear-gradient(45deg, #171B1E 30%, #343A40 90%)",
          color: "white",
          borderRadius: 3,
        }}
      >
        <ContributeIcon sx={{ fontSize: 40, mb: 2, color: "#EF4444" }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom color="white">
          Vous pouvez aussi contribuer
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 4, maxWidth: 600, mx: "auto", opacity: 0.9 }}
          color="white"
        >
          Au-delà des coûts d’hébergement, votre soutien est inestimable pour
          nous encourager à développer de nouvelles fonctionnalités pour la
          démocratie.
        </Typography>
      </Paper>
    </Container>
  );
}
