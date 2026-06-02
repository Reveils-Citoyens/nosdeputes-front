export type ThemeMeta = {
  label: string;
  description: string;
};

export const THEMES = {
  agriculture_et_peche: {
    label: "Agriculture et pêche",
    description: "Politiques agricoles, filières agroalimentaires, pêche maritime et aquaculture.",
  },
  amenagement_du_territoire: {
    label: "Aménagement du territoire",
    description: "Planification territoriale, développement des zones rurales et périurbaines, cohésion régionale.",
  },
  anciens_combattants: {
    label: "Anciens combattants",
    description: "Droits et mémoire des anciens combattants, pensions militaires d'invalidité, politique mémorielle.",
  },
  budget: {
    label: "Budget",
    description: "Loi de finances, programmation budgétaire, dépenses et recettes de l'État.",
  },
  collectivites_territoriales: {
    label: "Collectivités territoriales",
    description: "Organisation et financement des communes, départements et régions, intercommunalité, décentralisation.",
  },
  commerce_et_artisanat: {
    label: "Commerce et artisanat",
    description: "Régulation du commerce, soutien à l'artisanat, concurrence, distribution.",
  },
  culture: {
    label: "Culture",
    description: "Création artistique, patrimoine, audiovisuel, politiques culturelles et spectacle vivant.",
  },
  defense: {
    label: "Défense",
    description: "Forces armées, programmation militaire, renseignement, industrie de défense.",
  },
  economie_et_finances: {
    label: "Économie et finances",
    description: "Politique économique, régulation financière, marchés, investissement et croissance.",
  },
  education: {
    label: "Éducation",
    description: "Enseignement scolaire, formation initiale, programmes, enseignement supérieur et recherche universitaire.",
  },
  energie: {
    label: "Énergie",
    description: "Transition énergétique, électricité, nucléaire, énergies renouvelables, tarification.",
  },
  entreprises: {
    label: "Entreprises",
    description: "Création et financement d'entreprises, gouvernance, innovation, compétitivité industrielle.",
  },
  environnement: {
    label: "Environnement",
    description: "Protection de la nature, biodiversité, pollution, climat et développement durable.",
  },
  famille: {
    label: "Famille",
    description: "Politique familiale, protection de l'enfance, parentalité, adoption.",
  },
  fiscalite: {
    label: "Fiscalité",
    description: "Impôts, taxes, niches fiscales, fraude et optimisation fiscale.",
  },
  fonction_publique: {
    label: "Fonction publique",
    description: "Statut des agents de l'État, réforme de l'administration, conditions d'emploi dans le secteur public.",
  },
  justice: {
    label: "Justice",
    description: "Organisation judiciaire, droit pénal et civil, accès au droit, prisons, juridictions.",
  },
  logement_et_urbanisme: {
    label: "Logement et urbanisme",
    description: "Construction, accès au logement, politique locative, rénovation urbaine, droit des sols.",
  },
  outre_mer: {
    label: "Outre-mer",
    description: "Politiques spécifiques aux territoires d'outre-mer, développement économique et social des DOM-COM.",
  },
  pme: {
    label: "PME",
    description: "Soutien aux petites et moyennes entreprises, simplification administrative, accès au crédit.",
  },
  police_et_securite: {
    label: "Police et sécurité",
    description: "Forces de l'ordre, sécurité publique, délinquance, lutte contre le terrorisme.",
  },
  pouvoirs_publics_et_constitution: {
    label: "Pouvoirs publics et Constitution",
    description: "Institutions républicaines, réforme constitutionnelle, élections, séparation des pouvoirs.",
  },
  questions_sociales_et_sante: {
    label: "Questions sociales et santé",
    description: "Politique de santé, protection sociale, hôpital, dépendance, handicap, pauvreté.",
  },
  recherche: {
    label: "Recherche",
    description: "Recherche fondamentale et appliquée, financement de la science, innovation technologique.",
  },
  sciences_et_techniques: {
    label: "Sciences et techniques",
    description: "Développement scientifique, technologies de rupture, numérique, intelligence artificielle.",
  },
  securite_sociale: {
    label: "Sécurité sociale",
    description: "Assurance maladie, retraites, allocations familiales, financement de la protection sociale.",
  },
  societe: {
    label: "Société",
    description: "Valeurs, libertés publiques, discriminations, laïcité, cohésion sociale, médias.",
  },
  sports: {
    label: "Sports",
    description: "Pratique sportive, financement du sport, grandes compétitions, sport de haut niveau.",
  },
  traites_et_conventions: {
    label: "Traités et conventions",
    description: "Ratification de traités internationaux, accords bilatéraux et multilatéraux.",
  },
  transports: {
    label: "Transports",
    description: "Mobilités, infrastructures routières, ferroviaires et aériennes, logistique.",
  },
  travail: {
    label: "Travail",
    description: "Droit du travail, emploi, chômage, formation professionnelle, relations sociales.",
  },
  affaires_etrangeres_et_cooperation: {
    label: "Affaires étrangères et coopération",
    description: "Diplomatie, aide au développement, relations bilatérales, coopération internationale.",
  },
  union_europeenne: {
    label: "Union européenne",
    description: "Construction européenne, droit communautaire, institutions de l'UE, politiques européennes.",
  },
} satisfies Record<string, ThemeMeta>;

export type ThemeSlug = keyof typeof THEMES;

export function isThemeSlug(s: string): s is ThemeSlug {
  return s in THEMES;
}
