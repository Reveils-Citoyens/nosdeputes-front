export type PartisKeys =
  | "LFI"
  | "GDR"
  | "SOC"
  | "ECO"
  | "LIOT"
  | "REN"
  | "MODEM"
  | "HOR"
  | "LR"
  | "RN"
  | "NI";

export type PartisInfo = {
  color: string;
  fullName: string;
  group?: string;
};

export const partis: Record<PartisKeys, PartisInfo> = {
  LFI: {
    color: "#CC2A46",
    fullName: "La France insoumise",
    group: "NUPES",
  },
  GDR: {
    color: "#A52727",
    fullName: "Gauche démocrate et Républicaine",
    group: "NUPES",
  },
  SOC: {
    color: "#FF9999",
    fullName: "Socialistes et apparentés",
    group: "NUPES",
  },
  ECO: {
    color: "#88CD34",
    fullName: "Ecologistes",
    group: "NUPES",
  },
  LIOT: {
    color: "#DDE727",
    fullName: "Libertés, indépendants, Outre-mer et Territoires",
  },
  REN: {
    color: "#7B5EAE",
    fullName: "Renaissance",
  },
  MODEM: {
    color: "#FDCC1B",
    fullName: "Démocrates",
  },
  HOR: {
    color: "#379DC8",
    fullName: "Horizons et apparentés",
  },
  LR: {
    color: "#4565AD",
    fullName: "Les Républicains",
  },
  RN: {
    color: "#173B4B",
    fullName: "Rassemblement National",
  },
  NI: {
    color: "#A5A5A5",
    fullName: "Députés Non Inscrit",
  },
};

export type ThemeKeys =
  | "Union européenne"
  | "fiscalité"
  | "Économie et finances"
  | "Énergie"
  | "Culture"
  | "Famille"
  | "Justice"
  | "Société"
  | "Éducation"
  | "Pouvoirs publics et Constitution"
  | "Police et sécurité"
  | "Agriculture et pêche"
  | "Environnement"
  | "Aménagement du territoire"
  | "Collectivités territoriales"
  | "Entreprises"
  | "Questions sociales et santé"
  | "PME"
  | "commerce et artisanat"
  | "Défense"
  | "Travail"
  | "Affaires étrangères et coopération"
  | "Logement et urbanisme"
  | "Traités et conventions"
  | "Budget"
  | "Transports"
  | "Outre-mer"
  | "Recherche"
  | "sciences et techniques"
  | "Sécurité sociale"
  | "Sports"
  | "Anciens combattants"
  | "Fonction publique";

export const THEMES = [
  "Union européenne",
  "fiscalité",
  "Économie et finances",
  "Énergie",
  "Culture",
  "Famille",
  "Justice",
  "Société",
  "Éducation",
  "Pouvoirs publics et Constitution",
  "Police et sécurité",
  "Agriculture et pêche",
  "Environnement",
  "Aménagement du territoire",
  "Collectivités territoriales",
  "Entreprises",
  "Questions sociales et santé",
  "PME",
  "commerce et artisanat",
  "Défense",
  "Travail",
  "Affaires étrangères et coopération",
  "Logement et urbanisme",
  "Traités et conventions",
  "Budget",
  "Transports",
  "Outre-mer",
  "Recherche",
  "sciences et techniques",
  "Sécurité sociale",
  "Sports",
  "Anciens combattants",
  "Fonction publique",
];

export const CODE_ACTS_AVEC_DEBAT = [
  "AN1-DEBATS-SEANCE",
  "AN2-DEBATS-SEANCE",
  "AN21-DEBATS-SEANCE",
  "AN3-DEBATS-SEANCE",
  "ANLDEF-DEBATS-SEANCE",
  "ANLUNI-DEBATS-SEANCE",
  "ANNLEC-DEBATS-SEANCE",
  "CMP-DEBATS-AN-SEANCE",
  "CMP-DEBATS-SN-SEANCE",
];

export const WORDS_PER_MINUTES = 200;

export const SUMMARY_CODES = new Set([
  "PRESENTATION_1_0",
  "DISC_GENERALE_1",
  "MOTION_RP_1_1",
  "DISC_ARTICLES_2_4",
  "QG_1_1"
]);

