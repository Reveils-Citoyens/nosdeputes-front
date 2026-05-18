export type GlossaireEntry = {
  slug: string;
  titre: string;
  definitionCourte: string;
  definitionLongue?: string;
};

export const GLOSSAIRE: Record<string, GlossaireEntry> = {
  "projet-de-loi": {
    slug: "projet-de-loi",
    titre: "Projet de loi",
    definitionCourte:
      "Texte de loi déposé par le Gouvernement. Il est examiné par l'Assemblée nationale et le Sénat avant d'être adopté ou rejeté.",
    definitionLongue:
      "À distinguer de la proposition de loi, qui émane d'un parlementaire. Un projet de loi est d'abord examiné en Conseil des ministres puis transmis à l'une des deux chambres.",
  },
  "proposition-de-loi": {
    slug: "proposition-de-loi",
    titre: "Proposition de loi",
    definitionCourte:
      "Texte de loi déposé par un ou plusieurs parlementaires (députés ou sénateurs). Plus rare qu'un projet de loi gouvernemental.",
  },
  amendement: {
    slug: "amendement",
    titre: "Amendement",
    definitionCourte:
      "Modification proposée à un article d'un texte de loi en cours d'examen. Tout parlementaire peut en déposer pendant la discussion en commission ou en séance.",
  },
  rapporteur: {
    slug: "rapporteur",
    titre: "Rapporteur",
    definitionCourte:
      "Parlementaire désigné par la commission compétente pour examiner un texte en profondeur, l'amender et le présenter en séance publique.",
  },
  commission: {
    slug: "commission",
    titre: "Commission permanente",
    definitionCourte:
      "Groupe restreint de parlementaires qui examine un texte avant la séance publique. L'Assemblée en compte 8 (Finances, Lois, Affaires sociales, etc.).",
  },
  "navette-parlementaire": {
    slug: "navette-parlementaire",
    titre: "Navette parlementaire",
    definitionCourte:
      "Allers-retours d'un texte entre l'Assemblée nationale et le Sénat jusqu'à ce qu'ils s'accordent sur une version commune.",
  },
  "commission-mixte-paritaire": {
    slug: "commission-mixte-paritaire",
    titre: "Commission mixte paritaire (CMP)",
    definitionCourte:
      "Réunion de 7 députés et 7 sénateurs convoquée en cas de désaccord persistant entre les deux chambres, pour tenter de trouver un compromis.",
  },
  lecture: {
    slug: "lecture",
    titre: "Lecture",
    definitionCourte:
      "Étape d'examen d'un texte par une chambre. Un texte peut faire l'objet de plusieurs lectures (1re lecture, 2e lecture, lecture définitive…).",
  },
  promulgation: {
    slug: "promulgation",
    titre: "Promulgation",
    definitionCourte:
      "Signature de la loi par le Président de la République après son adoption définitive. C'est l'acte qui rend la loi applicable.",
  },
  "scrutin-public-solennel": {
    slug: "scrutin-public-solennel",
    titre: "Scrutin public solennel",
    definitionCourte:
      "Vote formel et nominatif sur l'ensemble d'un texte, après la discussion des articles. Le vote de chaque député est rendu public.",
  },
  "procedure-acceleree": {
    slug: "procedure-acceleree",
    titre: "Procédure accélérée",
    definitionCourte:
      "Procédure d'examen plus rapide engagée par le Gouvernement : une seule lecture par chambre avant la CMP éventuelle, au lieu de la navette habituelle.",
  },
  "groupe-parlementaire": {
    slug: "groupe-parlementaire",
    titre: "Groupe parlementaire",
    definitionCourte:
      "Association de députés réunis par affinité politique (au moins 15 à l'Assemblée). Le groupe dispose de moyens et de droits propres (temps de parole, droit de tirage…).",
  },
};

export function getTerm(slug: string): GlossaireEntry | undefined {
  return GLOSSAIRE[slug];
}

const PROCEDURE_PREFIXES: Array<{ prefix: string; slug: string }> = [
  { prefix: "projet de loi", slug: "projet-de-loi" },
  { prefix: "proposition de loi", slug: "proposition-de-loi" },
];

export function getTermForProcedure(libelle: string): string | undefined {
  const lower = libelle.toLowerCase();
  return PROCEDURE_PREFIXES.find((p) => lower.startsWith(p.prefix))?.slug;
}
