import * as React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import {
  COULEUR_LECTURE,
  ETAPES_LEGISLATIVES,
  LECTURES,
  type EtapeLegislative,
  type Lecture,
} from "@/data/processusLegislatif";
import EtapeCard from "./EtapeCard";

export const metadata = {
  title: "Comprendre — Nos Députés",
  description:
    "Comment une loi est-elle adoptée en France ? Découvrez chaque étape du parcours d'un texte de loi.",
};

/** Étapes consécutives d'une même lecture, regroupées ; les autres, seules. */
function regrouperParLecture(etapes: EtapeLegislative[]) {
  const groupes: { lecture?: Lecture; etapes: EtapeLegislative[] }[] = [];
  for (const etape of etapes) {
    const dernier = groupes.at(-1);
    if (etape.lecture && dernier?.lecture === etape.lecture) dernier.etapes.push(etape);
    else groupes.push({ lecture: etape.lecture, etapes: [etape] });
  }
  return groupes;
}

/**
 * Marge gauche de la frise : l'accolade des lectures, vide ailleurs pour garder
 * l'alignement. Sur mobile, pas de marge : un trait au bord de la zone suffit.
 */
const LARGEUR_MARGE = { xs: 0, md: 34 };

/**
 * Le trait de la frise relie deux étapes de la même zone (ou deux étapes hors
 * zone) ; il s'interrompt au bord d'une zone de lecture plutôt que de la
 * traverser.
 */
function relieeALaSuivante(etape: EtapeLegislative): boolean {
  const suivante = ETAPES_LEGISLATIVES[ETAPES_LEGISLATIVES.indexOf(etape) + 1];
  return suivante ? suivante.lecture === etape.lecture : true;
}

/**
 * Une lecture n'est pas une séance : elle englobe l'examen en commission puis
 * en séance publique, dans chacune des deux chambres. Accolade de couleur à
 * gauche, zone teintée et explication en tête.
 */
function ZoneLecture({ lecture, children }: { lecture: Lecture; children: React.ReactNode }) {
  const { libelle, explication } = LECTURES[lecture];
  return (
    <Box sx={{ display: "flex", mb: 3 }}>
      <Box
        aria-hidden
        sx={{
          width: LARGEUR_MARGE,
          flexShrink: 0,
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          // Accolade : trait vertical et deux becs vers la droite.
          "&::before": {
            content: '""',
            position: "absolute",
            top: 4,
            bottom: 4,
            right: { xs: 4, md: 8 },
            width: 10,
            border: `3px solid ${COULEUR_LECTURE}`,
            borderRight: "none",
            borderRadius: "10px 0 0 10px",
          },
        }}
      >
        <Typography
          component="span"
          sx={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            bgcolor: "white",
            color: COULEUR_LECTURE,
            fontWeight: "bold",
            fontSize: { xs: "0.65rem", md: "0.75rem" },
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            py: 1,
            position: "relative",
            zIndex: 1,
            mr: { xs: 0.5, md: 1 },
          }}
        >
          {libelle}
        </Typography>
      </Box>
      <Box
        component="section"
        aria-label={libelle}
        sx={{
          flex: 1,
          minWidth: 0,
          bgcolor: `${COULEUR_LECTURE}0D`,
          borderRadius: "20px",
          position: "relative",
          // Mobile : barre droite à l'intérieur de la zone (un bord gauche
          // suivrait l'arrondi des coins et s'effilerait).
          "&::before": {
            content: '""',
            display: { xs: "block", md: "none" },
            position: "absolute",
            left: 0,
            top: 20,
            bottom: 20,
            width: 3,
            borderRadius: 3,
            bgcolor: COULEUR_LECTURE,
          },
          px: { xs: 1.5, md: 2 },
          pt: { xs: 1.5, md: 2 },
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: COULEUR_LECTURE, mb: 2, pl: { xs: 0.5, md: 1 }, lineHeight: 1.5 }}
        >
          <strong>{libelle}</strong> — {explication}
        </Typography>
        {/* La dernière carte garde sa marge : elle ferme la zone. */}
        {children}
      </Box>
    </Box>
  );
}

export default function ComprendrePage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
      {/* Hero */}
      <Stack spacing={2} sx={{ mb: 6, textAlign: { xs: "left", md: "center" } }}>
        <Typography
          variant="overline"
          sx={{
            fontWeight: "bold",
            letterSpacing: "0.15em",
            color: "grey.600",
          }}
        >
          Comprendre
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "1.75rem", md: "2.5rem" },
            fontWeight: "bold",
            lineHeight: 1.2,
            color: "#1A1A1B",
          }}
        >
          Comment une loi est-elle adoptée en France ?
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            maxWidth: 620,
            width: "100%",
            alignSelf: { xs: "flex-start", md: "center" },
            lineHeight: 1.6,
            textAlign: { xs: "left", md: "center" },
          }}
        >
          Du dépôt d&apos;un texte à sa publication au Journal officiel, un
          projet de loi passe par une dizaine d&apos;étapes principales.
          Cliquez sur chaque étape pour en savoir plus. Les mots soulignés
          ouvrent une définition.
        </Typography>
      </Stack>

      {/* Frise verticale ; les étapes d'une même lecture sont regroupées. */}
      <Box>
        {regrouperParLecture(ETAPES_LEGISLATIVES).map((groupe) =>
          groupe.lecture ? (
            <ZoneLecture key={groupe.etapes[0].id} lecture={groupe.lecture}>
              {groupe.etapes.map((etape) => (
                <EtapeCard key={etape.id} etape={etape} ligne={relieeALaSuivante(etape)} />
              ))}
            </ZoneLecture>
          ) : (
            groupe.etapes.map((etape) => (
              <Box key={etape.id} sx={{ display: "flex" }}>
                <Box sx={{ width: LARGEUR_MARGE, flexShrink: 0 }} />
                {/* Même retrait que dans les zones de lecture : numéros alignés. */}
                <Box sx={{ flex: 1, minWidth: 0, px: { xs: 1.5, md: 2 } }}>
                  <EtapeCard etape={etape} ligne={relieeALaSuivante(etape)} />
                </Box>
              </Box>
            ))
          )
        )}
      </Box>

      {/* Note de bas de page */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          bgcolor: "grey.50",
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "grey.200",
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          <strong>À noter :</strong> ce parcours décrit le cas général de la
          loi ordinaire. Certains textes (loi organique, loi de finances, loi
          constitutionnelle) suivent une procédure spécifique. La procédure
          accélérée, fréquente, raccourcit notamment la navette parlementaire.
        </Typography>
      </Box>
    </Container>
  );
}
