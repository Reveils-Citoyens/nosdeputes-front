import * as React from "react";

/**
 * Le compte rendu affiché provient-il des données ouvertes de l'Assemblée ?
 *
 * L'API ne dit pas comment un compte rendu a été produit. Le champ qui s'en
 * approche — `transcriptionRefUid` sur la réunion — est bien alimenté (64 des
 * 126 réunions de commission récentes échantillonnées), mais il pointe vers une
 * ressource que l'API n'expose pas : `/transcriptions/<uid>` répond 404. Il est
 * donc inexploitable en l'état.
 *
 * ⚠️ Ce champ n'existe pas non plus dans les données brutes de l'Assemblée que
 * nous ingérons : la collection `reunions` de MongoDB ne le porte pas. Il est
 * ajouté par Tricoteuses. Le chercher côté Mongo donne zéro et fait croire à
 * tort qu'il n'est jamais renseigné.
 *
 * On s'appuie donc sur la signature des métadonnées, qui sépare nettement les
 * sources.
 *
 * Sur les 601 comptes rendus de séance de l'Assemblée, tous portent
 * `validite: "valide"`, `version: "avant_JO"` — la version officielle publiée
 * avant le Journal officiel. Les 2 762 comptes rendus de commission ont ces
 * champs vides : Tricoteuses les collecte sur le site de l'Assemblée.
 *
 * ⚠️ Ce n'est pas une différence d'auteur. Vérification faite sur 25 comptes
 * rendus de commission : tous sont rédigés par le service des comptes rendus
 * (heures en toutes lettres, mentions de présidence, narration à la troisième
 * personne). Ce qui change est le canal d'obtention, et ce qu'il coûte : les
 * orateurs y sont sans identifiant, donc rattachés par rapprochement de noms.
 *
 * La règle est volontairement défensive et tournée vers l'avenir : tout ce qui
 * n'est pas explicitement `valide` est présenté comme non certifié. Si des
 * transcriptions automatiques apparaissent un jour côté séance publique, elles
 * seront signalées sans qu'il faille toucher au code.
 *
 * ⚠️ `validite: "non-certifie"` existe aussi, mais uniquement sur les commissions
 * du Sénat : c'est une convention sénatoriale, pas un marqueur de transcription.
 */

export type FiabiliteCompteRendu = {
  /** Obtenu par les données ouvertes de l'Assemblée, seules à faire foi. */
  certifie: boolean;
  validite: string | null;
  version: string | null;
};

const CERTIFIE = "valide";

async function getFiabiliteCompteRenduUnCached(
  compteRenduUid: string
): Promise<FiabiliteCompteRendu | null> {
  if (!compteRenduUid) return null;

  try {
    const reponse = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/debats/${compteRenduUid}?select=uid,validite,version`,
      { next: { revalidate: 86400 } }
    );
    if (!reponse.ok) return null;

    const { data } = await reponse.json();
    if (!data) return null;

    return {
      certifie: data.validite === CERTIFIE,
      validite: data.validite || null,
      version: data.version || null,
    };
  } catch (error) {
    console.error("Error fetching fiabilité compte rendu:", error);
    return null;
  }
}

export const getFiabiliteCompteRendu = React.cache(
  getFiabiliteCompteRenduUnCached
);
