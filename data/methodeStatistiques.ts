import parametres from "@/config/statistiques.json";

/**
 * Méthode de calcul des statistiques d'activité des députés, en clair.
 *
 * Source unique des explications : les fenêtres « ⓘ » de la fiche député et la
 * section de /methodologie affichent ces mêmes textes, qui ne peuvent donc pas
 * diverger. Ils décrivent les règles de statistiques_activite.py : toute
 * modification de règle s'accompagne d'une modification ici, et d'une entrée
 * dans HISTORIQUE.
 *
 * Les valeurs entre accolades sont remplacées à l'affichage (cf. remplir) :
 * {seuil} vient de config/statistiques.json, partagé avec le script de calcul ;
 * {effectif}, {tauxRattachement} et {dateCalcul} viennent des données calculées.
 */

export const PARAMETRES_STATISTIQUES = parametres;

export type ValeursMethode = {
  seuil: number;
  /** Nombre de députés en exercice composant la comparaison. */
  effectif: number | null;
  /** Part des orateurs de commission rattachés à un député, entre 0 et 1. */
  tauxRattachement: number | null;
  /** Date ISO du dernier calcul. */
  dateCalcul: string | null;
};

export type Rubrique = {
  titre: string;
  paragraphes?: string[];
  liste?: string[];
  /** Paragraphes affichés après la liste. */
  suite?: string[];
};

export type Section = {
  /** Ancre dans /methodologie, et clé des fenêtres « ⓘ ». */
  id: string;
  titre: string;
  rubriques: Rubrique[];
};

export const PIED_EXPLICATION = "Calculé chaque nuit à partir des données de l’Assemblée nationale. Chaque élément compté est listé jour par jour dans l’onglet « Détail » de la fiche, avec un lien vers sa source officielle.";

