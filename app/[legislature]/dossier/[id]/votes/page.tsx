// app/[legislature]/dossier/[id]/votes/page.tsx
import React from "react";
import { getDossierVotesSummary } from "@/data/getDossierVotesSummary";
import { VotesView } from "./VotesView";
import Container from "@mui/material/Container";

export default async function VotesPage({
  params,
}: {
  params: Promise<{ id: string; legislature: string }>;
}) {
  const { id } = await params;
  
  const dossierWithVotes = await getDossierVotesSummary(id);

  if (!dossierWithVotes) {
    return (
      <Container sx={{ mt: 4 }}>
        <p>Impossible de charger les votes pour ce dossier.</p>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 3 }}>
      <VotesView dossier={dossierWithVotes} />
    </Container>
  );
}
