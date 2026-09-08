"use client";
import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import LecteurSeance from "@/components/LecteurSeance";
import type { PriseDeParole } from "@/data/getDernieresPrisesDeParole";

/**
 * Les dernières prises de parole d'un député, écoutables sur place.
 *
 * Toutes celles affichées ici ont une vidéo dont on a vérifié qu'elle répond :
 * proposer un bouton qui échoue serait pire que ne rien proposer.
 */
const LONGUEUR_EXTRAIT = 260;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const extrait = (texte: string) =>
  texte.length > LONGUEUR_EXTRAIT
    ? `${texte.slice(0, LONGUEUR_EXTRAIT).trimEnd()}…`
    : texte;

export default function DernieresPrisesDeParole(props: {
  prises: PriseDeParole[];
  legislature?: number;
}) {
  const legislature = props.legislature ?? 17;
  const [lecture, setLecture] = React.useState<PriseDeParole | null>(null);

  if (props.prises.length === 0) return null;

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="subtitle1" fontWeight="bold" component="h2">
        Ses dernières prises de parole en hémicycle
      </Typography>

      <Stack
        sx={{
          mt: 2,
          display: "grid",
          // Trois colonnes fixes plutôt qu'un `auto-fit` : celui-ci étirait la
          // carte unique d'un député peu intervenant sur toute la largeur, lui
          // donnant une emphase que le contenu ne justifie pas. Ici une seule
          // prise de parole occupe un tiers, deux occupent deux tiers, et le
          // reste de la ligne demeure vide — alignées à gauche.
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {props.prises.map((prise) => (
          <Card
            key={prise.compteRenduUid}
            variant="outlined"
            sx={{
              borderRadius: 3,
              borderColor: "#e0e0e0",
              boxShadow: "none",
              // La carte porte la colonne flex : `height: 100%` sur le contenu
              // le faisait déborder de la hauteur de la vignette, et la carte
              // rognait les boutons.
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {prise.vignette ? (
              // Vignette pleine largeur en tête de carte : elle donne à voir la
              // séance avant de la lire. Bouton plutôt qu'image inerte — cliquer
              // l'image est le geste attendu.
              <Box
                component="button"
                onClick={() => setLecture(prise)}
                aria-label={`Écouter l'intervention du ${formatDate(prise.dateSeance)}`}
                sx={{
                  display: "block",
                  width: "100%",
                  p: 0,
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  bgcolor: "grey.100",
                  aspectRatio: "16 / 9",
                  overflow: "hidden",
                  "&:hover .lecture": { opacity: 1 },
                }}
              >
                <Box
                  component="img"
                  src={prise.vignette}
                  alt=""
                  loading="lazy"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <Box
                  className="lecture"
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(0,0,0,0.25)",
                    opacity: 0.85,
                    transition: "opacity .15s",
                  }}
                >
                  <PlayCircleOutlineIcon
                    sx={{ fontSize: 48, color: "common.white" }}
                  />
                </Box>
              </Box>
            ) : null}

            <CardContent
              sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatDate(prise.dateSeance)}
              </Typography>

              {prise.dossierTitre ? (
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ mt: 0.5, lineHeight: 1.35 }}
                >
                  {prise.dossierTitre}
                </Typography>
              ) : null}

              <Typography
                variant="body2"
                sx={{ mt: 1, mb: 2, flexGrow: 1, lineHeight: 1.6 }}
              >
                « {extrait(prise.extrait)} »
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<PlayCircleOutlineIcon />}
                  onClick={() => setLecture(prise)}
                  sx={{ textTransform: "none" }}
                >
                  Écouter
                </Button>

                {prise.dossierUid ? (
                  // Le débat replace l'intervention dans son texte de loi ;
                  // sans dossier rattaché, il n'y a nulle part où aller.
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    component={Link}
                    href={`/${legislature}/dossier/${prise.dossierUid}/debat/${prise.compteRenduUid}`}
                    sx={{ textTransform: "none" }}
                  >
                    Voir le débat
                  </Button>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {props.prises.some((prise) => prise.vignette) ? (
        // Ces illustrations sont choisies par le service vidéo de l'Assemblée,
        // une par texte de loi, et non extraites de la séance : les créditer
        // évite que leur cadrage éditorial nous soit attribué.
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 1.5 }}
        >
          Illustrations : Assemblée nationale
        </Typography>
      ) : null}

      {lecture ? (
        <LecteurSeance
          video={lecture.video}
          seconde={lecture.seconde}
          legende={`Séance du ${formatDate(lecture.dateSeance)}`}
          onFermer={() => setLecture(null)}
        />
      ) : null}
    </Box>
  );
}
