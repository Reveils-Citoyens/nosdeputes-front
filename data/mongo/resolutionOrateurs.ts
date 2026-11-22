/**
 * Rattachement d'un orateur de compte rendu de commission à un député, par son
 * nom : ces comptes rendus ne portent pas d'identifiant d'orateur.
 *
 * Portage fidèle de resolution_orateurs.py, qui sert au calcul des
 * statistiques : le site et les chiffres attribuent les prises de parole avec
 * la même règle. Toute évolution se fait dans les deux fichiers.
 *
 * - Seuls les députés de la législature sont rattachés (et, pour l'affichage,
 *   les membres du Gouvernement) : un sénateur ou une personne auditionnée
 *   reste sans identifiant.
 * - Les homonymes sont écartés plutôt qu'arbitrés.
 * - « M. le rapporteur » est rattaché à la personne nommée plus haut avec la
 *   même fonction, dans le même compte rendu seulement.
 */

/** Ordonnées du plus spécifique au plus général. */
const FONCTIONS = [
  "rapporteur general",
  "rapporteure generale",
  "rapporteur pour avis",
  "rapporteure pour avis",
  "rapporteur special",
  "rapporteure speciale",
  "rapporteur",
  "rapporteure",
  "president",
  "presidente",
  "vice president",
  "vice presidente",
  "ministre",
  "secretaire d etat",
];

const CIVILITES = /^(m|mme|mlle|mr)\s+/;
const FONCTION_EN_TETE = new RegExp(`^(le|la|l)\\s+(${FONCTIONS.join("|")})\\b`);
const PARENTHESES = /\s*\([^)]*\)/g;

/** Minuscules, sans accents ni ponctuation, espaces normalisés. */
export function normaliser(texte: string | null | undefined): string {
  if (!texte) return "";
  return texte
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[.'’-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

function detecterFonction(nomBrut: string): string | null {
  const normalise = normaliser(nomBrut);
  return FONCTIONS.find((f) => new RegExp(`\\b${f}\\b`).test(normalise)) ?? null;
}

/** « M. le président Éric Coquerel » → ["eric coquerel", "president"]. */
export function decomposer(nomBrut: string): [string, string | null] {
  const fonction = detecterFonction(nomBrut);
  let nom = nomBrut.split(",")[0].replace(PARENTHESES, "");
  nom = normaliser(nom).replace(CIVILITES, "").replace(FONCTION_EN_TETE, "").trim();
  nom = nom.replace(/^d\s+age\s+/, "");
  return [nom, fonction];
}

type ActeurBrut = {
  uid?: string;
  etatCivil?: { ident?: { prenom?: string; nom?: string } };
  mandats?: { mandat?: unknown };
};

function estDepute(acteur: ActeurBrut, legislature: number, gouvernement: boolean): boolean {
  const mandats = acteur.mandats?.mandat;
  const liste = Array.isArray(mandats) ? mandats : mandats ? [mandats] : [];
  return liste.some((m) => {
    if (!m || typeof m !== "object") return false;
    const mandat = m as Record<string, unknown>;
    if (gouvernement && mandat.typeOrgane === "GOUVERNEMENT") return true;
    return mandat.typeOrgane === "ASSEMBLEE" && String(mandat.legislature ?? "") === String(legislature);
  });
}

/**
 * Index « prénom nom » normalisé → uid, restreint aux députés de la législature.
 *
 * `gouvernement` : y ajoute les membres du Gouvernement. Pour l'affichage d'un
 * débat (photo et nom d'un ministre auditionné), pas pour les statistiques,
 * qui ne comptent que les députés (resolution_orateurs.py).
 */
export function construireIndex(
  acteurs: ActeurBrut[],
  legislature: number,
  { gouvernement = false }: { gouvernement?: boolean } = {}
): Map<string, string> {
  const index = new Map<string, string>();
  const ambigus = new Set<string>();
  for (const acteur of acteurs) {
    if (!acteur.uid || !estDepute(acteur, legislature, gouvernement)) continue;
    const ident = acteur.etatCivil?.ident ?? {};
    const cle = normaliser(`${ident.prenom ?? ""} ${ident.nom ?? ""}`);
    if (!cle) continue;
    if (index.has(cle) && index.get(cle) !== acteur.uid) ambigus.add(cle);
    else index.set(cle, acteur.uid);
  }
  for (const cle of ambigus) index.delete(cle);
  return index;
}

/** Résout les orateurs d'un compte rendu, dans l'ordre du débat. */
export class ResolveurOrateurs {
  private fonctionVersUid = new Map<string, string>();

  constructor(private readonly index: Map<string, string>) {}

  resoudre(nomBrut: string): string | null {
    const [nom, fonction] = decomposer(nomBrut);
    const uid = nom ? this.index.get(nom) : undefined;
    if (uid) {
      if (fonction) this.fonctionVersUid.set(fonction, uid);
      return uid;
    }
    if (fonction && !nom) return this.fonctionVersUid.get(fonction) ?? null;
    return null;
  }
}
