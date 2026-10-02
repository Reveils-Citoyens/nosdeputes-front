# Optimisations des chargements — 2 octobre 2026

Ce lot met en œuvre les principales optimisations de l'audit sans migrer les sources ni modifier les règles de recherche ou de rattachement. Modifications locales sur `staging`, non commitées et non déployées. Les modifications de polices déjà présentes ont été préservées.

## Changements

- Recherche : une limite Suspense par catégorie ; les dossiers rapides ne sont plus bloqués par les amendements ou les débats. Les recherches ne sont pas répétées pour calculer le total. Le compteur garde sa définition existante.
- Amendements Mongo : un seul filtrage pour les résultats et le total via `$facet`, au lieu de deux scans. Les mêmes expressions régulières, entités HTML, scores, tris, filtres de législature et jointures sont conservés. Le tri utilise des clés légères ; les documents sont relus par `_id` uniquement après pagination pour ne pas saturer la mémoire sur les pages profondes.
- Débats : lectures indépendantes parallélisées ; cache des réponses HTTP de métadonnées à 60 secondes, sans cache global d'une liste potentiellement partielle. Les onglets reçoivent la liste initiale du serveur et pointent directement vers le premier CR disponible. Les consommateurs clients réutilisent une route locale.
- Votes : liste initiale limitée aux résumés. Les positions individuelles sont chargées à l'ouverture du scrutin, avec un skeleton et un bouton de reprise après erreur. Les profils complets ne sont plus transmis. Le résultat projeté est mis en cache 60 secondes ; une panne n'est pas enregistrée comme une liste vide. Le chemin complet utilisé par « Mon député sur ce dossier » est inchangé.
- Liseuse : toutes les métadonnées restent disponibles pour les compteurs, filtres, articles additionnels, articles sans amendements et navigation. Dispositif et exposé intégral sont chargés à l'ouverture d'une carte. Les anciennes requêtes sont annulées lors d'un changement de version ; une réponse tardive de sommaire ne peut plus remplacer la nouvelle version. Le total officiel `total` est lu avant les anciens en-têtes de repli. Les erreurs de pages supplémentaires ne sont plus silencieuses. Une pagination amont répétée ou tronquée est signalée au lieu de boucler ou de présenter des résultats incomplets comme complets.
- Orateurs : récupération groupée par lots de 50, avec groupes et mandats ; repli individuel si le batch échoue ou omet un acteur. Les profils minimaux restent dans un contexte dédié, sans contaminer le cache des profils complets. L'enrichissement des membres du gouvernement est conservé.
- Séances : les interventions, métadonnées et fiabilité démarrent en parallèle. Les textes et ancres restent dans le DOM ; aucune virtualisation ou suppression d'intervention. Les composants du fil sont mémorisés pour éviter de tout recalculer lors d'un changement de position vidéo. Photos hors écran chargées paresseusement.
- Annuaire : seuls les champs de liste sont sérialisés, avec les informations nécessaires aux filtres, au tri alphabétique, aux groupes, aux circonscriptions et aux mandats.
- Fiche député : les dernières vidéos ont une limite Suspense distincte et ne bloquent plus les autres sections.
- Diagnostic : en-tête `Server-Timing` sur les métadonnées de débats, les recherches d'amendements, les lots de liseuse et les détails de votes. `PERF_DIAGNOSTICS=1` active les journaux de durée correspondants. Ni requête de recherche, ni URL, ni secret n'est ajouté aux journaux de diagnostic.

## Mesures indicatives

Les poids sont décompressés. Les mesures avant viennent de l'audit en production/local et les mesures après du build local. Ce ne sont pas des percentiles, ni des mesures LCP/INP/CLS, ni une promesse de durée en production. Les caches n'ont pas été vidés.

| Surface | Avant | Après en local |
|---|---:|---:|
| Réponse initiale des votes du dossier DLR5L17N54372 | 2,53 Mo | 200 Ko, environ −92 % |
| Premier lot de 500 amendements B2841 | 3,35 Mo | 153 Ko, environ −95 % |
| Annuaire des députés | 1,57 Mo | 420 Ko, environ −73 % |
| Recherche d'amendements « logement », réponse complète | 2,44–2,63 s | environ 1,3 s |
| Première catégorie utile dans le flux de recherche « logement » | Attendait la recherche collective | Dossiers en 49 ms ; réponse complète en 1,36 s |

Toutes les métadonnées des **1 238 amendements** du document B2841 représentent **380 574 octets** au total. Le détail de scrutin est volontairement différé, pas supprimé ; les 559 votes sont conservés. Les grandes pages de comptes rendus gardent leur texte complet et donc un poids encore important.

## Vérifications réalisées

