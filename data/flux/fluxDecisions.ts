import { getParlementDb } from "@/lib/mongodb";
import { THEMES, type ThemeSlug } from "@/data/themes";
import { dateDuJour, formatJour, MAX_ELEMENTS, type ElementFlux, type Flux } from "@/lib/rss";
import { resumeScrutin, type ScrutinActe } from "./actesDossier";

/**
 * Votes de l'Assemblée sur les dossiers (flux général et flux par thème) et
 * nouveaux textes d'un thème.
 *
 * Le vote retenu est `derniereDecision`, calculé à l'import (ND.py) : le
 * scrutin le plus récent rattaché aux actes du dossier. Ce peut être une
 * motion (rejet préalable…) et non le vote sur l'ensemble : le titre reprend
 * donc l'objet exact du scrutin, sans le présenter comme l'adoption du texte.
 */

export type Decision = {
  dossierUid: string;
  legislature: number;
  dossierTitre: string;
  scrutin: ScrutinActe & { objet: string | null; sort: string | null; date: string };
};

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function elementsDecisions(decisions: Decision[]): ElementFlux[] {
  return decisions.flatMap(({ dossierUid, legislature, dossierTitre, scrutin }) => {
    const date = dateDuJour(scrutin.date);
    if (!date) return [];
    const objet = scrutin.objet?.trim().replace(/\.$/, "");
    const sort = scrutin.sort ? majuscule(scrutin.sort) : "Vote";
    return [
      {
        guid: `vote-${scrutin.uid}`,
        titre: objet ? `${sort} : ${objet}` : `${sort} : « ${dossierTitre} »`,
        description: `${resumeScrutin(scrutin)} Dossier : « ${dossierTitre} ».`,
        lien: `/${legislature}/dossier/${dossierUid}/votes`,
        date,
      },
    ];
  });
}

export type NouveauTexte = {
  uid: string;
  legislature: number;
  titre: string;
  typeInitiative: string | null;
  dateDepot: Date;
};

export function elementsNouveauxTextes(textes: NouveauTexte[]): ElementFlux[] {
  return textes.flatMap((t) => {
    const date = dateDuJour(t.dateDepot);
    if (!date) return [];
    return [
      {
        guid: `depot-${t.uid}`,
        titre: `Nouveau texte : ${t.titre}`,
        // « Proposition de loi » / « Résolution » : tournure sans accord en genre.
        description: `${t.typeInitiative ?? "Texte"} — dépôt le ${formatJour(date)}.`,
        lien: `/${t.legislature}/dossier/${t.uid}`,
        date,
      },
    ];
  });
}

type DossierAvecDecision = {
  uid: string;
  legislature: string | number;
  titreDossier?: { titre?: string };
  derniereDecision: { date: string; sort: string; uid: string };
};

async function lireDecisions(filtre: Record<string, unknown>, limite: number): Promise<Decision[]> {
  const db = await getParlementDb();
  const dossiers = await db
    .collection<DossierAvecDecision>("dossiers")
    .find(
      { ...filtre, "derniereDecision.uid": { $type: "string" } },
      { projection: { _id: 0, uid: 1, legislature: 1, "titreDossier.titre": 1, derniereDecision: 1 } },
    )
    .sort({ "derniereDecision.date": -1 })
    .limit(limite)
    .toArray();

  const scrutins = await db
    .collection("scrutins")
    .find(
      { uid: { $in: dossiers.map((d) => d.derniereDecision.uid) } },
      {
        projection: {
          _id: 0,
          uid: 1,
          numero: 1,
          dateScrutin: 1,
          "objet.libelle": 1,
          "sort.code": 1,
          "syntheseVote.decompte": 1,
          "typeVote.libelleTypeVote": 1,
        },
      },
    )
    .toArray();
  const parUid = new Map(scrutins.map((s) => [s.uid as string, s]));

  return dossiers.map((d) => {
    const s = parUid.get(d.derniereDecision.uid);
    return {
      dossierUid: d.uid,
      legislature: Number(d.legislature),
      dossierTitre: d.titreDossier?.titre?.trim() || "Dossier législatif",
      scrutin: {
        uid: d.derniereDecision.uid,
        numero: s?.numero ?? null,
        objet: s?.objet?.libelle ?? null,
        sort: s?.sort?.code ?? d.derniereDecision.sort,
        date: s?.dateScrutin ?? d.derniereDecision.date,
        pour: s?.syntheseVote?.decompte?.pour ?? null,
        contre: s?.syntheseVote?.decompte?.contre ?? null,
        abstentions: s?.syntheseVote?.decompte?.abstentions ?? null,
        libelleTypeVote: s?.typeVote?.libelleTypeVote ?? null,
      },
    };
  });
}

const LEGISLATURE = "17";

export async function getFluxVotes(): Promise<Flux> {
  const decisions = await lireDecisions({ legislature: LEGISLATURE }, MAX_ELEMENTS);
  return {
    titre: "Votes sur les textes à l'Assemblée nationale — NosDéputés.fr",
    lien: "/dossiers",
    chemin: "/rss.xml",
    description:
      "Les derniers scrutins publics de l'Assemblée nationale sur les dossiers législatifs : objet du vote, résultat et décompte.",
    elements: elementsDecisions(decisions),
  };
}

const THEME_NOUVEAUX_TEXTES = 30;
const THEME_DECISIONS = 20;

export async function getFluxTheme(slug: ThemeSlug): Promise<Flux> {
  const db = await getParlementDb();
  const filtreTheme = { "dossier_summary_enrichment.qualification.themes_senat": slug };

  const [recents, tousUids] = await Promise.all([
    db
      .collection("dossiers_enrichis")
      .find(
        { ...filtreTheme, date_depot: { $type: "date" } },
        { projection: { _id: 0, uid: 1, legislature: 1, titre: 1, type_initiative: 1, date_depot: 1 } },
      )
      .sort({ date_depot: -1 })
      .limit(THEME_NOUVEAUX_TEXTES)
      .toArray(),
    db.collection("dossiers_enrichis").distinct("uid", filtreTheme),
  ]);
  const decisions = await lireDecisions({ uid: { $in: tousUids } }, THEME_DECISIONS);

  const theme = THEMES[slug];
  return {
    titre: `${theme.label} — NosDéputés.fr`,
    lien: `/themes/${slug}`,
    chemin: `/themes/${slug}/rss.xml`,
    description: `Nouveaux textes et votes à l'Assemblée nationale sur le thème « ${theme.label} ».`,
    elements: [
      ...elementsNouveauxTextes(
        recents.map((r) => ({
          uid: r.uid,
          legislature: Number(r.legislature),
          titre: String(r.titre ?? "").trim() || "Texte sans titre",
          typeInitiative: r.type_initiative ?? null,
          dateDepot: r.date_depot,
        })),
      ),
      ...elementsDecisions(decisions),
    ],
  };
}
