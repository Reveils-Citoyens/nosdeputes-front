import Box from "@mui/material/Box";
import { searchDocument } from "@/data/searchDocument";
import { buildSommaireUrl, getDocumentSommaire } from "@/data/getDocumentSommaire";
import LiseuseClient from "./LiseuseClient";
import type { ArticleEntry } from "@/data/getDocumentSommaire";

export type DocOption = {
  uid: string;
  /** Type de texte : "Texte déposé" / "Texte de la commission" / "Texte adopté" */
  label: string;
  /** Étape dans la navette : "Assemblée nationale · 1re lecture" */
  stageLabel: string;
  /** Chambre : "Assemblée nationale" | "Sénat" */
  chamber: string;
  /** Ordre de l'étape dans la navette (progression chronologique) */
  stageOrder: number;
  /** Ordre du type de texte au sein d'une étape (déposé → commission → adopté) */
  typeOrder: number;
};

// Déduit l'étape d'un document dans la navette à partir de son UID et d'un
// index de lecture de navette AN (0 = 1re lecture, 1 = 1ère navette = "Nouvelle lecture",
// 2 = 2e navette = "3e lecture", …). Cet index est calculé par l'appelant.
//   - chambre  : ...ANR5L... = Assemblée, ...SNR5S... = Sénat
//   - type     : segment alpha de l'UID (B / BTC / BTA / TAP)
function docMeta(uid: string, depotLibelle: string | null, navetteLectureIdx = 0): {
  label: string;
  stageLabel: string;
  chamber: string;
  stageOrder: number;
  typeOrder: number;
} {
  const seg = uid.match(/^(?:PION|PRJL)ANR5L\d{2}([A-Z]+)\d{4}$/)?.[1] ?? "";
  const chamber = /SNR5S/.test(uid) ? "Sénat" : "Assemblée nationale";
  const navette = navetteLectureIdx > 0;

  // Libellé de lecture : "1re lecture", "Nouvelle lecture" (2e au total),
  // "3e lecture", "4e lecture"… pour les navettes successives.
  let reading: string;
  if (!navette) {
    reading = "1re lecture";
  } else {
    const overall = navetteLectureIdx + 1; // numéro global de la lecture (2, 3, …)
    reading = overall === 2 ? "Nouvelle lecture" : `${overall}e lecture`;
  }

  let label: string;
  let typeOrder: number;
  if (seg === "BTC") {
    label = "Texte adopté en commission";
    typeOrder = 1;
  } else if (seg === "BTA" || seg === "TAP") {
    label = "Texte adopté en séance";
    typeOrder = 2;
  } else {
    label = navette ? "Texte transmis (navette)" : "Texte initial déposé";
    typeOrder = 0;
  }

  const chamberOrder = chamber === "Sénat" ? 1 : 0;
  // stageOrder croissant avec le numéro de lecture (0, 2, 4, …) ; chamberOrder
  // réserve les impairs pour le Sénat si on devait l'afficher un jour.
  const stageOrder = navetteLectureIdx * 2 + chamberOrder;

  return { label, stageLabel: `${chamber} · ${reading}`, chamber, stageOrder, typeOrder };
}

// Vérifie si le sommaire est disponible dans Documents_enrichis (HEAD request)
async function hasSommaire(uid: string): Promise<boolean> {
  const url = buildSommaireUrl(uid);
  if (!url) return false;
  try {
    const res = await fetch(url, { method: "HEAD", next: { revalidate: 3600 } });
    return res.ok;
  } catch {
    return false;
  }
}

