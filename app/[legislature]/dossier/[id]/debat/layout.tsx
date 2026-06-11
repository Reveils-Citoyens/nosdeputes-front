import React from "react";
import Container from "@mui/material/Container";
import RecordVoiceOverOutlinedIcon from "@mui/icons-material/RecordVoiceOverOutlined";
import { EmptyState } from "@/components/folders/EmptyState";
import { DebateFilterBar } from "./DebateFilterBar";
import { getDebats } from "@/data/getDebats";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{
    legislature: string;
    id: string;
  }>;
  children: React.ReactNode;
}) {
  const { id } = await params;

  const debats = await getDebats(id);

  const seanceDebats = debats?.filter(
    (debat) => debat.debateType === "seance" && debat._count.paragraphes > 0
  );

  if (!seanceDebats || seanceDebats.length === 0) {
    return (
      <Container sx={{ py: 6 }}>
        <EmptyState
          icon={<RecordVoiceOverOutlinedIcon />}
          title="Pas de séance publique"
          message="Ce dossier n'a pas fait l'objet de débats en séance publique référencés dans nos données."
        />
      </Container>
    );
  }

  return (
    <>
      <DebateFilterBar debats={seanceDebats} basePath="debat" />
      <div className="container">{children}</div>
    </>
  );
}