export const INDICATEURS: Section[] = [
  {
    id: "interventions",
    titre: "Interventions en séance et en commission",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: [
          "Chaque prise de parole de fond du député, en séance publique et en réunion de commission : intervention dans la discussion, mais aussi défense d’un amendement, avis sur un amendement, question orale, défense d’une motion. Une prise de parole va du moment où le député reçoit la parole à celui où un autre orateur la prend ; une interruption lancée depuis les bancs ne la coupe pas. Elle compte pour une intervention quelle que soit sa longueur — « Défavorable. » comme un discours de vingt minutes — et quel que soit le nombre de paragraphes du compte rendu sur lequel elle s’étend. Dix prises de parole dans un même débat comptent dix.",
        ],
      },
      {
        titre: "Ce qui ne l’est pas",
        liste: [
          "Les interventions faites en présidant, en séance comme en commission (« La parole est à… », annonce d’un scrutin) : présider, c’est conduire les débats, pas prendre position sur un texte. Elles sont comptées à part et affichées en petit à gauche du chiffre principal.",
          "Les interventions de procédure : rappels au règlement, demandes de suspension, annonces liées au déroulement de la séance.",
          "Les interruptions lancées depuis les bancs (« Très bien ! », « C’est faux ! »).",
        ],
      },
      {
        titre: "Source et attribution",
        paragraphes: [
          "Séance publique : comptes rendus publiés en open data par l’Assemblée, où chaque intervention porte l’identifiant du député. L’attribution est certaine.",
          "Commissions : comptes rendus publiés sur le site de l’Assemblée, où l’orateur n’est désigné que par son nom (« M. Dupont », « Mme la rapporteure ») ; nous le rattachons au député correspondant. {tauxRattachement} des orateurs de commission sont ainsi rattachés ; les autres sont pour l’essentiel des personnes qui ne sont pas députées — ministres, personnes auditionnées.",
        ],
      },
      {
        titre: "Limites",
        paragraphes: [
          "Ni la durée ni le contenu d’une intervention ne sont pris en compte. Ce n’est pas une mesure de présence : un député présent qui ne prend pas la parole compte zéro.",
          "En commission, les comptes rendus ne distinguent pas les interruptions des autres prises de parole : chacune y coupe la parole de l’orateur, ce qui compte un peu plus de prises de parole qu’en séance pour un même débat.",
          "Jusqu’en novembre 2026, le compteur comptait des paragraphes du compte rendu, et seulement ceux classés « parole générique » : un discours découpé en quatre paragraphes comptait quatre, une défense d’amendement ne comptait pas.",
        ],
      },
    ],
  },
  {
    id: "seance-publique",
    titre: "Séance publique",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: [
          "Les jours de séance publique où la présence du député dans l’hémicycle est établie par l’un de ces deux éléments :",
        ],
        liste: [
          "une prise de parole : au moins un paragraphe du député de plus de {seuil} caractères dans le compte rendu officiel, qu’il s’agisse d’une prise de parole de fond, d’une intervention de procédure ou de la présidence de la séance ;",
          "un vote en personne : au moins un vote pour, contre ou abstention lors d’un scrutin public, exprimé par le député lui-même et non par délégation.",
        ],
        suite: [
          "Un jour compte pour un, quel que soit le nombre de prises de parole ou de votes.",
          "Dans le graphe hebdomadaire, la barre entière représente les jours où l’Assemblée a tenu séance publique dans la semaine. Elle se divise en jours où le député a pris la parole, jours où il a voté sans prendre la parole, et jours sans prise de parole ni vote.",
        ],
      },
      {
        titre: "Ce qui ne l’est pas",
        liste: [
          "Les paragraphes de {seuil} caractères ou moins (« Très bien ! », « Merci. »).",
          "Les votes par délégation : un député absent peut confier son vote à un collègue. Ce vote est enregistré à son nom, mais il atteste son absence, pas sa présence.",
          "Les votes à main levée ou par assis et levé, dont l’Assemblée ne publie pas le détail nominatif.",
        ],
      },
      {
        titre: "Source",
        paragraphes: [
          "Comptes rendus de séance publique et analyses des scrutins publics, publiés en open data par l’Assemblée. Pour chaque scrutin, la position de chaque député y est publiée, en précisant s’il a voté par délégation.",
        ],
      },
      {
        titre: "Limites",
        paragraphes: [
          "Ce n’est pas un registre de présence : l’Assemblée n’en publie pas pour la séance publique. Une prise de parole ou un vote atteste la présence à un moment de la journée, pas pendant toute la séance. Un député présent qui ne prend pas la parole et ne vote pas par scrutin public apparaît dans la partie claire du graphe, intitulée « séance sans prise de parole ni vote » et non « absent ».",
        ],
      },
    ],
  },
  {
    id: "commissions",
    titre: "Présences en commission",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: [
          "Les réunions où le député est déclaré « présent » sur le relevé nominatif que l’Assemblée publie pour chaque réunion. Sont concernées toutes les réunions dotées d’un tel relevé : commissions permanentes, commissions d’enquête, commissions spéciales, missions d’information, délégations, offices parlementaires, commissions mixtes paritaires, groupes d’amitié et groupes d’études à vocation internationale.",
          "Dans le graphe hebdomadaire, la barre entière représente les réunions auxquelles le député était convoqué dans la semaine ; la partie colorée, celles où il est déclaré présent. Les mentions « excusé » et « absent », que l’Assemblée distingue, sont distinguées aussi.",
        ],
      },
      {
        titre: "Ce qui ne l’est pas",
        liste: [
          "Les réunions où le député est noté « excusé » ou « absent ».",
          "Les réunions annulées, supprimées ou à venir.",
          "La séance publique, qui a son propre indicateur.",
        ],
      },
      {
        titre: "Source",
        paragraphes: [
          "Relevés de présence publiés en open data par l’Assemblée. C’est l’indicateur de présence le plus solide : il ne déduit rien, il reprend l’émargement officiel.",
        ],
      },
      {
        titre: "Limites",
        paragraphes: ["L’Assemblée ne précise ni l’heure d’arrivée ni la durée de présence."],
      },
    ],
  },
  {
    id: "amendements",
    titre: "Amendements",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: [
          "Les amendements dont le député est l’auteur — le premier signataire —, y compris ceux qu’il dépose en qualité de rapporteur, en commission comme en séance. Un amendement est compté à sa date de dépôt, quel que soit son sort : adopté, rejeté, tombé, irrecevable, retiré ou non soutenu.",
        ],
      },
      {
        titre: "Ce qui ne l’est pas",
        liste: [
          "Les cosignatures : un amendement cosigné par cent députés n’est compté qu’à son auteur. Sans cette règle, le chiffre mesurerait l’appartenance à un groupe plutôt que le travail de rédaction.",
          "Les amendements du Gouvernement, qui ne sont attribués à aucun député.",
        ],
      },
      {
        titre: "Source",
        paragraphes: ["Amendements publiés en open data par l’Assemblée."],
      },
      {
        titre: "Limites",
        paragraphes: ["Un amendement rédactionnel d’un mot compte autant que la réécriture d’un article."],
      },
    ],
  },
  {
    id: "documents",
    titre: "Documents signés",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: [
          "Les documents parlementaires dont le député figure parmi les auteurs, à leur date de création : propositions de loi et de résolution, rapports, avis et rapports d’information, notamment.",
        ],
      },
      {
        titre: "Ce qui ne l’est pas",
        liste: [
          "Les motions de censure : elles listent comme auteurs l’ensemble de leurs signataires (91 en moyenne, jusqu’à 192). Les compter reviendrait à mettre sur le même plan la signature d’une motion et la rédaction d’un rapport.",
          "Les cosignatures de propositions de loi.",
          "Les amendements, comptés à part.",
          "Les documents dont l’auteur est un organe (une commission) plutôt qu’une personne.",
        ],
      },
      {
        titre: "Source",
        paragraphes: ["Documents parlementaires publiés en open data par l’Assemblée."],
      },
      {
        titre: "Limites",
        paragraphes: ["Un rapport de plusieurs centaines de pages compte autant qu’une proposition de loi d’un article."],
      },
    ],
  },
  {
    id: "questions-ecrites",
    titre: "Questions écrites",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: ["Les questions écrites dont le député est l’auteur, à leur date de publication au Journal officiel."],
      },
      {
        titre: "Ce qui ne l’est pas",
        paragraphes: ["Les réponses du Gouvernement, sans effet sur le compteur."],
      },
      {
        titre: "Source",
        paragraphes: ["Questions publiées en open data par l’Assemblée."],
      },
      {
        titre: "Limites",
        paragraphes: ["Le chiffre ne dit rien de la portée d’une question, ni de l’obtention d’une réponse."],
      },
    ],
  },
  {
    id: "questions-orales",
    titre: "Questions orales sans débat",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: [
          "Les questions orales sans débat dont le député est l’auteur : posées en séance à un ministre, qui y répond oralement.",
        ],
      },
      {
        titre: "Ce qui ne l’est pas",
        paragraphes: [
          "Les questions au Gouvernement des mardis et mercredis. Leur répartition est décidée par les groupes politiques, selon un contingent hebdomadaire : le chiffre mesurerait un tour de rôle plutôt qu’une initiative personnelle.",
        ],
      },
      {
        titre: "Source",
        paragraphes: ["Questions publiées en open data par l’Assemblée."],
      },
      {
        titre: "Limites",
        paragraphes: [
          "Le nombre de questions orales sans débat est contraint par l’organisation des séances : la plupart des députés en posent zéro ou une par an. De faibles écarts suffisent à changer de tranche.",
        ],
      },
    ],
  },
  {
    id: "votes-solennels",
    titre: "Participation aux scrutins solennels",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: [
          "La part des scrutins publics solennels auxquels le député a pris part, en votant pour, contre ou en s’abstenant. Les scrutins solennels portent sur l’ensemble des textes les plus importants ; ils sont annoncés à l’avance et se tiennent à heure fixe, généralement le mardi après les questions au Gouvernement : chaque député sait qu’il y est attendu.",
          "Seuls comptent les scrutins tenus pendant le mandat du député, sur la période choisie.",
        ],
      },
      {
        titre: "Ce qui ne l’est pas",
        liste: [
          "Les scrutins où sa fonction l’empêchait de voter : présidence de l’Assemblée, présidence de la séance, appartenance au Gouvernement. Ils sortent du calcul au lieu de compter comme une absence.",
          "Les autres scrutins publics (scrutins ordinaires sur un amendement, un article) et les votes à main levée.",
        ],
      },
      {
        titre: "Votes par délégation",
        paragraphes: [
          "Un vote confié à un collègue est un vote émis au nom du député : il compte comme une participation. Leur nombre est indiqué dans l’info-bulle du chiffre. C’est la différence avec la présence en séance publique, où un vote par délégation atteste au contraire l’absence.",
        ],
      },
      {
        titre: "Classement",
        paragraphes: [
          "Les députés sont répartis en cinq tranches comme pour les autres indicateurs, à une différence près : seuls ceux qui ont pu prendre part à au moins un scrutin solennel sur la période sont comparés. Un député arrivé après le dernier scrutin n’a pas une participation nulle, il n’en a pas encore.",
        ],
      },
    ],
  },
  {
    id: "dissidence",
    titre: "Votes dissidents",
    rubriques: [
      {
        titre: "Ce qui est compté",
        paragraphes: [
          "La part des votes du député, lors des scrutins solennels, qui diffèrent de la position la plus suivie au sein de son groupe politique. Voter contre quand la majorité de son groupe vote pour est une dissidence ; s’abstenir aussi.",
          "La position de son groupe est établie à partir des votes nominatifs de ses membres. Le champ « position majoritaire » publié par l’Assemblée n’est pas utilisé : il contredit parfois les votes eux-mêmes.",
        ],
      },
      {
        titre: "Ce qui ne l’est pas",
        liste: [
          "Les scrutins où le groupe s’est partagé à égalité : sans majorité, aucun vote ne s’en écarte.",
          "Les non-inscrits : ils ne forment pas un groupe politique, voter autrement que d’autres non-inscrits n’est pas une dissidence. L’indicateur ne s’applique pas à eux.",
        ],
      },
      {
        titre: "Comment le lire",
        paragraphes: [
          "Le chiffre est rapproché de la médiane de l’Assemblée : la valeur atteinte par la moitié des députés membres d’un groupe. Une dissidence n’est ni une qualité ni un défaut : elle peut traduire une conviction personnelle, l’intérêt d’un territoire, ou un vote sur lequel le groupe a laissé à chacun sa liberté.",
        ],
      },
      {
        titre: "Limites",
        paragraphes: [
          "Certains groupes accordent la liberté de vote sur des textes de société (fin de vie, par exemple). Un vote différent de la majorité du groupe y est compté comme dissident, bien qu’aucune consigne n’ait été donnée : l’Assemblée ne publie pas les consignes de vote des groupes.",
        ],
      },
    ],
  },
  {
    id: "presidence",
    titre: "Interventions en présidant",
    rubriques: [
      {
        titre: "Pourquoi elles sont comptées à part",
        paragraphes: [
          "Présider, c’est conduire les débats : donner la parole, annoncer les scrutins, faire respecter le règlement. Ces interventions sont écartées du compteur « Interventions », sans quoi tenir le perchoir ou présider une commission suffirait à figurer parmi les députés les plus actifs. Elles ne sont pas perdues pour autant : leur nombre est affiché à part.",
          "La règle s’applique partout où le compte rendu désigne l’orateur par sa fonction, au perchoir de l’hémicycle comme à la présidence d’une commission. Elle concerne donc bien au-delà des seuls membres du Bureau.",
        ],
      },
    ],
  },
  {
    id: "classement",
    titre: "Comment ce classement est établi",
    rubriques: [
      {
        titre: "Avec qui le député est comparé",
        paragraphes: [
          "Avec les {effectif} députés en exercice à la date du calcul, sur la période choisie : toute la législature, les 12 derniers mois ou les 6 derniers mois. Les députés sans aucune activité sur l’indicateur comptent pour zéro : les exclure placerait mécaniquement chacun plus haut qu’il ne l’est.",
        ],
      },
      {
        titre: "Les cinq tranches",
        paragraphes: [
          "Les députés sont répartis en cinq tranches de taille égale, de la moins active à la plus active ; chaque tranche réunit 20 % des députés. Les seuils qui séparent les tranches sont les valeurs atteintes par 20 %, 40 %, 60 % et 80 % des députés. La barre noire est celle de la tranche du député.",
        ],
        liste: [
          "Parmi les 20 % les moins actifs",
          "Entre 20 et 40 %",
          "Dans la moyenne (40 à 60 %)",
          "Entre 60 et 80 %",
          "Parmi les 20 % les plus actifs",
        ],
      },
      {
        titre: "Égalités",
        paragraphes: [
          "Quand beaucoup de députés ont la même valeur — c’est fréquent à zéro —, ils ne peuvent pas être départagés et sont placés dans la même tranche, la plus basse qu’atteint cette valeur. Exemple : près de la moitié des députés n’ont posé aucune question orale sans débat sur les 12 derniers mois ; ils sont tous classés dans la première tranche.",
        ],
      },
      {
        titre: "Députés dont le mandat est achevé",
        paragraphes: [
          "Démission, entrée au Gouvernement, élection au Sénat, décès : un député qui a quitté l’Assemblée n’est pas classé. Son mandat, plus court et terminé, ne se compare pas à celui des députés en exercice. Sa fiche présente ses totaux sur l’ensemble de son mandat, sans tranches, et seule l’activité exercée pendant le mandat est comptée.",
          "Dans le graphe d’activité hebdomadaire, les semaines hors de son mandat sont hachurées : avant son arrivée, pour un député entré en cours de législature, et après son départ. Elles ne se lisent pas comme des absences.",
        ],
      },
    ],
  },
];

