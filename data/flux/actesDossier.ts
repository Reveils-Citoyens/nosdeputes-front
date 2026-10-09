import { dateDuJour, formatJour, type ElementFlux } from "@/lib/rss";

/**
 * Transforme les actes législatifs d'un dossier (API Tricoteuses) en éléments
 * de flux. Fonctions pures : testées sans réseau ni base.
 *
 * Seules les étapes qui changent quelque chose pour le lecteur sont gardées :
 * dépôt, examen en commission et en séance, décisions, CMP, Conseil
 * constitutionnel, promulgation. Les actes conteneurs (« 1ère lecture »,
 * « Travaux des commissions »), les saisines et nominations ne le sont pas.
 */

export type ScrutinActe = {
  uid: string;
  numero?: string | null;
  titre?: string | null;
  code?: string | null;
  pour?: number | string | null;
  contre?: number | string | null;
  abstentions?: number | string | null;
  libelleTypeVote?: string | null;
};

export type ActeDossier = {
  uid: string;
  codeActe: string;
  dateActe?: string | Date | null;
  nomCanonique?: string | null;
  libelleCourtActe?: string | null;
  libelleStatutConclusion?: string | null;
  libelleCasSaisine?: string | null;
  urlConclusionConseilConstitutionnel?: string | null;
  numDecisionConseilConstitutionnel?: string | null;
  titreLoi?: string | null;
  dateJo?: string | Date | null;
  urlLegifrance?: string | null;
  organeRefUid?: string | null;
  voteRefs?: { voteRef: ScrutinActe | null }[] | null;
};

type Contexte = {
  /** Chemin de la page du dossier, ex. « /17/dossier/DLR5L17N54372 ». */
  base: string;
  /** Libellés des organes (commissions), par uid. */
  organes?: Map<string, string>;
};

const LECTURES: Record<string, string> = {
  AN1: "1re lecture",
  SN1: "1re lecture",
  AN2: "2e lecture",
  SN2: "2e lecture",
  AN3: "3e lecture",
  SN3: "3e lecture",
  ANNLEC: "nouvelle lecture",
  SNNLEC: "nouvelle lecture",
  ANLDEF: "lecture définitive",
  ANLUNI: "lecture unique",
  CMP: "texte de la commission mixte paritaire",
};

type Chambre = "AN" | "SN";
const NOMS: Record<Chambre, { a: string; par: string; nom: string }> = {
  AN: { a: "à l'Assemblée nationale", par: "par l'Assemblée nationale", nom: "Assemblée nationale" },
  SN: { a: "au Sénat", par: "par le Sénat", nom: "Sénat" },
};

/** Chambre d'un acte : préfixe de l'étape, ou suffixe -AN / -SN pour la CMP. */
function chambreDe(etape: string, suite: string): Chambre | null {
  if (etape === "CMP") {
    if (/(^|-)AN(-|$)/.test(suite)) return "AN";
    if (/(^|-)SN(-|$)/.test(suite)) return "SN";
    return null;
  }
  if (etape.startsWith("AN")) return "AN";
  if (etape.startsWith("SN")) return "SN";
  return null;
}

