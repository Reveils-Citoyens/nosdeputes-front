import React from "react";
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
    return <p>Aucune séance publique n&apos;a été trouvée pour ce dossier législatif.</p>;
  }

  return (
    <>
      <DebateFilterBar debats={seanceDebats} basePath="debat" />
      <div className="container">{children}</div>
    </>
  );
}
