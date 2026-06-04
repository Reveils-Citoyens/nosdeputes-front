import { ActeLegislatif } from "@prisma/client";

/**
 * Libellé de lecture déduit du préfixe du codeActe.
 * Ex. AN1-… → "1re lecture", SN2-… → "2e lecture", ANLDEF-… → "lecture définitive".
 */
function readingLabel(code: string): string | null {
  const c = code.toUpperCase();
  if (c.startsWith("CMP")) return "commission mixte paritaire";
  if (c.includes("LDEF")) return "lecture définitive";
  if (c.includes("LUNI")) return "lecture unique";
  if (c.includes("NLEC")) return "nouvelle lecture";
  const m = c.match(/^(?:AN|SN)(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    return n === 1 ? "1re lecture" : `${n}e lecture`;
  }
  return null;
}

/**
 * Construit une table { documentUid → libellé de version } à partir des actes
 * législatifs, pour qualifier chaque document (texte initial, texte de la
 * commission, texte adopté, etc.) plutôt que d'afficher seulement une date.
 *
 * Les documents sont reliés aux actes via `texteAdopteRefUid` (texte produit
 * par l'acte) et `texteAssocieRefUid` (texte associé / déposé / adopté).
 */
export function buildDocumentVersionLabels(
  acts: ActeLegislatif[]
): Record<string, string> {
  const map: Record<string, string> = {};
  const set = (uid: string | null | undefined, label: string) => {
    if (uid && !map[uid]) map[uid] = label;
  };

  for (const act of acts) {
    const code = act.codeActe ?? "";
    const reading = readingLabel(code);
    const suffix = reading ? ` (${reading})` : "";
    const nom = (act.nomCanonique ?? "").toLowerCase();

    if (code.includes("DEPOT")) {
      // "1er dépôt" → texte initial ; "dépôt en navette" → texte transmis.
      const isNavette = nom.includes("navette");
      set(act.texteAssocieRefUid, isNavette ? `Texte transmis${suffix}` : "Texte initial");
    } else if (code.includes("COM-FOND-RAPPORT")) {
      set(act.texteAdopteRefUid, `Texte de la commission${suffix}`);
      set(act.texteAssocieRefUid, `Rapport${suffix}`);
    } else if (code.includes("DEBATS-DEC")) {
      set(act.texteAssocieRefUid, `Texte adopté${suffix}`);
    }
  }

  return map;
}
