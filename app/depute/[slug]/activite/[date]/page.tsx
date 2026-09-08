import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import MuiLink from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { getDetailJournee } from "@/data/mongo/getDetailJournee";
import { getVideosDesReunions } from "@/data/getVideoReunion";
import JourneeClient from "./JourneeClient";

/**
 * Le détail d'une journée d'activité, à une adresse stable.
 *
 * L'URL est le point : un député qui conteste un chiffre doit pouvoir écrire
 * « votre page du 21 octobre dit ceci », et nous devons pouvoir répondre en
 * pointant la même. Une modale ne se cite pas, ne s'envoie pas, ne s'archive
 * pas — elle vient en second, et affiche ce que cette page contient.
 */

// Une page par député et par jour, soit environ 160 000 adresses : utiles et
// citables, mais elles noieraient le reste du site dans les moteurs de
// recherche. Accessibles à qui les demande, pas indexées.
export const metadata: Metadata = { robots: { index: false, follow: true } };

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; date: string }>;
}) {
  const { slug, date } = await params;
  const acteur = await getActeurBySlug(slug);
  if (acteur === null) return null;

  const detail = await getDetailJournee(acteur.uid, date);

  // Les réunions de commission viennent de MongoDB, qui ne porte aucun champ
  // vidéo : seule l'API Tricoteuses résout les liens. Une journée compte au
  // plus quelques réunions, mais la requête est groupée par principe.
  const videosReunions = await getVideosDesReunions(
    detail?.reunions.map((r) => r.reunionUid) ?? []
  );

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* La page d'un jour se cite et s'ouvre directement : il lui faut un
          retour vers la liste, que l'onglet seul ne fournit pas. */}
      <MuiLink
        component={Link}
        href={`/depute/${slug}/activite`}
        variant="caption"
        color="text.secondary"
        sx={{ display: "inline-block", mb: 0.5 }}
      >
        ← Toutes les journées
      </MuiLink>
      <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
        Activité du {formatDate(date)}
      </Typography>

      {detail === null ? (
        <Typography variant="body2" color="text.secondary">
          Aucune activité enregistrée ce jour-là.
        </Typography>
      ) : (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Chaque ligne ci-dessous est une pièce du décompte. Les interventions
            qui n’ont pas été comptées sont affichées avec la règle qui les a
            écartées.
          </Typography>
          <JourneeClient detail={detail} videosReunions={videosReunions} />
        </Box>
      )}
    </Container>
  );
}
