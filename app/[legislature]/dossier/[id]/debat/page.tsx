// app/[legislature]/dossier/[id]/debat/page.tsx
import { redirect } from "next/navigation";
import { getDebats } from "@/data/getDebats";

export default async function Page({ params }: { params: Promise<{ id: string, legislature: string }> }) {
  const { id, legislature } = await params;
  const debats = await getDebats(id);
  
  const debatsDisponibles = debats?.filter(d => d._count.paragraphes > 0);

  if (debatsDisponibles && debatsDisponibles.length > 0) {
    redirect(`/${legislature}/dossier/${id}/debat/${debatsDisponibles[0].uid}`);
  }

  return <p>Ce dossier ne semble pas avoir fait l'objet de débats.</p>;
}