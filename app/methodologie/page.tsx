import * as React from "react";
import { Box, Container, Divider, Link, Stack, Typography } from "@mui/material";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Méthodologie & transparence — NosDéputés.fr",
  description:
    "Comment est calculé le score d'activité (heat score) des dossiers et comment sont produits les résumés générés automatiquement.",
};

// Prompt transmis tel quel au modèle — reproduit verbatim pour transparence.
const MISTRAL_PROMPT = `Mission: produire un résumé structuré et concret du contenu du dossier législatif.

Tu dois expliquer ce que le texte ferait concrètement s'il était adopté.

Consignes générales:
•⁠  ⁠Évite les formulations vagues ("renforcer", "améliorer", "favoriser") sans expliquer comment.
•⁠  ⁠Décris les changements juridiques ou opérationnels réels introduits par le texte.
•⁠  ⁠Mentionne explicitement les acteurs concernés: citoyens, entreprises, collectivités, administration, autorités publiques, secteurs professionnels, etc.
•⁠  ⁠Lorsque le texte modifie un dispositif existant, indique ce qui change par rapport à la situation actuelle.
•⁠  ⁠Ne mentionne pas la procédure parlementaire, les votes, les lectures ou la navette.
•⁠  ⁠Si les informations disponibles ne permettent pas d'être précis, reste sobre et ne complète pas avec des suppositions.

Format attendu:
•⁠  ⁠tldr: une phrase expliquant ce que ferait concrètement la loi si elle était adoptée.
•⁠  ⁠pourquoi: 2 à 5 phrases expliquant le problème à l'origine du texte, les constats ou critiques qui motivent son dépôt, et le contexte pertinent.
•⁠  ⁠enjeux: 1 à 5 enjeux majeurs selon la portée du texte. Pour chacun:
  - sujet: intitulé court de l'enjeu;
  - importance: "faible", "moderee", "elevee" ou "critique";
  - description: courte explication de l'importance de cet enjeu dans le cadre du texte;
  - arbitrage: intérêts en tension uniquement si un compromis est clairement identifiable, sinon null.
•⁠  ⁠ce_qui_change: 2 à 6 mesures concrètes si le texte en contient plusieurs; 1 seule mesure suffit pour un texte court ou très ciblé. Chaque mesure commence par un verbe d'action et décrit précisément le mécanisme prévu.
•⁠  ⁠acteurs_concernes: principaux acteurs touchés par le texte, avec l'impact concret pour chacun.
•⁠  ⁠objectif: 1 à 3 phrases expliquant le résultat concret recherché.

Pour "ce_qui_change", évite les intitulés abstraits. Décris des mécanismes.
Ne remplis pas artificiellement les listes: mieux vaut 2 mesures précises que 6 formulations vagues.

Bons exemples:
•⁠  ⁠"Obliger les plateformes à publier un rapport annuel sur leurs procédures de modération."
•⁠  ⁠"Créer une nouvelle procédure de contrôle exercée par l'autorité compétente."
•⁠  ⁠"Étendre l'éligibilité du dispositif aux entreprises de moins de 250 salariés."
•⁠  ⁠"Augmenter le plafond de l'aide financière de 5 000 à 10 000 euros."

Mauvais exemples:
•⁠  ⁠"Renforcer la transparence."
•⁠  ⁠"Améliorer le dispositif."
•⁠  ⁠"Favoriser l'accès aux droits."

Exemple de tldr:
"Le texte impose aux plateformes numériques de publier des indicateurs de modération et renforce les pouvoirs de contrôle de l'Arcom afin d'améliorer la transparence des décisions de retrait de contenu."

Cas particuliers:
•⁠  ⁠Pour une proposition de résolution, explique la position ou demande politique formulée, sans prétendre qu'elle crée directement des obligations juridiques.
•⁠  ⁠Pour un rapport ou une mission d'information, résume les constats et recommandations plutôt que des mesures législatives inexistantes.
•⁠  ⁠Pour un texte très court ou peu documenté, produis moins de mesures mais reste concret.`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section">
      <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={1.5} sx={{ color: "text.secondary", lineHeight: 1.7 }}>
        {children}
      </Stack>
    </Box>
  );
}

