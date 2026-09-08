import * as React from "react";
import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getActeurBySlug } from "@/data/getActeurBySlug";
import { getJourneesActeur } from "@/data/mongo/getJourneesActeur";
import JourneesClient from "./JourneesClient";

/**
 * L'index du détail : toutes les journées d'un député, chacune menant à ses
 * pièces justificatives.
 *
 * C'est l'adresse qu'on donne quand quelqu'un conteste un chiffre — celle qui
 * permet de dire « allez voir, jour par jour » plutôt que d'argumenter.
 */
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const acteur = await getActeurBySlug(slug);
  if (acteur === null) return null;

  const journees = await getJourneesActeur(acteur.uid);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h5" component="h1" fontWeight="bold">
        Le détail, jour par jour
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Chaque journée mène aux pièces qui composent les chiffres publiés :
        interventions retenues, interventions écartées et pour quelle raison,
        réunions et relevé d’émargement.
      </Typography>

      {journees.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aucune activité enregistrée pour cette législature.
        </Typography>
      ) : (
        <JourneesClient slug={slug} journees={journees} />
      )}
    </Container>
  );
}
