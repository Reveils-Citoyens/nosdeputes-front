
export const infoDialogContents: Record<string, Record<string, { dialog?: string; translation?: string; tooltip?: string }>> = {
    home: {
        tous_les_dossiers: {
            dialog: `Un dossier législatif rassemble tous les documents et étapes relatifs à une même loi, depuis son dépôt jusqu’à sa promulgation (ou son abandon).

Il comprend notamment :
- le texte initial (projet ou proposition de loi),
- les rapports, amendements et avis des commissions,
- les débats et votes à l’Assemblée nationale et au Sénat,
- et, le cas échéant, les décisions du Conseil constitutionnel.

C’est la fiche d’identité complète d’une loi, qui permet de suivre sa progression, ses modifications et les positions des parlementaires tout au long de la procédure.

Le dossier législatif est donc la traçabilité intégrale du processus législatif.`},

        tous_les_themes: {
            dialog: `Les thèmes sont des catégories thématiques utilisées pour classer les dossiers législatifs selon leur contenu principal : économie, santé, éducation, environnement, défense, etc.

Cette classification permet de retrouver facilement toutes les lois liées à un même sujet, indépendamment de la commission ou du gouvernement qui les porte.

Sur les plateformes d’information parlementaire, les thèmes servent donc à organiser la veille législative et à offrir une vision transversale de l’action publique.`}
    },

    dossiers: {
        cosignataires: {
            translation: ``,
            dialog: `Les co-signataires sont les députés ou sénateurs qui appuient officiellement le dépôt d’un texte, comme une proposition de loi ou une résolution.

Ils ne sont pas les auteurs principaux, mais ils expriment leur soutien politique et leur accord sur le contenu du texte.
Cette co-signature peut provenir de membres du même groupe parlementaire ou de plusieurs groupes, ce qui reflète parfois un consensus ou une initiative transpartisane.`,
        },
        documents_legislatifs: {
            translation: ``,
            dialog: `Les documents législatifs regroupent tous les textes produits au cours de l’examen d’une loi : projets, propositions, amendements, rapports, avis et comptes rendus.
Ils permettent de suivre pas à pas la fabrication de la loi et de comprendre les positions des différents acteurs du Parlement.`,
        },
    },

    etapes: {
        AN1: {
            translation: ``,
            dialog: `La première lecture à l’Assemblée nationale est la première étape d’examen d’un texte de loi par les députés.
Le texte y est étudié d’abord en commission, puis débattu en séance publique, article par article.
À ce stade, les députés peuvent amender, modifier ou réécrire tout ou partie du texte avant de le transmettre au Sénat.`,
        },
        AN2: {
            translation: `La deuxième lecture à l’Assemblée nationale intervient après le passage du texte au Sénat.
Les députés examinent à nouveau le texte, cette fois en tenant compte des modifications apportées par les sénateurs.
L’objectif est de rapprocher les deux versions (Assemblée et Sénat) et de tenter d’aboutir à un texte commun.`,
            dialog: ``,
        },
        SN1: {
            translation: `La première lecture au Sénat correspond à l’examen du texte adopté par l’Assemblée nationale.
Les sénateurs l’étudient à leur tour en commission puis en séance, et peuvent eux aussi proposer des amendements.
Le texte modifié est ensuite renvoyé à l’Assemblée nationale pour une nouvelle lecture.`,
            dialog: ``,
        },
        SN2: {
            translation: `La deuxième lecture au Sénat a lieu après la nouvelle adoption du texte par l’Assemblée nationale.
Le Sénat examine les dernières modifications et peut confirmer, modifier ou rejeter certains points.
Si les deux chambres ne s’accordent toujours pas, le texte peut être confié à une commission mixte paritaire.`,
            dialog: ``,
        },
        CMP: {
            translation: `La commission mixte paritaire (CMP) réunit 7 députés et 7 sénateurs pour trouver un texte commun lorsque l’Assemblée et le Sénat ne sont pas d’accord après plusieurs lectures.
Si un accord est trouvé, ce texte de compromis est soumis pour adoption finale aux deux chambres.
Si aucun accord n’est atteint, le dernier mot revient à l’Assemblée nationale.`,
            dialog: ``,
        },
    },
    organe: {
        GP: {
            translation: "Groupe politique",
            dialog: `Un groupe politique est une organisation interne à l’Assemblée nationale ou au Sénat, qui rassemble des parlementaires partageant des orientations ou sensibilités politiques proches.
- Un groupe doit compter au moins 15 députés (ou 10 sénateurs).
- Il dispose de moyens matériels, de temps de parole et de droits spécifiques pour intervenir dans les débats, déposer des propositions de loi ou poser des questions au gouvernement.
- Certains groupes réunissent plusieurs partis alliés ou des élus indépendants proches idéologiquement.

Un groupe politique est une structure parlementaire, qui organise le travail collectif et la représentation politique à l’intérieur du Parlement.`,
        },
        PARPOL: {
            translation: "Parti politique",
            dialog: `Un parti politique est une organisation extérieure au Parlement, créée pour rassembler des citoyens autour d’idées communes et conquérir le pouvoir par les élections.
- Il a une existence juridique propre, avec des adhérents, un financement, des statuts et une direction.
- Il présente des candidats aux élections et élabore un programme politique.
- Ses élus peuvent appartenir à un ou plusieurs groupes politiques une fois au Parlement, mais le parti n’a aucun rôle institutionnel direct à l’Assemblée ou au Sénat.

Un parti politique est donc une organisation politique nationale, tandis qu’un groupe politique est sa représentation institutionnelle au Parlement.`,
        },
        CNPE: {
            translation: "Conseil National de la Protection de l'Enfance",
            dialog: `Le Conseil National de la Protection de l'Enfance est l'organisme consultatif chargé d’appuyer les politiques publiques de protection de l’enfance, de porter des avis et de réunir des acteurs concernés.`,
        },
        API: {
            translation: "Autorités Publiques Indépendantes",
            dialog: `Les Autorités Publiques Indépendantes sont les organismes de l’État qui disposent de la personnalité morale, sont autonomes et souvent chargés de réguler, contrôler ou évaluer certaines activités publiques ou privées (ex : communication, marché, santé).  ￼
Il s'agit donc d'organismes publics autonomes, hors gouvernement direct, garants de régulation ou d’équilibre.`,
        },
        GEVI: {
            translation: "Groupe d'études à vocation internationales",
            dialog: `Les groupes d'études à vocation internationales sont des regroupements de parlementaires (souvent membres de l’Assemblée nationale ou du Sénat) ayant pour but d’étudier, de débattre ou d’échanger sur des questions internationales, de coopération, ou de relations extérieures.`,
        },
        ORGEXTPARL: {
            translation: "Organisme Extra-parlementaire",
            dialog: `Les organismes extra-parlementaires sont des organes auxquels des parlementaires peuvent être nommés ou représenter le Parlement. Ce sont des institutions, commissions, conseils ou organismes extérieurs au fonctionnement strict de l’Assemblée nationale ou du Sénat, mais rattachés par convention ou nomination parlementaire.`,
        },
        CNPS: {
            translation: ``,
            dialog: ``,
        },
        GE: {
            translation: "Groupes d'études",
            dialog: `Les groupes d’études sont des regroupements de députés intéressés par un même sujet de société, économique, scientifique ou culturel.

Ils permettent d’approfondir un thème en dehors du cadre partisan ou législatif, grâce à des auditions, des visites, des rapports ou des échanges avec des experts.
Ces groupes n’ont pas de pouvoir législatif, mais ils nourrissent la réflexion parlementaire et peuvent inspirer de futures propositions de loi.`,
        },
        GA: {
            translation: "Groupe d'amitié",
            dialog: `Les groupes d’amitié sont des instances de dialogue entre parlementaires français et étrangers.

Chaque groupe d’amitié est dédié à un pays (ou une région du monde) et vise à renforcer les relations bilatérales à travers des échanges diplomatiques, culturels ou économiques.
Ils organisent des rencontres officielles, des déplacements, des réceptions et facilitent la coopération entre parlements.`,
        },
        COMPER: {
            translation: "Commission permanente",
            dialog: `Une commission permanente est un groupe de députés chargé d’examiner les textes de loi et de contrôler l’action du gouvernement dans un domaine particulier (économie, éducation, défense, etc.).

L’Assemblée nationale compte huit commissions permanentes, chacune composée d’environ 70 à 75 députés issus de tous les groupes politiques.
Ces commissions jouent un rôle essentiel dans le travail parlementaire :
- Elles étudient les projets et propositions de loi avant la séance publique, article par article, et peuvent les modifier par amendements.
- Elles rédigent des rapports pour éclairer le débat et expliquer les enjeux des textes.
- Elles auditionnent des ministres, experts ou acteurs de terrain pour recueillir des informations.
- Elles exercent une fonction de contrôle sur la mise en œuvre des politiques publiques.

Les réunions se tiennent à huis clos ou ouvertes à la presse selon les cas.
Le travail en commission permet aux députés de préparer en profondeur les lois, d’en comprendre les effets concrets et d’assurer un suivi régulier de l’action de l’État.

En résumé, les commissions permanentes sont le cœur technique et analytique du Parlement, là où s’élabore l’essentiel du travail législatif avant le débat public.`,
        },
        COMNL: {
            translation: "Missions parlementaires",
            dialog: ``,
        },
    },

    commissions: {
        // The ids correspond to the libelleAbrev in the Organe table
        'CION-CEDU': {
            translation: `Commission aff. culturelles et éducation`,
            dialog: `La commission des affaires culturelles et de l’éducation s’occupe de tout ce qui touche à la culture, à l’enseignement, à la communication et à la recherche.
Elle examine les textes et contrôle l’action du gouvernement dans ces domaines, pour garantir l’accès à la connaissance, la liberté de création et la diversité culturelle.`},
        'CION-ECO': {
            translation: `Commission des aff. économiques`,
            dialog: `La commission des affaires économiques traite des questions liées à l’économie, à l’industrie, à l’énergie, à l’agriculture, au logement et au commerce.
Elle évalue les politiques publiques qui concernent la production, la consommation et la régulation économique en général.`},
        'CION-DVP': {
            translation: `Commission dvpt durable et amngmt territoire`,
            dialog: `La commission du développement durable et de l’aménagement du territoire se penche sur l’environnement, les transports, l’énergie, le climat et la planification du territoire.
Elle travaille à concilier développement économique, protection de la planète et équilibre des territoires.`},
        'CION-SOC': {
            translation: `Commission des aff. sociales`,
            dialog: `La commission des affaires sociales s’intéresse aux questions de santé, de travail, de retraite, de solidarité et de protection sociale.
Elle veille à la cohérence du système social français et au respect des droits des travailleurs et des assurés.`},
        'CION-DEF': {
            translation: `Commission de la défense`,
            dialog: `La commission de la défense nationale et des forces armées traite de tout ce qui concerne la défense, la sécurité nationale, les armées et la politique de sécurité extérieure.
Elle contrôle l’organisation, les moyens et la stratégie de défense de la France.`},
        'CION-AFETR': {
            translation: `Commission des aff. étrangères`,
            dialog: `La commission des affaires étrangères suit la politique extérieure de la France : relations diplomatiques, action européenne, coopération internationale et défense des intérêts français à l’étranger.
Elle analyse les accords internationaux et évalue la place de la France dans le monde.`},
        'CION-FIN': {
            translation: `Commission des finances`,
            dialog: `La commission des finances suit le budget de l’État, les impôts, la dette et les politiques économiques générales.
Elle contrôle l’usage de l’argent public et veille à la sincérité des comptes publics.
C’est la commission la plus puissante sur le plan budgétaire.`},
        'CION-LOIS': {
            translation: `Commission des lois`,
            dialog: `La commission des lois examine les textes relatifs à la Constitution, aux libertés publiques, à la justice, à la sécurité et à l’organisation des institutions.
Elle joue un rôle central dans la définition des règles qui structurent la vie démocratique et les droits fondamentaux.`}
    },
    depute: {
        profession: {
            translation: 'Profession',
            dialog: `La profession indiquée sur la fiche d’un député ou d’un sénateur correspond au métier exercé avant son entrée au Parlement.

Elle ne décrit ni une fonction parlementaire, ni un statut actuel, mais permet de situer le parcours professionnel antérieur de l’élu (enseignant, avocat, journaliste, ouvrier, médecin, etc.).

Cette information aide à comprendre la diversité des origines socioprofessionnelles des élus, mais elle n’implique pas qu’ils continuent à exercer cette activité pendant leur mandat.`},
        presences: {
            translation: `Présence et participation `,
            dialog: `La présence et participation indique le nombre de fois où un député a pris part aux travaux de l’Assemblée nationale, principalement à partir de ses interventions en séance publique ou en commission.

Attention, il ne s’agit pas d’un registre officiel de présence, car l’Assemblée nationale ne publie pas de telles données. Les présences sont déduites des prises de parole, rapports, amendements ou mentions dans les comptes rendus, ce qui reflète l’activité visible, non la présence physique continue.`,
        },
        nb_documents_publie: {
            translation: `Nombre de documents publiés`,
            dialog: `Le nombre de documents publiés correspond aux rapports, avis, propositions de loi, amendements ou interventions écrites produits par un député.

Ces documents traduisent l’implication rédactionnelle et le travail de fond d’un élu au sein de l’Assemblée, notamment dans les commissions.
Ils sont recensés à partir des publications officielles sur les sites institutionnels.`,
        },
        presences_commission: {
            translation: `Présence en commission`,
            dialog: `La présence en commission indique la participation d’un député aux réunions officielles de sa commission permanente (affaires sociales, finances, etc.).

Ces données proviennent des comptes rendus publics où les interventions et présences sont enregistrées.
Comme pour les séances plénières, il s’agit de présences détectées à partir des prises de parole et non d’un registre d’émargement.`,
        },
        nb_questions_ecrite: {
            translation: `Nombre de questions écrites`,
            dialog: `Les questions écrites sont des questions formelles envoyées par les députés aux ministres, pour obtenir des précisions ou attirer l’attention sur un sujet précis.

Elles doivent recevoir une réponse écrite du gouvernement, publiée au Journal officiel. Le nombre de questions écrites reflète la vigilance et le suivi thématique du député sur certains dossiers.`,
        },
        nb_questions_orale: {
            translation: `Nombre de questions orales`,
            dialog: `Les questions orales sont posées directement au gouvernement, en séance publique (ex. : séances de questions au gouvernement du mardi et du mercredi).

Elles permettent un échange direct et public entre députés et ministres, sur des sujets d’actualité ou de politique publique.
Le nombre de questions orales reflète donc la visibilité et la participation publique du député dans l’hémicycle.`,
        },
        nb_amendements: {
            translation: `Nombre d'amendements`,
            dialog: `Le nombre d’amendements correspond au total des modifications qu’un député a proposées sur des textes de loi pendant leur examen.

Un amendement peut ajouter, supprimer ou reformuler une partie d’un article de loi.
Il traduit souvent l’investissement législatif concret d’un député : travail d’analyse, de négociation et de rédaction.

Tous les amendements sont publiés et tracés officiellement par l’Assemblée nationale, qu’ils soient adoptés, rejetés ou retirés.`,
        },
    },

    travaux_legistlatifs: {
        general: {
            translation: `Travaux législatifs`, dialog: `Les travaux législatifs désignent l’ensemble des activités liées à l’élaboration, la discussion et le vote des lois.

Cela comprend le dépôt, l’examen en commission, les débats en séance, les amendements, les rapports et les votes. Ces travaux constituent le cœur de la mission du Parlement, qui est de faire la loi et de contrôler le gouvernement.`  },
        proposition_loi: {
            translation: `Propositions de loi`, dialog: `Ce nombre indique combien de propositions de loi le député a co-signées.

Une proposition de loi est un texte déposé par un ou plusieurs parlementaires pour suggérer ou modifier une loi. Être co-signataire signifie que le député soutient officiellement l’initiative, même s’il n’en est pas l’auteur principal.`  },
        rapports: {
            translation: `Rapports`, dialog: `Les rapports sont des documents officiels rédigés par un député nommé rapporteur sur un texte ou un sujet précis.

Ils exposent le contenu, les enjeux, les modifications proposées et la position de la commission sur le texte.
Les rapports servent de base d’analyse et de référence pendant les débats parlementaires.`  },
        resolution: {
            translation: `Résolution`, dialog: `Une résolution est un texte voté par l’Assemblée nationale ou le Sénat, qui exprime une position politique, un souhait ou une orientation sans créer de règle de droit.

Elle peut porter sur un sujet national ou international, mais n’a pas de valeur contraignante.
C’est un outil d’expression politique ou symbolique du Parlement.`  },
        dossiers_nitite: {
            translation: `Dossiers législatifs inités`, dialog: `Les dossiers législatifs initiés correspondent aux textes de loi dont un député est à l’origine, c’est-à-dire qu’il en est l’auteur ou le premier signataire.

Cela inclut les propositions de loi, les résolutions ou tout autre texte déposé à son initiative.
Cet indicateur mesure la capacité d’initiative législative d’un parlementaire.`  },


    }
} as const




export const organeTranslations = Object.entries(infoDialogContents.organe).reduce((acc, [key, value]) => {
    acc[key] = value.translation || key;
    return acc;
}, {} as Record<string, string>);   