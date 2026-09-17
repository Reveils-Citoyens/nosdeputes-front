import * as React from "react";

/**
 * Le document affiché est-il un compte rendu officiel ou une transcription ?
 *
 * Une réunion porte deux références distinctes dans les données Tricoteuses :
 * `compteRenduRefUid` pour le compte rendu officiel et `transcriptionRefUid`
 * pour la transcription. Leur UID permet de les distinguer sans ambiguïté :
 * les premiers commencent par `CR`, les secondes par `TR`.
 *
 * Le préfixe est donc le signal primaire. Le champ `validite` de l'API n'est
 * consulté qu'en repli pour un ancien identifiant ou un format encore inconnu.
 * Une panne de l'API ne doit notamment pas transformer un UID `CR…` connu en
 * document incertain.
 *
 * Tout format inconnu reste traité de manière défensive : sans UID reconnu ni
 * `validite: "valide"`, l'explication est affichée.
 */

export type FiabiliteCompteRendu = {
  /** Obtenu par les données ouvertes de l'Assemblée, seules à faire foi. */
  certifie: boolean;
  validite: string | null;
  version: string | null;
};

const CERTIFIE = "valide";
const PREFIXE_COMPTE_RENDU = "CR";
const PREFIXE_TRANSCRIPTION = "TR";

/**
 * Renvoie le statut porté par l'UID, ou `null` si son format est inconnu.
 * Cette fonction est exportée pour verrouiller la convention CR/TR par test.
 */
export function estCertifieDepuisUid(compteRenduUid: string): boolean | null {
  const uid = compteRenduUid.trim().toUpperCase();
  if (uid.startsWith(PREFIXE_TRANSCRIPTION)) return false;
  if (uid.startsWith(PREFIXE_COMPTE_RENDU)) return true;
  return null;
}

async function getFiabiliteCompteRenduUnCached(
  compteRenduUid: string
): Promise<FiabiliteCompteRendu | null> {
  if (!compteRenduUid) return null;

  const certifieDepuisUid = estCertifieDepuisUid(compteRenduUid);
  if (certifieDepuisUid !== null) {
    return {
      certifie: certifieDepuisUid,
      validite: null,
      version: null,
    };
  }

  // Repli pour les formats historiques ou futurs ne respectant pas CR/TR.
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
