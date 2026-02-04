import * as React from "react";
import { DebateSummary } from "./DebateSummary";
import { SUMMARY_CODES } from "@/components/const";
import { DebateTranscript } from "./DebateTranscript";
import { getInterventions } from "@/data/getInterventions";
import { getDebats } from "@/data/getDebats";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; debatUid: string }>;
}) {
  const { id: dossierUid, debatUid } = await params;

  const interventions = await getInterventions(debatUid);
  const debats = await getDebats(dossierUid);

  const debat = debats?.find((d) => d.uid === debatUid);

  if (!interventions || interventions.length === 0) {
    return <p>Aucun débat trouvé pour cette séance.</p>;
  }

  let lastId = "init";

  const wordsCounts: Record<string, number> = interventions.reduce(
    (acc, paragraphe) => {
      if (!paragraphe) return acc;
      
      const { codeGrammaire, texte, id } = paragraphe;

      if (id && SUMMARY_CODES.has(codeGrammaire!)) {
        lastId = id.toString();
        acc[lastId] = 0;
        return acc;
      }

      if (["PAROLE_GENERIQUE", "INTERRUPTION_1_10"].includes(codeGrammaire!)) {
        const texteLength = texte ? texte.split(" ").length : 0;
        acc[lastId] = (acc[lastId] || 0) + texteLength;
      }
      return acc;
    },
    { init: 0 } as Record<string, number>
  );

  const sections = interventions.filter((p) =>
    p?.id && p?.codeGrammaire && SUMMARY_CODES.has(p.codeGrammaire)
  );

  const hasSummary = sections.length > 0;

return (
    <>
      { /* On n'affiche la colonne de gauche que s'il y a un sommaire associé */}
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
          title={debat?.dateSeance ?? ""}
          paragraphes={interventions}
          wordsCounts={wordsCounts}
          debatUid={debatUid}   
          chambre={debat?.chambre ?? "AN"} />
      </div>
    </>
  );
}
