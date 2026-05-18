export type ChambreImpliquee =
  | "AN"
  | "SENAT"
  | "AN_ET_SENAT"
  | "MIXTE"
  | "EXECUTIF"
  | "EXECUTIF_OU_PARLEMENTAIRES";

export type EtapeLegislative = {
  id: string;
  numero: number;
  titre: string;
  resume: string;
  description: string;
  chambre: ChambreImpliquee;
  acteurs: string[];
  dureeIndicative?: string;
};

export const ETAPES_LEGISLATIVES: EtapeLegislative[] = [
  {
    id: "depot",
    numero: 1,
    titre: "Dépôt du texte",
    resume:
      "Tout part d'un texte : un projet de loi (déposé par le Gouvernement) ou une proposition de loi (déposée par un parlementaire).",
    description:
      "Le texte est officiellement enregistré à la présidence de l'Assemblée nationale ou du Sénat. Un projet de loi est déposé au choix du Gouvernement dans l'une ou l'autre chambre (les textes financiers et de financement de la sécurité sociale, eux, doivent commencer à l'Assemblée). Une proposition de loi est déposée par son auteur dans sa chambre d'origine : elle peut donc venir indifféremment d'un député ou d'un sénateur. C'est la chambre saisie en premier qui démarre l'examen.",
    chambre: "EXECUTIF_OU_PARLEMENTAIRES",
    acteurs: ["Gouvernement", "Députés", "Sénateurs"],
  },
  {
    id: "commission-1",
    numero: 2,
    titre: "Examen en commission — 1re chambre",
    resume:
      "Dans la chambre saisie en premier, une commission permanente examine le texte en profondeur, désigne un rapporteur et l'amende avant la séance publique.",
    description:
      "L'Assemblée nationale compte 8 commissions permanentes (Lois, Finances, Affaires sociales, etc.), le Sénat en compte 7. La commission saisie au fond désigne un rapporteur chargé d'analyser le texte, d'auditionner les parties prenantes et de proposer des amendements. C'est le texte adopté par la commission — et non le texte initial — qui sera discuté en séance publique.",
    chambre: "AN_ET_SENAT",
    acteurs: ["Rapporteur", "Membres de la commission"],
    dureeIndicative: "Quelques semaines",
  },
  {
    id: "premiere-lecture-1",
    numero: 3,
    titre: "1re lecture — 1re chambre",
    resume:
      "La chambre saisie en premier (Assemblée ou Sénat, selon l'origine du texte) discute en séance publique : discussion générale, examen article par article, amendements, puis vote.",
    description:
      "La discussion s'ouvre par une présentation du texte par le Gouvernement et le rapporteur. Les parlementaires examinent ensuite chaque article et débattent des amendements déposés. Le vote final sur l'ensemble du texte est souvent un scrutin public solennel. Le plus souvent, c'est l'Assemblée nationale qui est saisie en premier (projets de loi gouvernementaux, propositions de députés) ; mais une proposition de loi déposée par un sénateur commence son parcours au Sénat.",
    chambre: "AN_ET_SENAT",
    acteurs: ["Députés ou sénateurs", "Gouvernement", "Rapporteur"],
    dureeIndicative: "1 à plusieurs jours",
  },
  {
    id: "commission-2",
    numero: 4,
    titre: "Examen en commission — 2nde chambre",
    resume:
      "Une fois le texte transmis à l'autre chambre, une commission permanente du même domaine reprend le travail d'examen, d'audition et d'amendement.",
    description:
      "La 2nde chambre suit le même processus que la première : désignation d'un rapporteur, auditions, examen article par article, dépôt d'amendements et vote du texte en commission. C'est cette nouvelle version qui sera discutée en séance publique de la 2nde chambre.",
    chambre: "AN_ET_SENAT",
    acteurs: ["Rapporteur", "Membres de la commission"],
    dureeIndicative: "Quelques semaines",
  },
  {
    id: "premiere-lecture-2",
    numero: 5,
    titre: "1re lecture — 2nde chambre",
    resume:
      "La 2nde chambre discute à son tour le texte en séance publique : même procédure de discussion générale, examen des articles, amendements et vote.",
    description:
      "La 2nde chambre peut adopter le texte sans modification (il devient alors définitif), le modifier, ou le rejeter. Si elle l'amende, le texte repart à la chambre d'origine pour une 2e lecture : c'est ce qu'on appelle la navette parlementaire.",
    chambre: "AN_ET_SENAT",
    acteurs: ["Députés ou sénateurs", "Gouvernement", "Rapporteur"],
  },
  {
    id: "navette",
    numero: 6,
    titre: "Navette parlementaire",
    resume:
      "Tant que les deux chambres ne sont pas d'accord sur un texte identique, il fait des allers-retours entre l'Assemblée et le Sénat.",
    description:
      "À chaque lecture, seuls les articles encore en discussion (non votés conformes) sont rediscutés. La navette peut durer plusieurs mois. En cas de procédure accélérée, le Gouvernement peut convoquer une commission mixte paritaire après une seule lecture par chambre.",
    chambre: "AN_ET_SENAT",
    acteurs: ["Députés", "Sénateurs"],
    dureeIndicative: "Plusieurs mois",
  },
  {
    id: "cmp",
    numero: 7,
    titre: "Commission mixte paritaire (CMP)",
    resume:
      "En cas de désaccord persistant, 7 députés et 7 sénateurs se réunissent pour tenter de trouver un compromis.",
    description:
      "Si la CMP aboutit à un texte commun, celui-ci est soumis au vote des deux chambres. Si elle échoue (ou si le texte CMP est rejeté), le Gouvernement peut donner le « dernier mot » à l'Assemblée nationale, qui statue seule.",
    chambre: "MIXTE",
    acteurs: ["7 députés", "7 sénateurs"],
  },
  {
    id: "adoption-definitive",
    numero: 8,
    titre: "Adoption définitive",
    resume:
      "Quand les deux chambres votent un texte identique (ou que l'Assemblée a le dernier mot), la loi est adoptée par le Parlement.",
    description:
      "Le texte n'est pas encore une loi : il devient un texte « adopté ». Il peut être soumis au Conseil constitutionnel par le Président de la République, le Premier ministre, le Président d'une chambre, 60 députés ou 60 sénateurs avant sa promulgation.",
    chambre: "AN_ET_SENAT",
    acteurs: ["Députés", "Sénateurs"],
  },
  {
    id: "controle-constitutionnel",
    numero: 9,
    titre: "Contrôle constitutionnel (facultatif)",
    resume:
      "Avant la promulgation, le Conseil constitutionnel peut être saisi pour vérifier la conformité du texte à la Constitution.",
    description:
      "Le Conseil dispose d'un mois pour se prononcer. Il peut valider le texte, le censurer partiellement (certains articles sont retirés), ou le censurer en totalité (très rare). Sa décision s'impose à tous.",
    chambre: "MIXTE",
    acteurs: ["Conseil constitutionnel"],
    dureeIndicative: "1 mois maximum",
  },
  {
    id: "promulgation",
    numero: 10,
    titre: "Promulgation et publication",
    resume:
      "Le Président de la République signe la loi (promulgation) et elle est publiée au Journal officiel. Elle entre alors en vigueur.",
    description:
      "Le Président dispose de 15 jours pour promulguer la loi. Il peut, dans ce délai, demander une nouvelle délibération au Parlement (rare). Une fois promulguée et publiée au JO, la loi est applicable — sauf si elle prévoit elle-même une date d'entrée en vigueur différée, ou si des décrets d'application sont nécessaires.",
    chambre: "EXECUTIF",
    acteurs: ["Président de la République"],
    dureeIndicative: "15 jours",
  },
];

export const CHAMBRE_LABELS: Record<ChambreImpliquee, string> = {
  AN: "Assemblée nationale",
  SENAT: "Sénat",
  AN_ET_SENAT: "Assemblée + Sénat",
  MIXTE: "Mixte",
  EXECUTIF: "Exécutif",
  EXECUTIF_OU_PARLEMENTAIRES: "Exécutif ou parlementaires",
};

export const CHAMBRE_COLORS: Record<ChambreImpliquee, string> = {
  AN: "#1A1A1B",
  SENAT: "#7B2D26",
  AN_ET_SENAT: "#4A5568",
  MIXTE: "#805AD5",
  EXECUTIF: "#2C7A7B",
  EXECUTIF_OU_PARLEMENTAIRES: "#2C7A7B",
};
