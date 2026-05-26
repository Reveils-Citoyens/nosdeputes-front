import React from "react";
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
    return <p>Aucune réunion de commission n&apos;a été trouvée pour ce dossier.</p>;
  }

  return (
    <>
      <DebateFilterBar debats={commissionDebats} basePath="commission" />
      <div className="container">{children}</div>
    </>
  );
}
