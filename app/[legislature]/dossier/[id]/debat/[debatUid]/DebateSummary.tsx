"use client";

import React from "react";
import { Paragraphe } from "@prisma/client";
import { cleanText } from "../../../../../../components/folders/DebatTab/cleanText";
import { SommaireLateral } from "@/components/navigation/SommaireLateral";

type DebateSummaryProps = {
  sections: Paragraphe[];
};

/** Sommaire d'un compte rendu : les titres de section du débat. */
export const DebateSummary = ({ sections }: DebateSummaryProps) => {
  const entrees = React.useMemo(
    () => sections.map(({ uid, texte }) => ({ id: uid, libelle: cleanText(texte!, true) })),
    [sections],
  );
  // Sous la barre de navigation collante (80 px).
  return <SommaireLateral entrees={entrees} haut={96} />;
};