- `npm run test:run` : **64 tests**, tous passants, contre 23 avant ce lot.
- `npm run typescript -- --noEmit` : sans erreur.
- Build de production Next.js : compilation, contrôles de types/lint et génération statique validés. Un avertissement de dépendances de hook dans `LecteurSeance.tsx`, préexistant, reste signalé ; pas de modification de ce lecteur.
- `git diff --check` : sans erreur.
- Comparaison en lecture seule avec les sources réelles : les 559 votes (positions, délégations, acteurs et groupes) sont identiques ; les 1 238 métadonnées d'amendements sont identiques, sans doublons ; dispositif et exposé HTML d'un amendement sont strictement identiques.
- Recherche : mêmes résultats, ordre et totaux que le déploiement de référence pour « logement » en pertinence et date, législature 17, et « sécurité » en pertinence, législature 16.
- Pagination profonde : recherche « article » avec `skip=10000`, HTTP 200 et résultats disponibles.
- Tests de panne : erreur de CR isolée, actes indisponibles, batch d'orateurs omis/en panne, votes indisponibles, page de liseuse manquante et pagination répétée. Les règles de priorité CR/TR, les commissions permanentes et les lectures sont couvertes.

### Parcours dans le navigateur

1. Votes : ouverture du scrutin 8430, résultats de groupes, ouverture du groupe GDR et liens individuels.
2. Liseuse : total de 1 238, ouverture d'une carte adoptée avec dispositif et exposé, filtre « Adopté » (287), changement à l'article 2.
3. Commission : accès direct, séparateur de 1re lecture, dates et heures, changement au 2 juillet 09:30, texte, bouton vidéo et temps de parole par groupe.
4. Séance : noms, groupes, commandes vidéo et vérification des **21 ancres** du sommaire ; clic sur « Protection de l'enfance ».
5. Annuaire : recherche Ruffin, ouverture du groupe, photo, lien et circonscription conservés.
6. Recherche : dossiers affichés avant les catégories encore en chargement ; « Voir plus d'amendements » ajoute cinq résultats et met à jour le compteur.

Ces contrôles ciblés n'équivalent pas à une garantie exhaustive d'absence de bugs. Aucun formulaire d'alerte n'a été soumis ; la lecture effective des vidéos et l'accessibilité complète restent hors de cette validation.

Le CR `CRCANR5L17S2026PO59048N131` reste référencé au dossier logement par les **points ODJ explicites de la source**. Un CR partagé peut traiter plusieurs sujets. Ce lot conserve ce comportement existant et n'étend pas les rattachements aux réunions non référencées d'une commission permanente.

## Reproduire les contrôles réels

Après compilation, démarrer le serveur local puis exécuter :

```sh
npm run test:run
npm run typescript -- --noEmit
npm run build
npm run start -- --hostname 127.0.0.1
```

Dans un autre terminal :

```sh
node scripts/check-performance-contracts.mjs
```

Ce script est en lecture seule, ne fait que des GET, et compare le build local aux sources publiques. Les fixtures et le déploiement de référence peuvent évoluer avec les imports : tout écart doit être examiné, pas ignoré. L'API et la base configurées localement doivent correspondre aux sources du déploiement de référence.

## Suite du plan et déploiement prudent

### Retour immédiat lors du changement d'onglet

Les dossiers et fiches députés sélectionnent désormais l'onglet dès le clic, sans attendre sa réponse serveur. Un skeleton adapté à l'onglet cible remplace l'ancien contenu ; le titre du dossier ou l'identité du député restent affichés. Le soulignement dépend directement de l'état sélectionné et non d'une mesure différée de MUI. Les limites de chargement sont placées sous les layouts partagés pour éviter un skeleton de page entière.