function nombre(v: number | string | null | undefined): number | null {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** « Scrutin public solennel n° 8430 : 378 pour, 7 contre, 173 abstentions. » */
export function resumeScrutin(s: ScrutinActe): string {
  const pour = nombre(s.pour);
  const contre = nombre(s.contre);
  const abstentions = nombre(s.abstentions);
  const type = majuscule(s.libelleTypeVote?.trim() || "scrutin public");
  const decompte =
    pour !== null && contre !== null
      ? ` : ${pour} pour, ${contre} contre${abstentions !== null ? `, ${abstentions} abstention${abstentions > 1 ? "s" : ""}` : ""}`
      : "";
  return `${type}${s.numero ? ` n° ${s.numero}` : ""}${decompte}.`;
}

function scrutinsDe(acte: ActeDossier): ScrutinActe[] {
  return (acte.voteRefs ?? []).flatMap((v) => (v?.voteRef ? [v.voteRef] : []));
}

type Rendu = {
  titre: string;
  description?: string;
  onglet?: string;
  /**
   * Décalage en minutes dans la journée. Les sources ne datent qu'au jour :
   * sans lui, une décision et le débat qui l'a précédée seraient à la même
   * heure et un lecteur pourrait les afficher dans le désordre.
   */
  ordre?: number;
};

function rendre(acte: ActeDossier, contexte: Contexte): Rendu | null {
  const [etape, ...reste] = acte.codeActe.split("-");
  const suite = reste.join("-");
  const chambre = chambreDe(etape, suite);
  const lecture = LECTURES[etape];
  const precision = lecture ? ` (${lecture})` : "";
  const organe = acte.organeRefUid ? contexte.organes?.get(acte.organeRefUid) : undefined;
  const statut = acte.libelleStatutConclusion?.trim() || null;
  const scrutins = scrutinsDe(acte);
  const votes = scrutins.map(resumeScrutin).join(" ");

  if (etape === "PROM" && suite === "PUB") {
    const jo = dateDuJour(acte.dateJo);
    return {
      titre: "Loi promulguée",
      description: [
        acte.titreLoi ? `Loi ${acte.titreLoi.trim()}.` : null,
        jo ? `Publiée au Journal officiel le ${formatJour(jo)}.` : null,
        acte.urlLegifrance ? `Texte sur Légifrance : ${acte.urlLegifrance}` : null,
      ]
        .filter(Boolean)
        .join(" "),
    };
  }

  if (etape === "CC") {
    if (suite === "CONCLUSION") {
      return {
        titre: `Décision du Conseil constitutionnel${statut ? ` : ${statut.toLowerCase()}` : ""}`,
        description: [
          acte.numDecisionConseilConstitutionnel ? `Décision n° ${acte.numDecisionConseilConstitutionnel}.` : null,
          acte.urlConclusionConseilConstitutionnel ?? null,
        ]
          .filter(Boolean)
          .join(" "),
      };
    }
    if (suite.startsWith("SAISIE")) {
      return {
        titre: "Saisine du Conseil constitutionnel",
        description: acte.libelleCasSaisine ? `Saisi par : ${acte.libelleCasSaisine.toLowerCase()}.` : undefined,
      };
    }
    return null;
  }

  if (etape === "CMP") {
    if (suite === "DEPOT") return { titre: "Convocation d'une commission mixte paritaire" };
    if (suite === "DEC") {
      return { titre: `Commission mixte paritaire${statut ? ` : ${statut.toLowerCase()}` : ""}`, ordre: 30 };
    }
    if (suite.startsWith("COM-RAPPORT")) return { titre: "Rapport de la commission mixte paritaire" };
  }

  if (suite === "DEPOT" && chambre) {
    const libelle = `${acte.nomCanonique ?? ""} ${acte.libelleCourtActe ?? ""}`.toLowerCase();
    const verbe = libelle.includes("navette") ? "transmis" : "déposé";
    return { titre: `Texte ${verbe} ${NOMS[chambre].a}${precision}` };
  }

  if (suite === "PROCACC") return { titre: "Procédure accélérée engagée par le Gouvernement" };
  if (suite === "RTRINI") return { titre: "Texte retiré par son auteur" };

  if (/^COM-(FOND|CAE)-REUNION$/.test(suite) && chambre) {
    return {
      titre: `Examen en commission ${NOMS[chambre].a}${precision}`,
      description: organe ? `${organe}.` : undefined,
      onglet: "commission",
    };
  }
  if (/^COM-(FOND|CAE)-RAPPORT$/.test(suite) && chambre) {
    return {
      titre: `Rapport de la commission ${NOMS[chambre].a}${precision}`,
      description: organe ? `${organe}.` : undefined,
    };
  }

  if (/^DEBATS(-AN|-SN)?$/.test(suite) && chambre) {
    return { titre: `Examen en séance publique ${NOMS[chambre].a}${precision}`, onglet: "debat" };
  }

  if (/^DEBATS(-AN|-SN)?-DEC$/.test(suite) && chambre) {
    // « adoptée, dans les conditions prévues à l'article 45… » : le titre ne
    // garde que la décision, la suite reste dans la description. Le libellé
    // source est conservé tel quel, accord en genre compris (« adoptée »).
    const court = statut?.split(",")[0].trim();
    return {
      titre: court ? `${majuscule(court)} ${NOMS[chambre].par}${precision}` : `Décision ${NOMS[chambre].a}${precision}`,
      description: [statut && statut !== court ? `${majuscule(statut)}.` : null, votes || null]
        .filter(Boolean)
        .join(" ") || undefined,
      onglet: scrutins.length > 0 ? "votes" : undefined,
      ordre: 60,
    };
  }

  // Commissions d'enquête, missions d'information, motions de censure.
  if (/(^|-)RAPPORT$/.test(suite) && /^AN2\d$/.test(etape)) return { titre: "Rapport publié" };
  if (suite === "COMENQ-CREA") return { titre: "Création de la commission d'enquête" };
  if (suite === "MISINF-CREA") return { titre: "Création de la mission d'information" };
  if (suite.endsWith("MOTION-VOTE")) {
    return {
      titre: `Vote sur la motion${statut ? ` : ${statut.toLowerCase()}` : ""}`,
      description: votes || undefined,
      onglet: scrutins.length > 0 ? "votes" : undefined,
    };
  }

  return null;
}

export function elementsDesActes(actes: ActeDossier[], contexte: Contexte): ElementFlux[] {
  const elements: ElementFlux[] = [];
  // Plusieurs actes identiques le même jour (deux saisines du Conseil, deux
  // réunions de commission, rapports CMP des deux chambres) : un seul élément.
  const dejaVus = new Set<string>();
  for (const acte of actes) {
    const date = dateDuJour(acte.dateActe);
    if (!date) continue;
    const rendu = rendre(acte, contexte);
    if (!rendu) continue;
    const cle = `${rendu.titre}|${date.toISOString()}`;
    if (dejaVus.has(cle)) continue;
    dejaVus.add(cle);
    elements.push({
      guid: acte.uid,
      titre: rendu.titre,
      description: rendu.description,
      lien: rendu.onglet ? `${contexte.base}/${rendu.onglet}` : contexte.base,
      date: new Date(date.getTime() + (rendu.ordre ?? 0) * 60_000),
    });
  }
  return elements;
}

/** Organes à résoudre pour nommer les commissions dans les descriptions. */
export function organesACharger(actes: ActeDossier[]): string[] {
  return Array.from(
    new Set(
      actes
        .filter((a) => /-COM-(FOND|CAE)-(REUNION|RAPPORT)$/.test(a.codeActe) && a.organeRefUid)
        .map((a) => a.organeRefUid as string),
    ),
  );
}

export type AmendementsDuJour = {
  /** « 2026-07-15 » */
  jour: string;
  total: number;
  gouvernement: number;
  /** Auteurs les plus actifs ce jour-là, du plus au moins prolifique. */
  auteurs: { nom: string; nombre: number }[];
};

export function elementsAmendements(
  jours: AmendementsDuJour[],
  contexte: { base: string; dossierUid: string },
): ElementFlux[] {
  return jours.flatMap((j) => {
    const date = dateDuJour(j.jour);
    if (!date || j.total === 0) return [];
    const pluriel = j.total > 1 ? "s" : "";
    const precisions = [
      j.auteurs.length > 0
        ? `Principaux auteurs : ${j.auteurs.map((a) => `${a.nom} (${a.nombre})`).join(", ")}.`
        : null,
      j.gouvernement > 0
        ? `${j.gouvernement} amendement${j.gouvernement > 1 ? "s" : ""} du Gouvernement.`
        : null,
    ].filter(Boolean);
    return [
      {
        // Stable d'une nuit à l'autre : un amendement publié en retard met à
        // jour l'élément du jour sans en créer un second.
        guid: `amendements-${contexte.dossierUid}-${j.jour}`,
        titre: `${j.total} amendement${pluriel} déposé${pluriel} le ${formatJour(date)}`,
        description: precisions.join(" ") || undefined,
        lien: `${contexte.base}/amendement`,
        date,
      },
    ];
  });
}
