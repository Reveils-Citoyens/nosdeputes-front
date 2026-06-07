import * as React from "react";
import { Box, Container, Divider, Link, Stack, Typography } from "@mui/material";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — NosDéputés.fr",
  description:
    "Mentions légales, éditeur, hébergeur, propriété intellectuelle, données personnelles et sources de NosDéputés.fr.",
};

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

export default function MentionsLegales() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
        Mentions légales
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 5 }}>
        Dernière mise à jour : juin 2026.
      </Typography>

      <Stack spacing={4} divider={<Divider />}>
        <Section title="Éditeur du site">
          <Typography variant="body1">
            NosDéputés.fr est édité par l&apos;association <strong>Réveils Citoyens</strong>,
            association régie par la loi du 1<sup>er</sup> juillet 1901 et le décret du 16 août
            1901, à but non lucratif, <strong>transpartisane et indépendante</strong>.
          </Typography>
          <Typography variant="body1">
            L&apos;association a pour objet de renforcer l&apos;éducation et l&apos;engagement
            civique en promouvant le libre accès aux données publiques et leur réutilisation,
            notamment à travers des outils citoyens de valorisation et d&apos;évaluation de
            l&apos;action publique. NosDéputés.fr est l&apos;un de ces outils.
          </Typography>
          <Typography variant="body1">
            Siège social : Lille (France).
            <br />
            Numéro RNA : W595045132
            <br />
            Représentation : l&apos;association est représentée par son Conseil
            d&apos;administration, qui assure la direction de la publication.
            <br />
            Contact :{" "}
            <Link href="mailto:info@reveilscitoyens.org" underline="hover">
              info@reveilscitoyens.org
            </Link>
          </Typography>
          <Typography variant="body1">
            Conformément à sa charte d&apos;indépendance, l&apos;association ne porte aucune
            affiliation partisane, n&apos;accepte aucun financement conditionné à une orientation
            idéologique, et publie ses financements de façon agrégée.
          </Typography>
        </Section>

        <Section title="Hébergement">
          <Typography variant="body1">
            Le site est hébergé par <strong>Scaleway SAS</strong>, dont les centres de
            données sont situés en <strong>France</strong>.
          </Typography>
          <Typography variant="body1">
            Scaleway SAS — 8 rue de la Ville l&apos;Évêque, 75008 Paris, France.
            <br />
            <Link href="https://www.scaleway.com" target="_blank" rel="noopener noreferrer" underline="hover">
              www.scaleway.com
            </Link>
          </Typography>
        </Section>

        <Section title="Sources des données">
          <Typography variant="body1">
            Les données parlementaires (dossiers législatifs, amendements, scrutins, débats,
            députés, organes) proviennent des données ouvertes de l&apos;Assemblée nationale,
            collectées et exposées par le projet <strong>Tricoteuses</strong> :
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0, "& li": { mb: 0.75 } }}>
            <li>
              Site du projet :{" "}
              <Link href="https://www.tricoteuses.fr" target="_blank" rel="noopener noreferrer" underline="hover">
                www.tricoteuses.fr
              </Link>
            </li>
            <li>
              Code source (Assemblée) :{" "}
              <Link
                href="https://git.tricoteuses.fr/logiciels/tricoteuses-assemblee"
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
              >
                git.tricoteuses.fr/logiciels/tricoteuses-assemblee
              </Link>
            </li>
          </Box>
          <Typography variant="body1">
            NosDéputés.fr n&apos;est pas un site officiel de l&apos;Assemblée nationale.
          </Typography>
          <Typography variant="body1">
            Certains contenus (résumés, enjeux, mots-clés) sont générés automatiquement par un
            modèle de langage. Leur méthode de production et leurs limites sont détaillées sur la
            page{" "}
            <Link href="/methodologie" underline="hover">
              Méthodologie &amp; transparence
            </Link>
            .
          </Typography>
        </Section>

        <Section title="Propriété intellectuelle et licences">
          <Typography variant="body1">
            Le code source du site est publié sous licence libre <strong>AGPL-3.0</strong> et
            disponible sur{" "}
            <Link
              href="https://github.com/Reveils-Citoyens/nosdeputes-front"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
            >
              GitHub
            </Link>
            . Les données parlementaires restent soumises à leurs licences d&apos;origine. La
            réutilisation des contenus est encouragée dans un cadre non commercial et
            respectueux de ces licences.
          </Typography>
        </Section>

        <Section title="Données personnelles (RGPD)">
          <Typography variant="body1">
            La seule donnée personnelle collectée est <strong>l&apos;adresse email</strong> que
            vous fournissez volontairement pour vous abonner à des alertes.
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0, "& li": { mb: 1 } }}>
            <li>
              <strong>Finalité</strong> : vous envoyer un récapitulatif des sujets parlementaires
              que vous suivez (députés, dossiers, thèmes, recherches).
            </li>
            <li>
              <strong>Base légale</strong> : votre consentement, recueilli par une confirmation
              explicite de l&apos;adresse (double opt-in).
            </li>
            <li>
              <strong>Destinataires</strong> : l&apos;email transite par le prestataire
              d&apos;envoi Resend ; il n&apos;est ni vendu ni cédé à des tiers.
            </li>
            <li>
              <strong>Conservation</strong> : jusqu&apos;à votre désabonnement. Chaque email
              contient un lien de désabonnement, et vous pouvez à tout moment gérer ou supprimer
              vos alertes depuis la page{" "}
              <Link href="/alertes" underline="hover">
                Gérer mes alertes
              </Link>
              .
            </li>
            <li>
              <strong>Vos droits</strong> : accès, rectification, effacement et retrait du
              consentement, en écrivant à{" "}
              <Link href="mailto:info@reveilscitoyens.org" underline="hover">
                info@reveilscitoyens.org
              </Link>
              .
            </li>
          </Box>
        </Section>

        <Section title="Cookies et traceurs">
          <Typography variant="body1">
            Le site n&apos;utilise pas de cookies publicitaires ni de traceurs tiers. Un stockage
            local (localStorage) de votre navigateur peut conserver vos préférences (adresse email
            saisie, sujets suivis) afin de faciliter votre navigation ; ces informations ne
            quittent pas votre appareil sans votre action.
          </Typography>
        </Section>

        <Section title="Responsabilité">
          <Typography variant="body1">
            NosDéputés.fr s&apos;efforce de présenter une information exacte et à jour, mais ne
            saurait garantir l&apos;exhaustivité ou l&apos;absence d&apos;erreur des données
            issues de sources externes ou des contenus générés automatiquement. Pour toute
            décision engageante, référez-vous aux sources officielles de l&apos;Assemblée
            nationale.
          </Typography>
        </Section>
      </Stack>
    </Container>
  );
}