/** Libellés des cinq tranches, de la moins active à la plus active. */
export const LIBELLES_TRANCHES = INDICATEURS.find((s) => s.id === "classement")!.rubriques[1].liste!;

/** Parties générales de la section de /methodologie, avant et après les indicateurs. */
export const PRINCIPES: Rubrique[] = [
  {
    titre: "Principes",
    paragraphes: [
      "Les chiffres affichés sur la fiche de chaque député sont calculés par NosDéputés.fr, chaque nuit, à partir des données publiées par l’Assemblée nationale. Dernier calcul : {dateCalcul}.",
    ],
    liste: [
      "Chaque chiffre est vérifiable. L’onglet « Détail » de la fiche liste, jour par jour, chaque élément compté — prise de parole, vote, réunion, amendement, question — avec un lien vers le document officiel sur le site de l’Assemblée. Les éléments écartés y figurent aussi, avec la règle qui les a écartés.",
      "La règle est la même pour tous. Aucun député ne fait l’objet d’un traitement particulier.",
      "Un chiffre ne dit que ce qu’il mesure. Ces indicateurs comptent une activité publique et enregistrée. Ils ne disent rien de la qualité du travail, du travail en circonscription, ni de ce qui ne laisse pas de trace dans les documents de l’Assemblée (réunions de groupe, rendez-vous, préparation des textes).",
    ],
  },
  {
    titre: "Sources",
    paragraphes: ["Toutes les données viennent de l’Assemblée nationale :"],
    liste: [
      "L’open data de l’Assemblée (data.assemblee-nationale.fr) : comptes rendus de séance publique, relevés de présence des réunions, amendements, documents parlementaires, questions écrites et orales.",
      "Les comptes rendus des réunions de commission, publiés sur le site de l’Assemblée mais absents de l’open data. Contrairement à ceux de la séance publique, ils ne portent pas d’identifiant d’orateur : l’orateur n’est connu que par son nom.",
    ],
  },
  {
    titre: "Population de référence et périodes",
    paragraphes: [
      "Chaque député est comparé aux {effectif} députés en exercice à la date du calcul. Ce nombre est inférieur à 577 lorsque des sièges sont vacants. Les députés qui ont quitté l’Assemblée (nomination au Gouvernement, démission, décès) ne font pas partie de la comparaison.",
      "Les députés sans aucune activité sur un indicateur comptent pour zéro et entrent dans la comparaison. Les exclure reviendrait à ne comparer que les députés actifs, et à placer mécaniquement chacun plus haut qu’il ne l’est.",
      "Trois périodes sont proposées : toute la législature (depuis le 18 juillet 2024), les 12 derniers mois et les 6 derniers mois. Un élément est rattaché à une période selon sa date : date de la séance ou de la réunion, date de dépôt de l’amendement, date de création du document, date de publication de la question au Journal officiel.",
    ],
  },
];

