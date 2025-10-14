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

export const SUMMARY_CODES = [
  "PRESENTATION_1_0",
  "DISC_GENERALE_1",
  "MOTION_RP_1_1",
  "DISC_ARTICLES_2_4",
];



export const TYPES_DE_DOSSIERS: { code: string; label: string; description: string }[] = [
  { code: '1', label: "Projet de loi ordinaire", description: '' },
  { code: '2', label: "Proposition de loi ordinaire", description: '' },
  { code: '3', label: "Projet de loi de finances de l'année", description: '' },
  { code: '4', label: "Projet de loi de financement de la sécurité sociale", description: '' },
  { code: '5', label: "Projet ou proposition de loi organique", description: "Les lois organiques sont les lois en lien avec la constitution : elles précisent l'application de la constitution et en constitutent le prolongement" },
  { code: '6', label: "Projet de ratification des traités et conventions", description: "L’article 53 de la Constitution prévoit l’intervention du Parlement, sous certaines conditions, pour autoriser la ratification ou l’approbation des conventions internationales. C'est alors la commission des affaires étrangères qui est reconnue comme compétente au fond pour l'examen de ces accords." },
  { code: '7', label: "Projet ou proposition de loi constitutionnelle", description: "Différence fondamentale entre projet et proposition de loi constitutionnelle : les propositions de loi constitutionnelle doivent passer la procédure parlementaire PUIS être votées par référundum. Les projets de lois eux peut soumettre le texte au parlement qui doit le voter identique à l'AN et au Sénat et adopté à la majorité des 3/5." },
  { code: '8', label: "Résolution", description: "La résolution est un acte par lequel l'Assemblée émet un avis sur une question déterminée. Déposée au nom d'un groupe par son président ou par tout député, la proposition de résolution fait l'objet d'un double contrôle. (Elle n'a pas encore valeur de loi)" },
  { code: '9', label: "Commission d'enquête", description: "Composées de trente députés désignés à la proportionnelle des groupes, ces commissions sont constituées pour enquêter sur des faits ne donnant pas lieu à des poursuites judiciaires ou pour examiner la gestion de services ou d’entreprises publics. Les groupes d’opposition ou minoritaires disposent d’un « droit de tirage » leur permettant d’obtenir chacun la création d’une commission d’enquête par an." },
  { code: '10', label: "Mission d'information", description: "Les missions d’information sont constituées en vue d’informer l’Assemblée nationale pour lui permettre d’exercer son contrôle sur la politique du gouvernement. Elles peuvent être créées soit par une ou plusieurs commissions, soit par la Conférence des présidents. Elles établissent un rapport qui peut donner lieu, en séance publique, à un débat sans vote ou à une séance de questions." },
  // { code: '11', label: "?	" },
  { code: '12', label: "Message du président de la république", description: "" },
  { code: '13', label: "Engagement de la responsabilité gouvernementale", description: "Aka Motion de censure déposée en application de l'article 49 alinéa 2 de la constitution" },
  { code: '14', label: "Responsabilité pénale du président de la république", description: "" },
  { code: '15', label: "Immunité", description: "Pour proposer la suspension de poursuites contre un parlementaire ex. Henri Guaino" },
  { code: '16', label: "Pétitions", description: "Pétition pour l'allongement de la durée du congé maternel" },
  { code: '17', label: "Motion référendaire", description: "Proposition au président de la République française de soumettre le texte discuté au référendum." },
  // { code: '18', label: "?	" },
  { code: '19', label: "Rapport d'information sans mission", description: "Moins de voilure que dans le cas de la mission d'information." },
  { code: '20', label: "Allocution du Président de l'Assemblée nationale", description: "" },
  { code: '21', label: "Projet de loi de finances rectificative", description: "" },
  { code: '22', label: "Résolution Article 34-1", description: "" },
  { code: '23', label: "Proposition de loi présentée en application de l'article 11 de la Constitution", description: "" },]