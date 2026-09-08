import * as React from "react";
import { DebateSummary } from "./DebateSummary";
import { SUMMARY_CODES } from "@/components/const";
import { DebateTranscript } from "./DebateTranscript";
import { getInterventions } from "@/data/getInterventions";
import { getDebats } from "@/data/getDebats";
import { getVideoReunion } from "@/data/getVideoReunion";
import { getFiabiliteCompteRendu } from "@/data/getFiabiliteCompteRendu";
import AlerteCompteRenduNonCertifie from "@/components/AlerteCompteRenduNonCertifie";
import BoutonVideoReunion from "@/components/BoutonVideoReunion";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; debatUid: string }>;
}) {
  const { id: dossierUid, debatUid } = await params;

  const interventions = await getInterventions(debatUid);
  const debats = await getDebats(dossierUid);

  const debat = debats?.find((d) => d.uid === debatUid);
  // La vidéo est portée par la réunion, pas par le compte rendu.
  const video = await getVideoReunion(debat?.reunionRefUid);
  const fiabilite = await getFiabiliteCompteRendu(debatUid);

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
        console.log("codeGrammaire: ", codeGrammaire, paragraphe);
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

  // Aucune intervention horodatée : c'est une réunion de commission, dont les
  // comptes rendus ne portent pas de `stime`. La vidéo reste accessible, mais
  // d'un seul tenant.
  const aucunCalage = !interventions.some((p) => p.stime != null);

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
        {video && aucunCalage ? (
          // Cette même page sert les débats en séance et les réunions de
          // commission. En séance, chaque prise de parole porte son horodatage
          // et donc son propre bouton dans le fil : un bouton global ferait
          // doublon. En commission, `stime` est vide partout — sans ce bouton,
          // la vidéo existe mais rien ne permet de l'atteindre.
          <div style={{ marginBottom: 16 }}>
            <BoutonVideoReunion
              video={video}
              legende={debat?.dateSeanceJour ?? "Réunion"}
            />
          </div>
        ) : null}
        <AlerteCompteRenduNonCertifie fiabilite={fiabilite} />
        <DebateTranscript
          title={debat?.dateSeanceJour ?? ""}
          paragraphes={interventions}
          wordsCounts={wordsCounts}
          video={video}
        />
      </div>
    </>
  );
}
