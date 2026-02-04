import React from "react";
import { DebateFilterBar } from "./DebateFilterBar";
import { getDossier } from "@/data/getDossier";

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

  const dossier = await getDossier(id);

  // on recupère tous les object de reunion depuis les actes legisltaifs du dossier
  // qui ont un compteRenduRefUid (donc un debat associé) et qui contiennent un point odj
  // lié à ce dossier legislatif qui n'a pas été annulé
  const reunionsWithCompteRendu: any[] = [];
  const seenAgendaUids = new Set<string>();
  
  dossier?.actesLegislatifs.forEach((acte) => {
    if (acte.agendaRef && acte.codeActe.includes("SEANCE")) {
      // Skip si cette réunion a déjà été ajoutée
      if (seenAgendaUids.has(acte.agendaRef.uid)) {
        return;
      }

      if (
        acte.agendaRef.compteRenduRefUid &&
        acte.agendaRef.pointsOdj.filter((pt) => (pt.dossierLegislatifUid === id && pt.etat != "Annulé")).length > 0  
      ) {
        seenAgendaUids.add(acte.agendaRef.uid);
        reunionsWithCompteRendu.push(acte.agendaRef);
      }
    }
  });
  if (reunionsWithCompteRendu.length === 0) {
    return <p>Aucun débat n&apos;a été trouvé pour ce dossier legislatif.</p>;
  }

  return (
    <>
      <DebateFilterBar reunions={reunionsWithCompteRendu} />
      <div className="container">{children}</div>
    </>
  );
}
