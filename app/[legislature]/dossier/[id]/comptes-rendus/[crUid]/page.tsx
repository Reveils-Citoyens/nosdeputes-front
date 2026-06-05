import * as React from "react";
import { getInterventions } from "@/data/getInterventions";
import { SUMMARY_CODES } from "@/components/const";
import { DebateTranscript } from "../../debat/[debatUid]/DebateTranscript";
import { DebateSummary } from "../../debat/[debatUid]/DebateSummary";

function formatDate(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export default async function CompteRenduPage({
  params,
}: {
  params: Promise<{ crUid: string }>;
}) {
  const { crUid } = await params;
  const interventions = await getInterventions(crUid);

  if (!interventions || interventions.length === 0) {
    return <p>Le compte rendu de cette réunion n&apos;est pas disponible.</p>;
  }

  // Sommaire + temps de parole — même logique que les débats en séance.
  let lastId = "init";
  const wordsCounts = interventions.reduce(
    (acc, p) => {
      const { codeGrammaire, texte } = p;
      if (SUMMARY_CODES.has(codeGrammaire!)) {
        lastId = p.uid.toString();
        return { ...acc, [lastId]: 0 };
      }
      if (["PAROLE_GENERIQUE", "INTERRUPTION_1_10"].includes(codeGrammaire!)) {
        const len = texte ? texte.split(" ").length : 0;
        return { ...acc, [lastId]: (acc[lastId] ?? 0) + len };
      }
      return acc;
    },
    { init: 0 } as Record<string, number>
  );

  const sections = interventions.filter((p) => SUMMARY_CODES.has(p.codeGrammaire!));
  const hasSummary = sections.length > 0;
  const dateLabel = formatDate(interventions[0]?.dateSeance);

  return (
    <>
      {hasSummary && (
        <div style={{ display: "flex", flexDirection: "row", gap: 24, flex: 2 }}>
          <DebateSummary sections={sections} wordsCounts={wordsCounts} />
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 5,
          margin: hasSummary ? "0" : "0 auto",
          maxWidth: hasSummary ? "none" : "800px",
          width: "100%",
        }}
      >
        <DebateTranscript
          title={dateLabel ?? "Compte rendu"}
          paragraphes={interventions}
          wordsCounts={wordsCounts}
        />
      </div>
    </>
  );
}
