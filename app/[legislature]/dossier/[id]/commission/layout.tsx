import React from "react";
import Container from "@mui/material/Container";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { EmptyState } from "@/components/folders/EmptyState";
import { DebateFilterBar } from "../debat/DebateFilterBar";
import { getDebats } from "@/data/getDebats";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ legislature: string; id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;

  const debats = await getDebats(id);

  const commissionDebats = debats?.filter(
    (debat) => debat.debateType === "commission" && debat._count.paragraphes > 0
  );

  if (!commissionDebats || commissionDebats.length === 0) {
    return (
      <Container sx={{ py: 6 }}>
        <EmptyState
          icon={<GroupsOutlinedIcon />}
          title="Pas de travaux en commission"
          message="Ce dossier n'a pas fait l'objet de réunions de commission référencées dans nos données."
        />
      </Container>
    );
  }

  return (
    <>
      <DebateFilterBar debats={commissionDebats} basePath="commission" />
      <div className="container">{children}</div>
    </>
  );
}
