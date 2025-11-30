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
      const { codeGrammaire, texte } = paragraphe;

      if (SUMMARY_CODES.includes(codeGrammaire!)) {
        lastId = paragraphe.id.toString();
        return { ...acc, [lastId]: 0 };
      }

      if (["PAROLE_GENERIQUE", "INTERRUPTION_1_10"].includes(codeGrammaire!)) {
        const texteLength = texte ? texte.split(" ").length : 0;
        return {
          ...acc,
          [lastId]: acc[lastId] + texteLength,
        };
      }
      return acc;
    },
    {
      init: 0,
    } as Record<string, number>
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 24,
          flex: 2,
        }}
      >
        <DebateSummary
          // wordsCounts={wordsCounts}
          sections={interventions.filter((p) =>
            SUMMARY_CODES.includes(p.codeGrammaire!)
          )}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 5 }}>
        <DebateTranscript
          title={debat?.dateSeanceJour ?? ""}
          paragraphes={interventions}
          wordsCounts={wordsCounts}
        />
      </div>
    </>
  );
}