export const CONTACT = "info@reveilscitoyens.org";

export const SIGNALER: Rubrique = {
  titre: "Signaler une erreur",
  paragraphes: [
    `Un chiffre vous semble faux ? Ouvrez l’onglet « Détail » de la fiche : chaque élément compté y renvoie à sa source officielle. Si l’erreur persiste, écrivez à ${CONTACT} en indiquant le député, l’indicateur et le jour concerné : nous corrigeons la donnée ou la règle, et l’indiquons dans l’historique ci-dessous.`,
  ],
};

export const HISTORIQUE: Rubrique = {
  titre: "Historique de la méthode",
  liste: [
    "Novembre 2026. Exclusion des motions de censure des documents signés. Le détail jour par jour de la séance publique applique la même règle que le graphe. Explications des indicateurs réécrites. La présence en séance publique tient compte des votes en personne lors des scrutins publics, hors votes par délégation.",
    "Septembre 2026. Calcul repris par NosDéputés.fr à partir des données brutes de l’Assemblée (auparavant fourni par l’API Tricoteuses) : comparaison limitée aux députés en exercice, députés sans activité comptés pour zéro, interventions en présidant comptées à part, ajout de l’onglet « Détail ».",
  ],
};


export function trouverSection(id: string): Section | undefined {
  return INDICATEURS.find((s) => s.id === id);
}

