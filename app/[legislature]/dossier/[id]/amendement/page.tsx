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

// Déduit l'étape d'un document dans la navette à partir de son UID et de son
// depotLibelle :
//   - chambre  : ...ANR5L... = Assemblée, ...SNR5S... = Sénat
//   - lecture  : "1er Dépôt" = 1re lecture, "Navette" = nouvelle lecture
//   - type     : segment alpha de l'UID (B / BTC / BTA / TAP)
function docMeta(uid: string, depotLibelle: string | null): {
  label: string;
  stageLabel: string;
  chamber: string;
  stageOrder: number;
  typeOrder: number;
} {
  const seg = uid.match(/^(?:PION|PRJL)ANR5L\d{2}([A-Z]+)\d{4}$/)?.[1] ?? "";
  const chamber = /SNR5S/.test(uid) ? "Sénat" : "Assemblée nationale";
  const navette = depotLibelle?.includes("Navette") ?? false;
  const reading = navette ? "Nouvelle lecture" : "1re lecture";

  // Libellés décrivant l'étape franchie dans le processus législatif :
  //   déposé → adopté en commission → adopté en séance
  let label: string;
  let typeOrder: number;
  if (seg === "BTC") {
    label = "Texte adopté en commission";
    typeOrder = 1;
  } else if (seg === "BTA" || seg === "TAP") {
    label = "Texte adopté en séance";
    typeOrder = 2;
  } else {
    // Segment "B" : texte initial (1re lecture) ou transmis (retour de navette)
    label = navette ? "Texte transmis (navette)" : "Texte initial déposé";
    typeOrder = 0;
  }

  const chamberOrder = chamber === "Sénat" ? 1 : 0;
  const readingOrder = navette ? 1 : 0;
  // Progression de la navette : lecture d'abord, puis chambre (AN avant Sénat).
  const stageOrder = readingOrder * 2 + chamberOrder;

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
    searchDocument({ dossierRefUid: dossierUid, classeCode: "PRJLOI", sort: "dateCreation.asc", perPage: 20 }),
    searchDocument({ dossierRefUid: dossierUid, classeCode: "PIONLOI", sort: "dateCreation.asc", perPage: 20 }),
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

  const documents: DocOption[] = documents_
    .map((d) => {
      const meta = docMeta(d.uid, d.depotLibelle as string | null);
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
