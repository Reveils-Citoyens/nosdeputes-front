import { THEMES, type ThemeSlug } from "./themes";

export type ThemeGroupSlug =
  | "economie-finances"
  | "sante-solidarites"
  | "travail-fonction-publique"
  | "justice-securite-institutions"
  | "international-defense"
  | "education-recherche"
  | "culture-societe-sport"
  | "ecologie-energie-transports"
  | "territoires-logement-agriculture";

export type ThemeGroupMeta = {
  label: string;
  description: string;
  themes: ThemeSlug[];
};

export const THEME_GROUPS = {
  "economie-finances": {
    label: "Économie & finances",
    description:
      "Politique économique, budget de l'État, fiscalité, entreprises et commerce.",
    themes: [
      "economie_et_finances",
      "budget",
      "fiscalite",
      "pme",
      "entreprises",
      "commerce_et_artisanat",
    ],
  },
  "sante-solidarites": {
    label: "Santé & solidarités",
    description:
      "Système de santé, protection sociale, famille et politique de l'enfance.",
    themes: ["questions_sociales_et_sante", "securite_sociale", "famille"],
  },
  "travail-fonction-publique": {
    label: "Travail & fonction publique",
    description:
      "Droit du travail, emploi, formation et statut des agents publics.",
    themes: ["travail", "fonction_publique"],
  },
  "justice-securite-institutions": {
    label: "Justice, sécurité & institutions",
    description:
      "Justice, forces de l'ordre, institutions républicaines et collectivités locales.",
    themes: [
      "justice",
      "police_et_securite",
      "pouvoirs_publics_et_constitution",
      "collectivites_territoriales",
    ],
  },
  "international-defense": {
    label: "International & défense",
    description:
      "Diplomatie, Union européenne, traités, défense et anciens combattants.",
    themes: [
      "affaires_etrangeres_et_cooperation",
      "traites_et_conventions",
      "union_europeenne",
      "defense",
      "anciens_combattants",
    ],
  },
  "education-recherche": {
    label: "Éducation & recherche",
    description:
      "Enseignement scolaire et supérieur, recherche scientifique, sciences et techniques.",
    themes: ["education", "recherche", "sciences_et_techniques"],
  },
  "culture-societe-sport": {
    label: "Culture, société & sport",
    description:
      "Création artistique, médias, libertés publiques, cohésion sociale et pratique sportive.",
    themes: ["culture", "societe", "sports"],
  },
  "ecologie-energie-transports": {
    label: "Écologie, énergie & transports",
    description:
      "Transition écologique, biodiversité, énergie et mobilités.",
    themes: ["environnement", "energie", "transports"],
  },
  "territoires-logement-agriculture": {
    label: "Territoires & agriculture",
    description:
      "Aménagement, ruralité, logement, urbanisme, agriculture et outre-mer.",
    themes: [
      "agriculture_et_peche",
      "logement_et_urbanisme",
      "amenagement_du_territoire",
      "outre_mer",
    ],
  },
} satisfies Record<string, ThemeGroupMeta>;

export type ThemeGroupSlugKey = keyof typeof THEME_GROUPS;

export function isThemeGroupSlug(s: string): s is ThemeGroupSlug {
  return s in THEME_GROUPS;
}

export const THEME_TO_GROUP: Record<ThemeSlug, ThemeGroupSlug> = (() => {
  const map: Partial<Record<ThemeSlug, ThemeGroupSlug>> = {};
  for (const [groupSlug, group] of Object.entries(THEME_GROUPS) as [
    ThemeGroupSlug,
    ThemeGroupMeta,
  ][]) {
    for (const themeSlug of group.themes) {
      map[themeSlug] = groupSlug;
    }
  }
  // Sanity check : tous les thèmes doivent être casés.
  const missing = (Object.keys(THEMES) as ThemeSlug[]).filter((t) => !(t in map));
  if (missing.length > 0) {
    throw new Error(
      `THEME_GROUPS ne couvre pas tous les thèmes — manquants : ${missing.join(", ")}`
    );
  }
  return map as Record<ThemeSlug, ThemeGroupSlug>;
})();
