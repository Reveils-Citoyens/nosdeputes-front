import React from "react";
import Container from "@mui/material/Container";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import { EmptyState } from "@/components/folders/EmptyState";
import { getDebats } from "@/data/getDebats";
import CommissionNavigationShell from "./CommissionNavigationShell";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ legislature: string; id: string }>;
  children: React.ReactNode;
}) {
  const { legislature, id } = await params;

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
    <CommissionNavigationShell
      debats={commissionDebats}
      baseHref={`/${legislature}/dossier/${id}/commission`}
    >
      {children}
    </CommissionNavigationShell>
  );
}