L'URL reste la source de vérité après la transition. L'état provisoire utilise `useOptimistic` dans la transition du routeur, sans modifier manuellement l'historique. Les liens utilisent `onNavigate`, pas `onClick`, afin de préserver Cmd/Ctrl-clic et l'ouverture native dans un nouvel onglet. Références : [React, useOptimistic](https://react.dev/reference/react/useOptimistic), [Next.js, onNavigate](https://nextjs.org/docs/app/api-reference/components/link#onnavigate).

Validation supplémentaire : **72 tests passants**, contrôle TypeScript et build de production. La compilation finale a été exécutée dans une copie temporaire isolée pour préserver le serveur de développement ouvert. Le premier contrôle navigateur relève l'onglet sélectionné et son skeleton en environ **125 ms**, alors que l'URL pointe encore vers l'onglet précédent : le feedback ne dépend donc plus de l'arrivée du contenu. Ce délai inclut l'automatisation, ce n'est pas une mesure précise de latence utilisateur.

Parcours vérifiés : Votes → Commission, Commission → Texte & amendements → Votes avant la fin du chargement, Votes → Séance ; député Activités → Travaux → Votes. Retour arrière/avant vérifié sur les deux types de page, activation de Votes au clavier et Cmd-clic vers Travaux (nouvel onglet, page courante inchangée). Les onglets désactivés restent couverts par les tests. Aucun changement de données ou de déploiement.

![Onglet Séance sélectionné avant l'arrivée du contenu](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/onglet-chargement.png)

![Onglet Votes du député, skeleton et identité conservée](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/onglet-depute-chargement.png)

### Skeletons adaptés aux onglets

Le fallback générique est remplacé par des variantes propres à l'aperçu, la liseuse (sommaire, texte et amendements), aux votes et aux débats du dossier, ainsi qu'à l'activité, aux travaux, amendements, votes, questions et détail quotidien du député. Le chargement serveur reprend le skeleton de l'onglet cible ; les chargements client des listes réutilisent la même structure sans masquer les filtres déjà disponibles. Les loaders de commission/séance ne dupliquent plus le sélecteur ni le conteneur du layout partagé.

Les états de chargement sont annoncés aux lecteurs d'écran sans ajouter de titre visible qui décale le contenu. Les états vides, filtres, pagination et règles de récupération des données restent inchangés.

Validation : **93 tests passants** (dont 12 variantes de skeleton et les états chargement/vide de quatre listes député), build de production dans une copie isolée et contrôle des espaces du diff. Le dernier build réussit mais signale une erreur DNS non bloquante lors de la génération du sitemap dossiers, ainsi que l'avertissement de hook préexistant dans `LecteurSeance.tsx`. Aucun déploiement réalisé. Vérifications navigateur : travaux, amendements, votes, questions et détail du député ; liseuse, commission et séance du dossier, avec remplacement du skeleton par le contenu.

![Skeleton de la liseuse, aligné sur ses trois panneaux](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/skeleton-liseuse.png)

![Skeleton des votes du député](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/skeleton-votes-depute.png)

### Priorité des onglets et stabilité de la liseuse

Les liens des onglets sont rendus directement, sans attendre la liste complète des CR dans un composant serveur sous Suspense. La requête client déjà utilisée continue de déterminer les liens vers la première réunion et l'indisponibilité des débats ; les layouts de destination gardent leurs contrôles et états vides. Les comptes amendements/votes et les métadonnées du dossier restent requis avant le rendu du layout : ce changement ne promet pas une page instantanée en cas de panne de ces sources.

La liseuse utilise une géométrie commune au fallback serveur, au chargement client et au contenu : largeur explicite, espace réservé pour la barre de version et les filtres, cadre stable des panneaux sur ordinateur. Le premier rendu commence en chargement, sans zone vide avant l'effet. Une nouvelle version attend aussi son sommaire avant de présenter le fallback plat. Le chargement du sommaire est protégé par une génération indépendante, afin qu'une nouvelle tentative de chargement des amendements ne le laisse pas bloqué. Chaque article démarre avec son skeleton de texte, et la sélection initiale est conservée à l'arrivée des lots suivants.

Sur le dossier `DLR5L17N54372`, à 1280 × 720, les quatre blocs page/barre d'outils/filtres/contenu conservent exactement les mêmes positions et dimensions entre le fallback et le contenu final (largeur intérieure 1216 px, hauteurs 100/26/590 px pour les trois derniers). À 390 × 844, les positions du début de ces blocs restent également identiques et aucun débordement horizontal n'est relevé. Sur mobile, le corps reste de hauteur naturelle pour préserver la lecture complète du texte et de la liste d'amendements : sa hauteur finale dépend du contenu réel, pas du skeleton.

Validation : **102 tests passants**, dont affichage des onglets sans attendre un CR, états connus/inconnus d'indisponibilité, premier rendu de la liseuse avec/sans sommaire et géométrie partagée. Contrôle TypeScript et build de production réussis (compilation, lint, types et génération des 40 pages). Les erreurs réseau de sitemap du premier build isolé ne se reproduisent pas lors de la vérification avec accès réseau ; seul l'avertissement de hook préexistant reste signalé. Parcours navigateur : filtre Adopté (287 sur 1238), article suivant, changement vers le texte adopté en commission (1220 amendements), retour au texte initial et contrôle mobile. Build exécuté dans une copie temporaire, sans toucher au cache du serveur de développement. Aucun déploiement ni changement de données.

![Liseuse après chargement, structure stabilisée](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/liseuse-stable-contenu.png)

### Retour immédiat pour la recherche et l'ouverture d'une fiche député

Le clic sur « Voir tous les résultats » ou la touche Entrée dans la recherche de l'accueil/de la navigation affiche immédiatement un écran de recherche avec la requête cible et les sections en skeleton. L'ouverture d'une nouvelle fiche député affiche immédiatement un skeleton de fiche complète, depuis l'annuaire, la recherche et les liens individuels des contenus. Les loaders serveur et le feedback client partagent les mêmes composants. Les requêtes, filtres, totaux et chargements progressifs des résultats restent inchangés : ce lot réduit l'attente sans feedback, pas le temps des requêtes serveur elles-mêmes.

Le contexte de navigation reste au-dessus du contenu de page ; la barre de navigation demeure disponible pour changer de destination. L'état provisoire utilise la transition du routeur et `useOptimistic`, sans manipulation de l'historique. L'ouverture d'un onglet de la même fiche conserve son identité et utilise toujours le feedback dédié aux onglets. Les liens passent par `onNavigate` pour préserver Cmd/Ctrl-clic, clic milieu, téléchargements et liens externes, et transmettent les options `replace`/`scroll`, attributs et refs. Si la page source est défilée, le feedback revient en haut immédiatement, sauf si `scroll={false}` ou une ancre est demandée.

Validation : **120 tests passants**, contrôle TypeScript et build de production réussis dans une copie isolée, sans toucher au cache du serveur local. Le build ne conserve que l'avertissement de hook préexistant dans `LecteurSeance.tsx` et le rappel de mise à jour Browserslist. Dans le navigateur local, le skeleton apparaît avant le changement d'URL : environ **149 ms** pour « nucléaire » depuis la barre globale, **124 ms** pour François Ruffin depuis l'annuaire et **112 ms** pour la recherche au clavier. Ces délais incluent l'automatisation et ne sont pas des mesures précises de latence utilisateur. Les résultats réels et la fiche complète remplacent ensuite les skeletons. Retour arrière/avant, onglet Votes conservant l'identité et Cmd-clic sur Maxime Amblard depuis les résultats vérifiés. Aucun déploiement ni changement de données.

![Feedback immédiat pour la recherche nucléaire](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/recherche-feedback-immediat.png)

![Feedback immédiat lors de l'ouverture d'une fiche député](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/depute-feedback-immediat.png)

### Retour immédiat de la navigation principale

Les liens Députés, Dossiers, Thèmes, Comprendre et À propos affichent désormais leur skeleton dès l'activation, avec le lien cible sélectionné dans la barre avant que son URL ne soit validée par le serveur. Les couleurs de sélection ne passent plus par une transition de 300 ms. Les fallbacks des routes et le feedback client partagent leurs composants ; les skeletons Députés/Dossiers/Comprendre existants sont réutilisés, et Thèmes/À propos ont des variantes correspondant à leurs sections. Un clic sur la section courante n'ajoute pas de skeleton de page entière. Les sous-pages, les données et les filtres ne sont pas modifiés.

Sur mobile, le menu se ferme dès la navigation, et ses liens deviennent inaccessibles au clavier/aux lecteurs d'écran lorsqu'il est fermé. Une nouvelle destination remplace le feedback provisoire précédent. Les options du routeur et le comportement natif Cmd/Ctrl-clic restent inchangés.

Validation : **130 tests passants**, TypeScript et build de production dans une copie isolée. Les cinq destinations sont couvertes par les tests (classification, skeleton dédié, sélection provisoire et retour au contenu réel). Contrôles navigateur des cinq liens et arrivée du contenu, retour arrière/avant, Cmd-clic et menu mobile à 390 × 844. Feedback constaté vers Thèmes en environ 114 ms, Dossiers 127 ms et Comprendre 111 ms, avant le changement d'URL ; ces temps incluent l'automatisation. La première ouverture des compteurs Thèmes reste lente : ce lot apporte un feedback immédiat sans accélérer cette agrégation. Aucun déploiement ni changement de données.

![Comprendre sélectionné avant l'arrivée de son contenu](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/navbar-feedback-immediat.png)

### Affinement d'À propos et retour immédiat par le logo

Le skeleton d'À propos reprend désormais le véritable en-tête via `AboutHeader` : titre à la taille définie par le thème (et non l'ancien titre de 3,75 rem), introduction et espaces identiques. Les blocs pleins sont remplacés par des cartes de valeurs structurées, des pastilles et des lignes fines à animation douce. Le contenu de la page finale n'est pas changé.

Le logo bénéficie désormais du feedback immédiat vers `/`, sans afficher un loader lorsqu'on est déjà sur l'accueil. Le fallback client reprend le même cadre de hero que la page (`HeroFrame`) avec la véritable introduction. Le champ de recherche reste un skeleton pendant cette transition : monter un champ provisoire puis le remplacer ferait perdre la saisie commencée avant l'arrivée du contenu réel. Le champ chargé conserve son fonctionnement. Aucun `loading.tsx` racine n'a été ajouté, pour ne pas appliquer un skeleton d'accueil à toutes les autres routes.

Validation : **135 tests passants**, TypeScript et build de production dans une copie isolée. Contrôles navigateur sur ordinateur et à 390 × 844 : skeleton À propos, remplacement par le contenu, logo vers l'accueil et saisie dans la recherche après chargement. Aucun débordement horizontal observé sur À propos mobile, ni erreur de console dans ces parcours. Le retour à l'accueil avec cache chaud était déjà complet à la première observation, environ 148 ms après le clic (automatisation incluse) ; le fallback pour une navigation encore en attente est couvert par les tests. Aucun déploiement ni changement de données.

![Skeleton À propos affiné](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/about-skeleton-refined.png)

### Feedback immédiat depuis les cartes de l'accueil et des domaines

Les cartes domaines et dossiers de l'accueil, les liens « Tous les thèmes/dossiers », les thèmes inclus dans un domaine, les retours thème → domaine et les listes de dossiers des domaines/thèmes utilisent désormais `NavigationLink`. Les liens de la grille générale des thèmes et de la liste générale des dossiers partagent aussi ce comportement. Les URL avec slash final restent reconnues et sont conservées lors de la navigation.

Les skeletons de domaine/thème affichent sans requête leurs titres et descriptions statiques ; les nombres restent des placeholders, pas de faux zéros. Les thèmes conservent la hauteur et la géométrie de leur bannière. Les fallbacks des routes reprennent ces mêmes composants avec les paramètres de destination. L'ouverture d'un dossier réutilise le skeleton de page complète existant (en-tête, onglets, contenu). Les navigations internes au dossier courant conservent leur identité et leur feedback d'onglet ; les slugs de thèmes/domaines inconnus ne sont pas transformés en destination valide. Aucun filtre, tri, pagination ou rattachement de données n'est modifié.

Validation : **144 tests passants**, TypeScript et build de production dans une copie isolée. Les tests couvrent aussi les vrais composants de cartes : carte dossier MUI, cartes domaines serveur de l'accueil et thèmes inclus dans une page domaine. Contrôles navigateur : accueil → Santé & solidarités → Famille, accueil → dossier logement, remplacement par les contenus réels, retour arrière/avant et activation de Famille au clavier sur mobile. Aucun débordement horizontal relevé sur les loaders domaine/thème à 390 × 844 ni erreur de console sur les parcours contrôlés. Feedback relevé avant changement d'URL à environ 115 ms pour le domaine, 226 ms pour le thème et 139 ms pour le dossier (automatisation incluse). Aucun déploiement ni changement de données.

![Domaine affiché immédiatement depuis l'accueil](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/home-domaine-feedback.png)

### Vidéos des dernières prises de parole précalculées la nuit

Audit du 2 octobre : sur une fiche député sans cache, la section vidéo coûtait **2 à 5 s** (mesuré en local et en production sur des députés jamais consultés). Pour chaque candidate, une chaîne strictement séquentielle compte rendu → réunion → vérification du flux → lecture de la page du portail de l'Assemblée pour la vignette (0,75 à 2,6 s à elle seule), jusqu'à trois fois. Le cache Next (24 h) ne protégeait que les visites répétées sur la même instance, et disparaît à chaque redémarrage du conteneur.

- Les règles de sélection sont extraites dans `data/prisesDeParoleVideo.ts`, sans dépendance à Next ni à React, avec les accès réseau injectés. C'est l'unique implémentation, couverte par des tests.
- `scripts/precalculer_prises_de_parole.mjs` exécute ce module avec Node 24 pour les députés en exercice et écrit `prises_de_parole_video` (`_id` = uid de l'acteur). Les appels communs à plusieurs députés (même séance) ne sont faits qu'une fois, les requêtes simultanées sont limitées à 6 (Tricoteuses ralentit nettement au-delà), les écritures se font par lots de 50. Une entrée existante n'est jamais remplacée par un résultat dégradé (API en échec pour ce député, ou vérification de flux indéterminée).
- Étape ajoutée à `imports_nocturnes.yml` après `ND.py`, non bloquante, avec avertissement dans le résumé en cas d'échec.
- La fiche lit l'entrée MongoDB (une lecture par `_id`). Sans entrée, ou si elle date de plus de 7 jours, elle se replie sur le calcul à la demande, dont les candidates sont désormais vérifiées en parallèle (même résultat, sans additionner les allers-retours).

Mesures : précalcul complet en **2 min 43 s** (591 députés, 589 écrits dont 554 avec vidéos, 2 conservés, 0 échec, 2 407 requêtes ; les 242 réponses 404 du diffuseur sont des vidéos sorties de l'archive). Un premier essai a subi un épisode de surcharge de Tricoteuses (248 échecs, aucune entrée remplacée, sortie en erreur) : la nouvelle tentative attend désormais 2 s, et le résumé liste les réponses en erreur par hôte. Fiche député sans cache, mêmes six députés qu'à l'audit : **2,5–5,9 s → 0,38–0,94 s** ; la section vidéo est une lecture MongoDB de 9 à 47 ms, sans plus aucun appel aux hôtes vidéo de l'Assemblée. Le reste du temps est Tricoteuses (organes, mandats, contacts).

### Recherche d'amendements par Atlas Search

L'index `amendements_search` est créé par `scripts/creer_index_recherche_amendements.mjs` (idempotent ; une modification de définition exige `--mettre-a-jour`, car elle reconstruit l'index). Analyse : balises retirées et entités HTML décodées (`htmlStrip`), minuscules, accents repliés, élisions retirées, plus un sous-champ racinisé en français. Le code vérifie que l'index est interrogeable (état relu toutes les 10 min) et garde sinon le parcours regex ; un échec d'Atlas Search retombe aussi sur le regex. Résultats et total partent en parallèle (`$search` et `$searchMeta`).

Mesures sur 10 requêtes réelles, regex → Atlas : **1,2–4,8 s → 24–200 ms**. Dans la page de recherche, la partie amendements passe de ~2,4 s à **17–111 ms** ; la section débats (recherche plein texte Tricoteuses, 0,3–3,9 s) devient la plus lente et reste dans sa propre limite Suspense.

Changements de sémantique, assumés :

- Accents repliés : « reforme » trouve désormais « réforme » (149 → 5 244 résultats).
- Racinisation : « retraites » trouve « retraite » (1 451 → 3 083), « loups » trouve « loup » (122 → 225). Ailleurs, totaux à ±3 % (« agriculture » identique, « logement » 3 966 → 4 055).
- Un mot seul garde la correspondance en début de mot (« décentralis » → 216 vs 209) ; les sous-chaînes au milieu d'un mot ne sont plus trouvées.
- Tri par date équivalent : amendements non examinés d'abord, puis date décroissante. Seul l'ordre entre ex æquo (même jour) diffère, comme il n'était pas défini auparavant.
- Pertinence : score BM25 (exposé sommaire > dispositif, forme exacte > forme racinisée) au lieu de paliers fixes départagés par la date. Les premiers résultats diffèrent, en faveur des amendements centrés sur le terme.

Correction annexe : une date absente (`xsi:nil`) s'affichait « Examen : Invalid Date » dans les résultats ; elle est désormais ignorée.

### Cache des appels Tricoteuses et organes groupés

Audit du 2 octobre : la plupart des appels à Tricoteuses n'avaient aucune option de cache, et Next 15 ne met pas `fetch` en cache par défaut. Même une page déjà servie refaisait 1 à 13 appels, chacun exposé aux lenteurs ponctuelles de l'API (médiane 40–200 ms, mais 0,3 à 5 s pour 1 appel sur 10). La fiche député demandait en outre chaque organe de ses mandats un par un : 48 appels pour un député.

- `data/cacheTricoteuses.ts` fixe trois durées, appliquées aux 18 appels qui n'en avaient pas : **24 h** pour les référentiels (organes, mandats, coordonnées, résolution « au gouvernement »), **1 h** pour les contenus (dossier, acteur, listes de documents et de dossiers, questions, recherche d'interventions), **60 s** pour l'activité (votes, amendements, documents, qui portent le compteur d'amendements). Next ne conserve que les réponses HTTP 200 et sert une entrée expirée en la rafraîchissant en arrière-plan : une panne n'est jamais mise en cache, et la durée règle la fraîcheur, pas le temps de réponse.
- `getOrganes` demande les organes par lots de 40 (`/organes/?uid=a,b,c`), alimente le cache mémoire de `getOrgane` et redemande individuellement un organe absent d'une réponse ou d'un lot en échec. Utilisé par les mandats du député et les groupes de l'annuaire.
- Correction annexe : `getActeurBySlug` testait `data.lenght` ; un slug inconnu aboutissait à `null` par une exception journalisée comme erreur.

Non groupés, faute de support par l'API : les comptes rendus du dossier (`/debats` ignore le filtre `uid` et répond 500 avec `_count` en liste) et les documents (le compteur d'amendements n'existe qu'en lecture unitaire). Les trois lectures du dossier avec des `include` différents restent séparées : elles partent en parallèle, n'ont pas la même durée de cache, et `getDossier` modifie l'objet lu (conversion des dates).

Mesures (build local, serveur neuf, puis deuxième visite) :

| Page | Avant | Après |
|---|---:|---:|
| Onglets député, page déjà servie | 73–209 ms, 4 appels Tricoteuses | **18–50 ms, 0 appel** |
| Onglets dossier, page déjà servie | 44–378 ms | **13–44 ms, 0–1 appel** |
| Fiche député, premier affichage | 52 appels (dont 48 organes) | **7 appels** |
| Autres onglets du même député, premier affichage | 4 appels chacun | **0** |

Contenu vérifié identique à la production (texte visible comparé sans tenir compte de l'ordre de streaming) pour trois fiches député, dont une membre du gouvernement, l'annuaire, l'aperçu d'un dossier et sa liseuse ; seuls diffèrent les libellés de chargement pour lecteurs d'écran ajoutés plus haut.

### Recherche et filtre « Solennels » dans les votes d'un député

Deux défauts antérieurs de l'onglet Votes de la fiche député, constatés en production :

- La recherche échouait toujours : l'API Tricoteuses répond 500 (page HTML) à toute valeur de `search` sur `/votes`, d'où l'erreur « Unexpected token '<' … is not valid JSON ». Le filtrage local qui la complétait ne voyait de toute façon que les 10 votes de la page affichée.
- Le switch « Solennels », coché par défaut, ne filtrait rien : `/votes` ignore `codeTypeVote` (même total avec `SPS` ou une valeur inventée).

Avec une recherche ou le filtre « Solennels », `searchVote` lit désormais la liste complète des votes du député réduite à quatre champs (~200 Ko pour 2 300 votes), filtre le type localement, la croise avec les uids de tous les scrutins correspondants (`/scrutins?search=`, que l'API sait traiter) et ne charge les détails (scrutin, dossier) que des votes de la page affichée. Total exact, sans plafond ; changer de page ne relit que ces détails. Sans filtre, la pagination de l'API est inchangée.

Vérifié sur Eva Sas : « enfants » → 24 votes, le scrutin 8430 (protection des enfants) en tête ; « article » → 2 162 votes ; « Solennels » → 67 votes sur 2 307, identiques au croisement fait directement sur l'API. **Changement visible, validé** : le switch reste coché par défaut et l'onglet s'ouvre donc désormais sur les seuls votes solennels.

### Lien amendement → dossier dans la recherche et les alertes

Dans la recherche, 9,5 % des amendements (8 300 sur 87 643) s'affichaient sans dossier (« — ») : le texte amendé était cherché dans la collection `dossiers`, qui contient d'anciens textes non mis à jour, au lieu de `documents`, alimentée par l'import nocturne. Les textes récents, et notamment ceux adoptés en commission (« BTC »), y manquaient : ce sont justement les amendements récents, en tête des résultats. Via `documents`, 99,8 % sont rattachés, sans aucune divergence sur les textes présents dans les deux collections ; vérifié sur 5 requêtes réelles (0 résultat sans dossier sur ~350).

Même chaîne, défaut plus grave, dans les alertes hebdomadaires : le décompte des nouveaux amendements d'un dossier suivi ne retenait que les propositions de loi (`PIONANR…`) présentes dans `dossiers`. Les projets de loi n'étaient jamais comptés. Sur quatre dossiers actifs, depuis le 1er janvier : 0 amendement compté au lieu de 157 à 2 458. Le décompte lit désormais tous les textes AN du dossier dans `documents`.

`ND.py` crée maintenant les index `documents.uid` et `documents.dossierRef` (à la prochaine exécution). D'ici là, chaque rattachement parcourt les 7 195 documents (~5 ms).

### Recherche dans les débats : lien vers le dossier et « Voir plus » instantané

- **Lien vers le dossier.** Chaque intervention affiche désormais l'intitulé du dossier législatif (lien vers son aperçu) à côté de « Lire le compte rendu ». Le rattachement couvre aussi les transcriptions vidéo (`TR-…`), majoritaires dans les résultats et jusqu'ici jamais liées : leur type se lit dans la réunion (IDC commission, IDS séance) et leur dossier dans l'ordre du jour de la réunion (le point de l'intervention s'il est connu, sinon l'unique dossier cité ; plusieurs dossiers sans point précis → aucun lien plutôt qu'un lien au hasard). Sur 30 résultats, liens vers le compte rendu : « logement » 4 → 13, « pesticides » 8 → 9, autres requêtes inchangées ; 12 liens échantillonnés répondent tous en HTTP 200.
- **Charge utile.** Chaque intervention arrivait avec son vecteur de recherche interne (~24 Ko) et son texte intégral (jusqu'à 25 000 caractères) alors que la carte en affiche 240 : sélection des seuls champs utiles et extrait de 400 caractères. Six pages de résultats : 209–369 Ko → ~25 Ko.
- **« Voir plus d'interventions ».** La page suivante est préchargée (une seconde après l'affichage, puis après chaque clic) : nouveaux résultats affichés en 47–69 ms au clic. Sans préchargement, la recherche plein texte de Tricoteuses prend de 0,1 à 1,6 s par page (jusqu'à 9 s pour la première requête d'un mot), contre 43–153 ms pour l'enrichissement MongoDB.

### PDF des résolutions et pétitions

Sur les dossiers dont l'aperçu affiche le texte déposé dans la page (résolutions, pétitions : `DocumentInlineCard`, par exemple `/17/dossier/DLR5L17N51467`), l'iframe restait vide alors que le PDF s'ouvrait dans un nouvel onglet. La politique de sécurité (CSP) n'avait pas de `frame-src` et retombait sur `default-src 'self'`, qui bloque l'hôte des PDF. Ajout de `frame-src` limité à `tricoteuses-assets.s3.fr-par.scw.cloud` (hôte de tous les PDF de l'API, vérifié sur 1 000 documents ; il sert `application/pdf` sans en-tête interdisant l'intégration). Vérifié dans le navigateur : PDF chargé dans l'iframe, aucune violation CSP.

### Ordre chronologique des commissions d'enquête et missions d'information

Les réunions et auditions des commissions d'enquête et missions d'information s'affichent désormais du plus ancien au plus récent, comme les débats des autres dossiers : carte « Réunions et auditions » de l'aperçu et sélecteur de l'onglet « Comptes rendus » (`getMissionReunions`, partagé par les deux). La lecture reste limitée aux 300 réunions les plus récentes ; le maximum actuel est de 87. Vérifié sur `DLR5L17N53705` : 11 février → 1er juillet 2026.

Le sélecteur de l'onglet « Comptes rendus » affiche aussi l'heure de chaque réunion (« Jeudi 26 février 2026 à 14:40 ») : il ne recevait que le jour, et les auditions d'une même journée apparaissaient sous des libellés identiques (12 jours concernés sur ce dossier, 0 doublon après correction).

### Interventions en commission dans le détail d'une journée de député

Le détail d'une journée (`/depute/[slug]/activite/[date]`) affichait les interventions en séance publique, mais pas celles en commission, pourtant comptées dans le total du jour. Exemple : Céline Thiébault-Martinez, 10 juin 2026, 5 interventions comptées en commission des lois et seule la ligne de présence visible.

Ces interventions sont attribuées par le nom de l'orateur (les comptes rendus de commission n'ont pas d'identifiant), avec une résolution qui dépend de l'ordre du compte rendu (« M. le rapporteur »). Plutôt que de refaire ce rapprochement à l'affichage, au risque d'en différer, `statistiques_activite.py` enregistre désormais les paragraphes comptés (`details[].paragraphes` : ordre dans le compte rendu, présidence), et la page affiche exactement ceux-là, sous la réunion concernée, en précisant le mode d'attribution. Calcul vérifié en lecture seule sur les données réelles : 20 489 lignes, paragraphes enregistrés égaux au compteur pour toutes.

Tant que les statistiques n'ont pas été recalculées avec ce code, la page indique le nombre d'interventions comptées et précise que le détail suivra.

### Optimisations restantes

La première page serveur de `/dossiers`, les caches de l'accueil/thèmes et une préparation à l'ingestion des résumés d'articles restent des optimisations secondaires non réalisées ici. La liseuse transmet désormais des métadonnées légères pour tous les articles et ne transmet leur texte détaillé qu'à l'ouverture ; ce n'est pas encore une pagination serveur des métadonnées par article. Le rendu virtuel des CR est volontairement exclu pour conserver les ancres, la recherche native dans le texte et le copier-coller intégral.

Prochaine étape recommandée : déployer ce lot en préproduction et refaire ces parcours, y compris avec un député mémorisé dans le panneau « Mon député », avant promotion en production. Vérifier les réponses initiales et la première ouverture des détails, pas uniquement les parcours avec cache chaud. En cas de problème, le lot est réversible sans migration de données.

## Captures après optimisation

![Commission, réunion et groupes conservés](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/commission.png)

![Séance, accès par le sommaire](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/seance.png)

![Annuaire, informations utiles conservées](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/deputes.png)

![Recherche et pagination](/Users/samuelfillon/.codex/visualizations/2026/09/17/01a0af5e-8bd6-7f13-a248-c97d400fb555/optimisations-2026-10-02/recherche.png)
