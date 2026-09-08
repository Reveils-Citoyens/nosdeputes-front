import * as React from "react";
import WeeklyActivitySectionClient from "./WeeklyActivitySectionClient";
import {
  getStatistiquesHebdomadaires,
  type TypeStatistique,
} from "@/data/mongo/getStatistiquesHebdomadaires";

// Les deux indicateurs de présence reposent sur un identifiant fourni par
// l'Assemblée — prise de parole horodatée en séance publique, relevé nominatif
// en commission. Les interventions ne sont pas affichées ici : elles mesurent
// un volume de parole, pas une présence, et les mélanger était précisément le
// défaut qu'on a corrigé.
const TYPES: TypeStatistique[] = ["presenceSeancePublique", "presenceCommission"];

export default async function WeeklyActivitySection(props: {
  acteurUid: string;
}) {
  const statistiques = await getStatistiquesHebdomadaires(props.acteurUid, TYPES);

  // Sans données — import nocturne qui n'a pas tourné, MongoDB injoignable — le
  // graphe afficherait une série à zéro sur toutes les semaines, ce qui se lit
  // comme un député totalement absent. Mieux vaut ne rien montrer qu'accuser à
  // tort : on masque la section.
  if (statistiques.length === 0) {
    return null;
  }

  return (
    <WeeklyActivitySectionClient
      acteurUid={props.acteurUid}
      statistiques={statistiques}
    />
  );
}
