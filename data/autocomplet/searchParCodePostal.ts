import { getParlementDb } from "@/lib/mongodb";
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
  /** Ex : "01600 MASSIEUX" */
  autocompletion: string;
  score: number;
  depute?: ApiActeur;
}

/**
 * Recherche le(s) député(s) correspondant à un code postal via l'API
 * territoires.code4code.eu (Tricoteuses). Chaque suggestion retournée inclut
 * la circonscription législative et le député associé.
 *
 * L'API est une autocomplete qui renvoie des correspondances partielles
 * (ex. "01600" peut renvoyer "01660", "06600"…). On filtre donc pour ne
 * conserver que les suggestions dont le code postal dans `autocompletion`
 * correspond exactement à la requête (format "XXXXX NOM-DE-COMMUNE").
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

  // Ne garder que les suggestions dont le code postal de l'autocompletion
  // correspond EXACTEMENT au code postal saisi (le format est "XXXXX NOM").
  const exact = suggestions.filter((s) =>
    s.autocompletion.startsWith(`${codePostal} `) ||
    s.autocompletion === codePostal
  );

  const seen = new Set<string>();
  const results: ActeurSearchResult[] = [];

  for (const suggestion of exact) {
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

    // Mandat achevé = pas de mandat ASSEMBLEE L17 actif (dateFin null)
    const activeAN = mandats.filter(
      (m) =>
        m.typeOrgane === "ASSEMBLEE" &&
        m.legislature === "17" &&
        !m.dateFin
    );
    const mandatAcheve = activeAN.length === 0;

    const lieu = mandatAN?.election?.lieu;

    results.push({
      uid: depute.uid,
      prenom: depute.etatCivil.ident.prenom,
      nom: depute.etatCivil.ident.nom,
      numCirco: lieu?.numCirco ? parseInt(lieu.numCirco, 10) : null,
      numDepartement: lieu?.numDepartement ?? null,
      departement: lieu?.departement ?? null,
      groupeParlementaireUid: mandatGP?.organesRefs?.[0] ?? null,
      groupeParlementaire: null, // enrichi ci-dessous
      score: suggestion.score,
      mandatAcheve,
    });
  }

  // Enrichissement : lookup des infos de groupe parlementaire depuis MongoDB
  // (libelle, libelleAbrev, couleurAssociee) à partir des uids déjà connus.
  const gpUids = results
    .map((r) => r.groupeParlementaireUid)
    .filter((uid): uid is string => !!uid);

  if (gpUids.length > 0) {
    try {
      const db = await getParlementDb();
      const organes = await db
        .collection("organes")
        .find(
          { uid: { $in: gpUids } },
          { projection: { _id: 0, uid: 1, libelle: 1, libelleAbrev: 1, couleurAssociee: 1 } }
        )
        .toArray();

      const organeByUid = new Map(organes.map((o) => [o.uid as string, o]));

      for (const r of results) {
        if (r.groupeParlementaireUid) {
          const o = organeByUid.get(r.groupeParlementaireUid);
          if (o) {
            r.groupeParlementaire = {
              libelle: o.libelle ?? null,
              libelleAbrev: o.libelleAbrev ?? null,
              couleurAssociee: o.couleurAssociee ?? null,
            };
          }
        }
      }
    } catch {
      // Silently ignore — groupeParlementaire reste null, la carte s'affiche quand même
    }
  }

  return results;
}
