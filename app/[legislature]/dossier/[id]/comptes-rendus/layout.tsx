import React from "react";
import { Container } from "@mui/material";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import { getDossier } from "@/data/getDossier";
import { getMissionReunions } from "@/data/mongo/getMissionReunions";
import { DebateFilterBar } from "../debat/DebateFilterBar";
import { EmptyState } from "@/components/folders/EmptyState";

function formatJour(iso: string | null): string {
  if (!iso) return "Réunion";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Réunion";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ legislature: string; id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  const dossier = await getDossier(id);

  const reunions = (
    await getMissionReunions(dossier?.titre ?? null, dossier?.legislature ?? null)
  ).filter((r) => r.compteRenduRefUid);

  if (reunions.length === 0) {
    return (
      <Container sx={{ py: { xs: 3, md: 5 } }}>
        <EmptyState
          icon={<ForumOutlinedIcon />}
          title="Aucun compte rendu disponible"
          message="Les comptes rendus des auditions et réunions seront publiés ici au fur et à mesure de l'avancement des travaux."
        />
      </Container>
    );
  }

  // Réutilise le sélecteur (dropdown) des pages de débats.
  const items = reunions.map((r) => ({
    uid: r.compteRenduRefUid as string,
    dateSeanceJour: formatJour(r.date),
  }));

  return (
    <>
      <DebateFilterBar debats={items} basePath="comptes-rendus" />
      <div className="container">{children}</div>
    </>
  );
}
