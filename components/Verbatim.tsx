import * as React from "react";

/**
 * Rend le texte d'une intervention tel que l'Assemblée le publie.
 *
 * Les comptes rendus ne contiennent pas du HTML mais un balisage maison, quatre
 * balises en tout : `italique`, `exposant`, `indice` et `br`. Affiché tel quel,
 * il apparaît en clair au milieu du verbatim — « <br> » et « <italique> » lus
 * comme du texte.
 *
 * Le rendu passe par des nœuds React plutôt que par `dangerouslySetInnerHTML` :
 * la source est un flux tiers qu'on ne maîtrise pas, et tout ce qui n'est pas
 * l'une de ces quatre balises doit rester du texte, échappé par React. Une
 * balise inconnue s'affichera donc littéralement — c'est voulu : mieux vaut la
 * voir et la traiter que l'injecter.
 */

const BALISES: Record<string, "em" | "sup" | "sub"> = {
  italique: "em",
  exposant: "sup",
  indice: "sub",
};

// Les quatre balises connues, ouvrantes ou fermantes, et les retours à la ligne.
const MOTIF = /<(\/?)(italique|exposant|indice)>|<br\s*\/?>/gi;

/** Décode les entités nommées et numériques restées dans le texte source. */
function decoder(texte: string): string {
  return texte
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&(?:lt|gt|quot|apos);/g, (entite) =>
      ({ "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" })[entite] ?? entite
    )
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) =>
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

export default function Verbatim({ texte }: { texte: string }) {
  const noeuds = React.useMemo(() => {
    const sortie: React.ReactNode[] = [];
    // Pile des balises ouvertes : le contenu s'accumule dans le dernier niveau.
    const pile: { balise: "em" | "sup" | "sub"; enfants: React.ReactNode[] }[] = [];
    const courant = () =>
      pile.length > 0 ? pile[pile.length - 1].enfants : sortie;

    let position = 0;
    let clef = 0;
    MOTIF.lastIndex = 0;

    for (
      let trouve = MOTIF.exec(texte);
      trouve !== null;
      trouve = MOTIF.exec(texte)
    ) {
      const avant = texte.slice(position, trouve.index);
      if (avant) courant().push(decoder(avant));
      position = trouve.index + trouve[0].length;

      const [, fermante, nom] = trouve;
      if (!nom) {
        courant().push(<br key={`br-${clef++}`} />);
        continue;
      }

      const balise = BALISES[nom.toLowerCase()];
      if (fermante) {
        const ouverte = pile.pop();
        if (ouverte) {
          courant().push(
            React.createElement(
              ouverte.balise,
              { key: `${ouverte.balise}-${clef++}` },
              ...ouverte.enfants
            )
          );
        }
      } else {
        pile.push({ balise, enfants: [] });
      }
    }

    const reste = texte.slice(position);
    if (reste) courant().push(decoder(reste));

    // Balises jamais refermées : on rend leur contenu plutôt que de le perdre.
    while (pile.length > 0) {
      const ouverte = pile.pop();
      if (ouverte) courant().push(...ouverte.enfants);
    }

    return sortie;
  }, [texte]);

  return <>{noeuds}</>;
}