export default function Methodologie() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        Méthodologie &amp; transparence
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5, lineHeight: 1.7 }}>
        Nous documentons ici nos méthodes de calcul et de génération de contenu, dans un esprit
        de transparence et de neutralité. Aucun de ces indicateurs ne porte de jugement de valeur
        ni d&apos;orientation politique.
      </Typography>

      <Stack spacing={4} divider={<Divider />}>
        <Section title="Score d'activité d'un dossier (« heat score »)">
          <Typography variant="body1">
            Pour proposer un tri « les plus discutés », chaque dossier reçoit un score compris
            entre 0 et 1 qui mesure <strong>l&apos;intensité de l&apos;activité parlementaire</strong>{" "}
            autour du texte. Ce score ne reflète <strong>ni l&apos;importance d&apos;un texte, ni
            sa qualité, ni aucune orientation politique</strong> : uniquement le volume et la
            diversité de l&apos;activité observée.
          </Typography>
          <Typography variant="body1">Il combine trois signaux normalisés, puis applique une décroissance dans le temps :</Typography>

          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              bgcolor: "grey.100",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              overflowX: "auto",
            }}
          >
            score = ( 0,40 × densité_amendements
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0,30 × largeur_du_débat
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 0,30 × tension_politique )
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;× récence
          </Box>

          <Box component="ul" sx={{ pl: 3, m: 0, "& li": { mb: 1.25 } }}>
            <li>
              <strong>Densité d&apos;amendements</strong> (poids 40 %) : nombre d&apos;amendements
              déposés rapporté au nombre d&apos;articles concernés. Le signal sature à 30
              amendements par article.
            </li>
            <li>
              <strong>Largeur du débat</strong> (poids 30 %) : nombre de députés <em>différents</em>{" "}
              ayant déposé au moins un amendement. Le signal sature à 50 députés.
            </li>
            <li>
              <strong>Tension politique</strong> (poids 30 %) : part moyenne de votes dissidents
              (au sein des groupes) lors des scrutins liés au dossier. Le signal sature à 30 % de
              dissidence.
            </li>
            <li>
              <strong>Récence</strong> (multiplicateur) : décroissance exponentielle selon
              l&apos;ancienneté du dernier acte législatif, avec une <strong>demi-vie de 60
              jours</strong>. Un dossier sans activité récente voit donc son score diminuer
              progressivement.
            </li>
          </Box>
          <Typography variant="body1">
            Chaque signal est plafonné (« normalisé ») pour éviter qu&apos;une valeur extrême
            n&apos;écrase les autres. Le détail des composantes est conservé pour chaque dossier à
            des fins de vérification, et le code de calcul est public dans notre dépôt.
          </Typography>
        </Section>

        <Section title="Résumés et analyses générés automatiquement">
          <Typography variant="body1">
            Les éléments de synthèse affichés sur les pages dossiers — résumé en une phrase
            (TLDR), « pourquoi ce texte », enjeux, « ce que ça change », acteurs concernés,
            objectif et mots-clés — sont produits automatiquement par le modèle de langage{" "}
            <strong>mistral-medium</strong>, à partir du contenu du dossier législatif.
          </Typography>
          <Typography variant="body1">
            Ces contenus peuvent comporter des imprécisions ou des erreurs et ne sont pas relus
            individuellement. Ils visent à faciliter la compréhension, jamais à se substituer au
            texte officiel : en cas de doute, référez-vous toujours aux documents de
            l&apos;Assemblée nationale.
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: "text.primary", mt: 1 }}>
            Prompt exact transmis au modèle
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 2.5,
              borderRadius: "10px",
              bgcolor: "grey.100",
              border: "1px solid",
              borderColor: "grey.200",
              fontFamily: "monospace",
              fontSize: "0.8rem",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              overflowX: "auto",
              m: 0,
            }}
          >
            {MISTRAL_PROMPT}
          </Box>
        </Section>

        <Section title="Sources & code">
          <Typography variant="body1">
            Les données parlementaires proviennent des données ouvertes de l&apos;Assemblée
            nationale (via l&apos;API Tricoteuses). Le code de la plateforme, y compris le calcul
            du score, est publié sous licence libre sur{" "}
            <Link
              href="https://github.com/Reveils-Citoyens/nosdeputes-front"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              GitHub
            </Link>
            .
          </Typography>
        </Section>
      </Stack>
    </Container>
  );
}
