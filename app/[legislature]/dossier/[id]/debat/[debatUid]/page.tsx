import * as React from "react";
import { DebateSummary } from "./DebateSummary";
import { SUMMARY_CODES } from "@/components/const";
import { DebateTranscript } from "./DebateTranscript";
import { getInterventions } from "@/data/getInterventions";
import { getDossier } from "@/data/getDossier";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; debatUid: string }>;
}) {

  // url parameter is debatUid but it refers to agendaUid (reunion)
  const { id: dossierUid, debatUid: agendaUid } = await params;

  const dossier = await getDossier(dossierUid);
  const acteSeance = dossier?.actesLegislatifs.find(
    (acte) => acte.agendaRef?.uid === agendaUid
  );
  const agenda = acteSeance.agendaRef;
  
  // Identifier le point d'ordre associé à ce dossier législatif
  const orderPoint = agenda.pointsOdj.find(
    (pt) => (pt.dossierLegislatifUid === dossierUid && pt.etat === "Terminé"),
  )?.ordrePoint;

  // on récupère les interventions associées à la reunion et à l'ordre du jour
  const interventions = await getInterventions(agenda.compteRenduRefUid, orderPoint);
  const dateSeanceJour = agenda.timestampDebut
      ? new Date(agenda.timestampDebut).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        })
      : "Date inconnue";

  if (!interventions || interventions.length === 0) {
    return <p>Aucun débat trouvé pour cette séance.</p>;
  }

  let lastId = "init";

  const wordsCounts: Record<string, number> = interventions.reduce(
    (acc, paragraphe) => {
      const { codeGrammaire, texte } = paragraphe;
      if (SUMMARY_CODES.has(codeGrammaire!)) {
        lastId = paragraphe.uid.toString();
        return { ...acc, [lastId]: 0 };
      }

      if (["PAROLE_GENERIQUE", "INTERRUPTION_1_10"].includes(codeGrammaire!)) {
        const texteLength = texte ? texte.split(" ").length : 0;
        return {
          ...acc,
          [lastId]: acc[lastId] + texteLength,
        };
      } else {
        // console.log("codeGrammaire: ", codeGrammaire, paragraphe);
      }
      return acc;
    },
    {
      init: 0,
    } as Record<string, number>,
  );

  const sections = interventions.filter((p) =>
    SUMMARY_CODES.has(p.codeGrammaire!),
  );

  const hasSummary = sections.length > 0;

  return (
    <>
      {/* On n'affiche la colonne de gauche que s'il y a un sommaire associé */}
      {hasSummary && (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 24,
            flex: 2,
          }}
        >
          <DebateSummary sections={sections} />
        </div>
      )}

      {/* On adapte le style de la colonne principale */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 5,
          margin: hasSummary ? "0" : "0 auto",
          maxWidth: hasSummary ? "none" : "750px",
          width: "100%",
        }}
      >
        <DebateTranscript
          title={dateSeanceJour}
          paragraphes={interventions}
          wordsCounts={wordsCounts}
        />
      </div>
    </>
  );
}