// Vérifie si le document a des amendements via l'API Tricoteuses
async function hasAmendements(uid: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_TRICOTEUSES_API_URL}/amendements?documentRefUid=${uid}&chambre=AN&perPage=1`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return false;
    const data = await res.json() as { data?: unknown[] };
    return (data.data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ legislature: string; id: string }>;
}) {
  const { id: dossierUid } = await params;

  const [prjlRes, pionRes] = await Promise.all([
    searchDocument({ dossierRefUid: dossierUid, classeCode: "PRJLOI", sort: "dateCreation.asc", perPage: 100 }),
    searchDocument({ dossierRefUid: dossierUid, classeCode: "PIONLOI", sort: "dateCreation.asc", perPage: 100 }),
  ]);

  // Déduplique et trie par date
  const seenUids = new Set<string>();
  const allDocs = [
    ...(prjlRes?.data ?? []),
    ...(pionRes?.data ?? []),
  ]
    .filter((d) => {
      if (seenUids.has(d.uid)) return false;
      seenUids.add(d.uid);
      return true;
    })
    .sort((a, b) => {
      const ta = a.dateCreation ? new Date(a.dateCreation as unknown as string).getTime() : 0;
      const tb = b.dateCreation ? new Date(b.dateCreation as unknown as string).getTime() : 0;
      return ta - tb;
    });

  // Ne garde que les vrais textes de loi (PION/PRJL) — surtout pas les rapports
  // (RAPP), avis, etc. qui matchent aussi [A-Z]{4} et polluaient le sélecteur
  // (un rapport de commission contient le texte adopté mais n'est pas une
  // « version » navigable). Et qui ont du texte parsé OU des amendements.
  const candidateDocs = allDocs.filter((d) =>
    /^(?:PION|PRJL)ANR5L\d{2}[A-Z]+\d{4}$/.test(d.uid),
  );

  const checks = await Promise.all(
    candidateDocs.map(async (d) => {
      const [som, amd] = await Promise.all([hasSommaire(d.uid), hasAmendements(d.uid)]);
      return { uid: d.uid, som, amd };
    }),
  );
  const checkByUid = new Map(checks.map((c) => [c.uid, c]));

  // Si le filtre ne garde rien (aucun doc utile), on revient aux candidats bruts
  const filteredDocs = candidateDocs.filter((d) => {
    const c = checkByUid.get(d.uid);
    return c ? c.som || c.amd : false;
  });
  const documents_: typeof candidateDocs = filteredDocs.length > 0 ? filteredDocs : candidateDocs;

  // Détecte les débuts de lecture de navette AN : chaque doc "B" avec navette=true
  // marque une nouvelle lecture (B2401 → 2e lecture, B2773 → 3e lecture, …).
  // Les docs sont déjà triés par dateCreation depuis la déduplication amont.
  const anNavetteBs = candidateDocs.filter(
    (d) =>
      /^(?:PION|PRJL)ANR5L\d{2}B\d{4}$/.test(d.uid) &&
      (d.depotLibelle as string | null)?.includes("Navette"),
  );

  // Renvoie l'index de navette (1-based) pour un doc AN de navette : 1 pour la
  // première navette (Nouvelle lecture), 2 pour la deuxième (3e lecture), etc.
  // Retourne 0 pour les docs de 1re lecture ou hors AN.
  function getNavetteIdx(d: (typeof candidateDocs)[0]): number {
    if (!/ANR5L/.test(d.uid)) return 0;
    if (!((d.depotLibelle as string | null)?.includes("Navette"))) return 0;
    const docMs = d.dateCreation ? new Date(d.dateCreation as unknown as string).getTime() : 0;
    let idx = 0;
    for (let i = 0; i < anNavetteBs.length; i++) {
      const bMs = anNavetteBs[i].dateCreation
        ? new Date(anNavetteBs[i].dateCreation as unknown as string).getTime()
        : 0;
      if (bMs <= docMs) idx = i + 1;
      else break;
    }
    return Math.max(1, idx);
  }

  const documents: DocOption[] = documents_
    .map((d) => {
      const meta = docMeta(d.uid, d.depotLibelle as string | null, getNavetteIdx(d));
      return { uid: d.uid, ...meta };
    })
    // Ordonne selon la progression de la navette (lecture → chambre → type)
    .sort((a, b) => a.stageOrder - b.stageOrder || a.typeOrder - b.typeOrder);

  // Version ouverte par défaut : on privilégie celle qui a le plus de contenu
  // utile (texte parsé ET amendements), puis au moins des amendements, sinon
  // la première dans l'ordre de la navette. Évite d'ouvrir sur une version vide.
  const defaultDocUid =
    documents.find((d) => {
      const c = checkByUid.get(d.uid);
      return c?.som && c?.amd;
    })?.uid ??
    documents.find((d) => checkByUid.get(d.uid)?.amd)?.uid ??
    documents[0]?.uid ??
    null;
  const initialSommaire: ArticleEntry[] | null = defaultDocUid
    ? await getDocumentSommaire(defaultDocUid)
    : null;

  return (
    <Box sx={{ pt: 3, pb: 8, px: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      <LiseuseClient
        dossierUid={dossierUid}
        documents={documents}
        defaultDocUid={defaultDocUid}
        initialSommaire={initialSommaire}
      />
    </Box>
  );
}
