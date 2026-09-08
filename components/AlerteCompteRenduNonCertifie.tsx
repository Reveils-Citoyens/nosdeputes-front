import * as React from "react";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import type { FiabiliteCompteRendu } from "@/data/getFiabiliteCompteRendu";

/**
 * Signale que le compte rendu affiché n'a pas été obtenu par l'open data de
 * l'Assemblée, mais collecté sur son site.
 *
 * ⚠️ Ne pas écrire que le texte « peut résulter d'une transcription
 * automatique ». Vérification faite sur 25 comptes rendus de commission tirés
 * au hasard : tous portent les marques d'une rédaction par le service des
 * comptes rendus — heures écrites en toutes lettres (« La réunion commence à
 * dix-sept heures trente »), mentions de présidence, narration à la troisième
 * personne. Le texte est bien celui de l'Assemblée.
 *
 * Ce qui diffère est le canal, et ses conséquences sont réelles : le nom de
 * l'orateur y est une chaîne de caractères sans identifiant — zéro sur
 * 1 492 orateurs échantillonnés en portent un — si bien que le rattachement à
 * un député repose sur un rapprochement de noms, à 77 %. Et l'Assemblée peut
 * corriger sa page après notre collecte.
 *
 * Placé en tête de transcription, avant toute citation : un lecteur qui recopie
 * un verbatim doit le savoir avant de le lire, pas après.
 */
export default function AlerteCompteRenduNonCertifie({
  fiabilite,
}: {
  fiabilite: FiabiliteCompteRendu | null;
}) {
  // Fiabilité inconnue — API injoignable, compte rendu absent : on avertit
  // quand même. Au moindre doute, mieux vaut une mention de trop.
  if (fiabilite?.certifie) return null;

  return (
    <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
      <AlertTitle sx={{ fontWeight: 600 }}>
        Compte rendu collecté sur le site de l’Assemblée
      </AlertTitle>
      Ce texte est celui publié par l’Assemblée nationale, mais nous l’avons
      recueilli sur son site et non dans ses données ouvertes, seules à faire
      foi. Deux réserves en découlent : les orateurs y sont désignés par leur
      nom sans identifiant, si bien que leur rattachement à un député est
      déduit et peut se tromper ; et l’Assemblée peut avoir corrigé sa page
      depuis notre collecte.
    </Alert>
  );
}