function formater(valeur: string, valeurs: ValeursMethode): string | null {
  switch (valeur) {
    case "seuil":
      return String(valeurs.seuil);
    case "effectif":
      return valeurs.effectif != null ? String(valeurs.effectif) : null;
    case "tauxRattachement":
      return valeurs.tauxRattachement != null
        ? `${(valeurs.tauxRattachement * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`
        : null;
    case "dateCalcul":
      return valeurs.dateCalcul
        ? new Date(valeurs.dateCalcul).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Europe/Paris",
          })
        : null;
    default:
      return null;
  }
}

/**
 * Remplace les {valeurs} d'un texte. Un texte dont une valeur est inconnue
 * (données indisponibles) est omis plutôt qu'affiché à trous : null.
 */
export function remplir(texte: string, valeurs: ValeursMethode): string | null {
  let manquante = false;
  const resultat = texte.replace(/\{(\w+)\}/g, (_, cle: string) => {
    const v = formater(cle, valeurs);
    if (v === null) manquante = true;
    return v ?? "";
  });
  return manquante ? null : resultat;
}

export const VALEURS_PAR_DEFAUT: ValeursMethode = {
  seuil: parametres.seuilCaracteres,
  effectif: null,
  tauxRattachement: null,
  dateCalcul: null,
};
