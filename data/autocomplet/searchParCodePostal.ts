import type { ActeurSearchResult } from "@/data/mongo/searchActeurParNom";

const TRICOTEUSES_URL =
  "https://territoires.code4code.eu/circonscriptions_legislatives/autocomplete";

interface ApiMandat {
  typeOrgane: string;
  legislature?: string;
  dateFin?: string | null;
  election?: {
    lieu?: {
      numDepartement?: string;
      numCirco?: string;
      departement?: string;
    };
  };
  organesRefs?: string[];
}

interface ApiActeur {
  uid: string;
  etatCivil: { ident: { prenom: string; nom: string } };
  mandats?: Record<string, ApiMandat>;
}

interface Suggestion {
  score: number;
  depute?: ApiActeur;
}

/**
 * Recherche le(s) député(s) correspondant à un code postal via l'API
 * territoires.code4code.eu (Tricoteuses). Chaque suggestion retournée inclut
 * la circonscription législative et le député associé.
 */
export async function searchActeurParCodePostalTricoteuses(
  codePostal: string
): Promise<ActeurSearchResult[]> {
  const params = new URLSearchParams([
    ["q", codePostal],
    ["field", "circonscription_legislative"],
    ["field", "depute"],
  ]);

  let suggestions: Suggestion[] = [];
  try {
    const res = await fetch(`${TRICOTEUSES_URL}?${params}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    ({ suggestions } = await res.json());
  } catch {
    return [];
  }

  const seen = new Set<string>();
  const results: ActeurSearchResult[] = [];

  for (const suggestion of suggestions) {
    const depute = suggestion.depute;
    if (!depute || seen.has(depute.uid)) continue;
    seen.add(depute.uid);

    const mandats = Object.values(depute.mandats ?? {});

    const mandatAN = mandats.find(
      (m) => m.typeOrgane === "ASSEMBLEE" && m.legislature === "17"
    );
    const mandatGP = mandats.find(
      (m) =>
        m.typeOrgane === "GP" &&
        m.legislature === "17" &&
        !m.dateFin
    );

    const lieu = mandatAN?.election?.lieu;

    results.push({
      uid: depute.uid,
      prenom: depute.etatCivil.ident.prenom,
      nom: depute.etatCivil.ident.nom,
      numCirco: lieu?.numCirco ? parseInt(lieu.numCirco, 10) : null,
      numDepartement: lieu?.numDepartement ?? null,
      departement: lieu?.departement ?? null,
      groupeParlementaireUid: mandatGP?.organesRefs?.[0] ?? null,
      score: suggestion.score,
    });
  }

  return results;
}