export const TYPES_DE_DOSSIERS: { code: string; label: string; description: string; tooltip: string; }[] = [
  {
    code: '1',
    label: "Projet de loi ordinaire",
    description: '',
    tooltip: `Un projet de loi ordinaire est un texte proposé par le gouvernement (le Premier ministre ou un ministre).
Il sert à modifier, créer ou supprimer des règles de droit dans un domaine de la vie quotidienne : travail, santé, environnement, justice, etc.
Après avoir été adopté en Conseil des ministres, il est transmis au Parlement (Assemblée nationale et Sénat) pour débat et vote.`,
  },
  {
    code: '2',
    label: "Proposition de loi ordinaire",
    description: '',
    tooltip: `Une proposition de loi ordinaire vient d’un ou plusieurs parlementaires (députés ou sénateurs), et non du gouvernement.
Elle permet aux élus d’initier eux-mêmes une loi sur un sujet qu’ils jugent important.
Le parcours est le même qu’un projet de loi : discussion, amendements, vote, etc.`
  },
  {
    code: '3',
    label: "Projet de loi de finances de l'année",
    description: '',
    tooltip: `Le projet de loi de finances de l’année fixe le budget de l’État pour l’année à venir.
Il détermine les recettes (impôts, taxes) et les dépenses (éducation, défense, santé, etc.).
C’est un texte présenté chaque automne par le gouvernement, et il doit être adopté avant le 31 décembre.`
  },
  {
    code: '4',
    label: "Projet de loi de financement de la sécurité sociale",
    description: '',
    tooltip: `Le projet de loi de financement de la sécurité sociale fixe chaque année les comptes de la Sécurité sociale :
combien elle dépense (remboursements de soins, retraites, allocations familiales) et comment elle se finance (cotisations, impôts).
Présenté par le gouvernement à l’automne, il est discuté en même temps que le budget de l’État, mais dans un texte séparé.`
  },
  {
    code: '5',
    label: "Projet ou proposition de loi organique",
    description: "Les lois organiques sont les lois en lien avec la constitution : elles précisent l'application de la constitution et en constitutent le prolongement",
    tooltip: `Une loi organique complète la Constitution : elle précise comment les institutions fonctionnent (Parlement, justice, élections, etc.).
Elle a une valeur supérieure à la loi ordinaire et doit être contrôlée par le Conseil constitutionnel avant d’entrer en vigueur.
Elle peut venir du gouvernement (projet) ou des parlementaires (proposition).`
  },
  {
    code: '6',
    label: "Projet de ratification des traités et conventions",
    description: "L’article 53 de la Constitution prévoit l’intervention du Parlement, sous certaines conditions, pour autoriser la ratification ou l’approbation des conventions internationales. C'est alors la commission des affaires étrangères qui est reconnue comme compétente au fond pour l'examen de ces accords.",
    tooltip: `Avant qu’un traité international (accord entre la France et un autre pays ou une organisation comme l’ONU ou l’UE) ne devienne contraignant, il doit être approuvé par le Parlement.
Le gouvernement dépose alors un projet de loi de ratification.
Les députés et sénateurs votent pour autoriser ou refuser la ratification du traité.`
  },
  {
    code: '7',
    label: "Projet ou proposition de loi constitutionnelle",
    description: "Différence fondamentale entre projet et proposition de loi constitutionnelle : les propositions de loi constitutionnelle doivent passer la procédure parlementaire PUIS être votées par référundum. Les projets de lois eux peut soumettre le texte au parlement qui doit le voter identique à l'AN et au Sénat et adopté à la majorité des 3/5.",
    tooltip: `Une loi constitutionnelle vise à modifier la Constitution, c’est-à-dire les règles fondamentales de la République.
Elle peut venir du Président de la République / gouvernement (projet) ou des parlementaires (proposition).
Pour être adoptée, elle doit être votée dans les mêmes termes par l’Assemblée et le Sénat, puis approuvée soit par référendum, soit par une réunion du Congrès à Versailles à la majorité des 3/5.`
  },
  {
    code: '8',
    label: "Résolution",
    description: "La résolution est un acte par lequel l'Assemblée émet un avis sur une question déterminée. Déposée au nom d'un groupe par son président ou par tout député, la proposition de résolution fait l'objet d'un double contrôle. (Elle n'a pas encore valeur de loi)",
    tooltip: `Une résolution est un texte non contraignant voté par l’Assemblée nationale ou le Sénat.
Elle sert à exprimer une position politique, poser une question au gouvernement ou proposer une orientation sans modifier la loi.
C'est une prise de position officielle, pas une loi.`
  },
  {
    code: '9',
    label: "Commission d'enquête",
    description: "Composées de trente députés désignés à la proportionnelle des groupes, ces commissions sont constituées pour enquêter sur des faits ne donnant pas lieu à des poursuites judiciaires ou pour examiner la gestion de services ou d’entreprises publics. Les groupes d’opposition ou minoritaires disposent d’un « droit de tirage » leur permettant d’obtenir chacun la création d’une commission d’enquête par an.",
    tooltip: `Une commission d’enquête est un groupe temporaire de députés ou sénateurs chargé de faire la lumière sur un sujet précis : scandale sanitaire, abus de pouvoir, dépenses publiques, etc.
Elle dispose de pouvoirs d’investigation renforcés : elle peut auditionner des ministres, demander des documents, se déplacer sur le terrain.
Elle dure au maximum 6 mois.`
  },
  {
    code: '10',
    label: "Mission d'information",
    description: "Les missions d’information sont constituées en vue d’informer l’Assemblée nationale pour lui permettre d’exercer son contrôle sur la politique du gouvernement. Elles peuvent être créées soit par une ou plusieurs commissions, soit par la Conférence des présidents. Elles établissent un rapport qui peut donner lieu, en séance publique, à un débat sans vote ou à une séance de questions.",
    tooltip: `Une mission d’information est un groupe de parlementaires qui étudie un sujet d’intérêt public pour mieux le comprendre et proposer des pistes d’action.
Contrairement à une commission d’enquête, elle n’a pas de pouvoirs contraignants (pas de convocation obligatoire), mais elle peut auditionner, se déplacer et publier un rapport détaillé.`
  },
  // { code: '11', label: "?	" },
  {
    code: '12',
    label: "Message du président de la république",
    description: "",
    tooltip: `Le message du Président de la République est un texte adressé au Parlement pour exprimer sa vision, annoncer une orientation politique ou commenter une situation importante.
Depuis 2008, le Président peut le lire directement devant les députés et sénateurs réunis en Congrès à Versailles, sans que cela ouvre de débat.`
  },
  {
    code: '13',
    label: "Engagement de la responsabilité gouvernementale",
    description: "Aka Motion de censure déposée en application de l'article 49 alinéa 2 de la constitution",
    tooltip: `Le gouvernement peut engager sa responsabilité sur un texte, souvent via l’article 49.3 de la Constitution.
Cela signifie qu’il fait adopter un projet de loi sans vote, sauf si une motion de censure est déposée et adoptée.
C’est un outil de force politique : soit la loi passe, soit le gouvernement tombe.`
  },
  {
    code: '14',
    label: "Responsabilité pénale du président de la république",
    description: "",
    tooltip: `Le Président de la République bénéficie d’une protection spéciale pendant son mandat :
il ne peut être jugé pour des actes accomplis dans ses fonctions qu’après la fin de son mandat.
En revanche, il peut être destitué s’il a commis un acte manifestement incompatible avec ses fonctions (procédure devant la Haute Cour).`
  },
  {
    code: '15',
    label: "Immunité",
    description: "Pour proposer la suspension de poursuites contre un parlementaire ex. Henri Guaino",
    tooltip: `L’immunité protège certains responsables politiques (députés, sénateurs, Président) pour garantir l’indépendance de leurs fonctions. Immunité parlementaire : un député ou un sénateur ne peut être poursuivi pour les opinions ou votes exprimés dans l’exercice de son mandat. En dehors de ce cadre, ils bénéficient de garanties spécifiques avant toute poursuite.`
  },
  {
    code: '16',
    label: "Pétitions",
    description: "Pétition pour l'allongement de la durée du congé maternel",
    tooltip: `Une pétition est un texte signé par des citoyens pour attirer l’attention du Parlement sur un sujet précis (loi, injustice, proposition).
Elle peut être déposée en ligne ou par écrit et transmise à une commission des pétitions.
Si elle réunit suffisamment de signatures, elle peut être examinée ou donner lieu à un débat à l’Assemblée nationale.`
  },
  {
    code: '17',
    label: "Motion référendaire",
    description: "Proposition au président de la République française de soumettre le texte discuté au référendum.",
    tooltip: `Une motion référendaire est une proposition faite par des députés pour que un projet ou une proposition de loi soit soumis à référendum, c’est-à-dire directement au vote des citoyens.
Elle doit être signée par au moins un dixième des membres de l’Assemblée nationale (58 députés).`
  },
  // { code: '18', label: "?	" },
  {
    code: '19',
    label: "Rapport d'information sans mission",
    description: "Moins de voilure que dans le cas de la mission d'information.",
    tooltip: `Un rapport d’information sans mission est un document rédigé par un député ou une commission pour informer le Parlement sur un sujet précis, sans qu’une mission officielle ait été créée.
Il peut présenter des analyses, constats ou recommandations.`
  },
  {
    code: '20',
    label: "Allocution du Président de l'Assemblée nationale",
    description: "",
    tooltip: `L’allocution du Président de l’Assemblée nationale est un discours solennel prononcé à l’ouverture ou à la clôture d’une session parlementaire, ou lors d’un événement exceptionnel.
Elle ne donne pas lieu à débat : elle exprime la position institutionnelle de l’Assemblée ou rend hommage à une personnalité ou un événement.`
  },
  {
    code: '21',
    label: "Projet de loi de finances rectificative",
    description: "",
    tooltip: `Le projet de loi de finances rectificative ajuste le budget de l’État en cours d’année.
Il sert à corriger les prévisions si les dépenses ou recettes changent (crise, inflation, guerre, etc.).
Présenté par le gouvernement, il suit la même procédure qu’un budget ordinaire.`
  },
  {
    code: '22',
    label: "Résolution Article 34-1",
    description: "",
    tooltip: `Depuis 2008, l’article 34-1 de la Constitution permet à chaque assemblée (Assemblée nationale ou Sénat) d’adopter des résolutions pour exprimer une position politique, sans effet de loi.
Ces résolutions ne peuvent ni donner d’injonction au gouvernement, ni modifier le droit.`
  },
  {
    code: '23',
    label: "Proposition de loi présentée en application de l'article 11 de la Constitution",
    description: "",
    tooltip: `L’article 11 de la Constitution permet qu’une loi soit proposée par les citoyens et les parlementaires, via un référendum d’initiative partagée (RIP).
Pour cela, il faut la signature d’au moins 1/5 des parlementaires puis le soutien d’au moins 10 % des électeurs inscrits (environ 4,8 millions de personnes).`
  }]