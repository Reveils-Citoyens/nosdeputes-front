"use client";
import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import Verbatim from "@/components/Verbatim";
import LecteurSeance from "@/components/LecteurSeance";
import BoutonVideoReunion from "@/components/BoutonVideoReunion";
import type {
  DetailJournee,
  Intervention,
  MotifExclusion,
  Seance,
  Video,
} from "@/data/mongo/getDetailJournee";

/** Ce que le lecteur ancré en bas de fenêtre est en train de jouer. */
type Lecture = { video: Video; seconde: number | null; legende: string };

/**
 * Le détail d'une journée, tel qu'un député doit pouvoir le contester.
 *
 * Les interventions écartées sont affichées au même titre que les retenues,
 * avec la règle qui les a exclues : c'est ce qui distingue une justification
 * d'une vitrine. Un lecteur qui voit pourquoi une prise de parole n'a pas
 * compté n'a plus de soupçon à formuler.
 */
const MOTIFS: Record<MotifExclusion, { label: string; explication: string }> = {
  trop_courte: {
    label: "moins de 50 caractères",
    explication:
      "Une prise de parole très brève — « Très bien ! », « Merci. » — n’établit pas une participation au débat. Le seuil de 50 caractères écarte ces interjections.",
  },
  presidence: {
    label: "prononcée en présidant",
    explication:
      "Donner la parole, annoncer un scrutin ou faire respecter le règlement relève de la conduite des débats, pas d’une position sur le texte. Ces interventions sont comptées à part.",
  },
  procedure: {
    label: "intervention de procédure",
    explication:
      "Rappel au règlement, demande de suspension, annonce de vote : le compte rendu les classe hors « parole générique ». Elles portent sur le déroulement de la séance, pas sur le fond du texte.",
  },
};

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function JourneeClient({
  detail,
  videosReunions = {},
}: {
  detail: DetailJournee;
  /**
   * Vidéos des réunions de commission, par uid de réunion. Toutes n'en ont
   * pas : les commissions d'enquête sont filmées à 91 %, les missions
   * d'information ordinaires à 6 %.
   */
  videosReunions?: Record<string, Video>;
}) {
  // Une seule vidéo à la fois, séance ou commission confondues : le lecteur est
  // ancré en bas de fenêtre, deux se superposeraient. L'état porte donc la
  // vidéo elle-même plutôt que l'identifiant d'une séance — les réunions de
  // commission n'en ont pas, et la séance n'a pas à être le cas particulier.
  const [lecture, setLecture] = React.useState<Lecture | null>(null);

  return (
    <Stack spacing={4}>
      {detail.seances.map((seance) => (
        <BlocSeance
          key={seance.compteRenduUid}
          seance={seance}
          onLire={setLecture}
        />
      ))}

      {detail.reunions.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Réunions de commission
          </Typography>
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {detail.reunions.map((reunion) => (
              <Stack
                key={reunion.reunionUid}
                direction="row"
                spacing={1.5}
                alignItems="flex-start"
              >
                <Typography
                  variant="body2"
                  sx={{ minWidth: 48, fontVariantNumeric: "tabular-nums" }}
                >
                  {heure(reunion.debut)}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600}>
                      {reunion.organe ?? "Réunion"}
                    </Typography>
                    <Chip
                      size="small"
                      label={reunion.etat}
                      sx={{ height: 20, fontSize: "0.7rem" }}
                      color={reunion.etat === "présent" ? "default" : undefined}
                      variant={reunion.etat === "présent" ? "filled" : "outlined"}
                    />
                  </Stack>
                  {reunion.objet.map((ligne, index) => (
                    <Typography key={index} variant="caption" color="text.secondary" display="block">
                      {ligne}
                    </Typography>
                  ))}
                  {videosReunions[reunion.reunionUid] ? (
                    // Les comptes rendus de commission n'ont pas d'horodatage
                    // par intervention : la vidéo s'ouvre à l'ouverture des
                    // débats, d'un seul tenant. C'est ici qu'un député conteste
                    // son décompte — pouvoir remonter à la captation compte.
                    <Box sx={{ mt: 0.75 }}>
                      <BoutonVideoReunion
                        video={videosReunions[reunion.reunionUid]}
                        legende={`${reunion.organe ?? "Réunion"} — ${heure(reunion.debut)}`}
                        taille="liste"
                        onLire={(video, legende) =>
                          setLecture({
                            video,
                            seconde: video.secondeDebut,
                            legende,
                          })
                        }
                      />
                    </Box>
                  ) : null}
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      <Depots detail={detail} />

      {lecture ? (
        <LecteurSeance
          video={lecture.video}
          seconde={lecture.seconde}
          legende={lecture.legende}
          onFermer={() => setLecture(null)}
        />
      ) : null}
    </Stack>
  );
}

function BlocSeance(props: {
  seance: Seance;
  onLire: (lecture: Lecture) => void;
}) {
  const { seance } = props;
  const retenues = seance.interventions.filter((i) => i.retenue).length;

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
        <Typography variant="subtitle2" fontWeight={700}>
          Séance publique de {heure(seance.debut)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {retenues} intervention{retenues > 1 ? "s" : ""} retenue
          {retenues > 1 ? "s" : ""} sur {seance.interventions.length}
        </Typography>
      </Stack>

      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {seance.interventions.map((intervention, index) => (
          <LigneIntervention
            key={`${intervention.ordre}-${index}`}
            intervention={intervention}
            video={seance.video != null}
            onLire={() => {
              if (!seance.video) return;
              props.onLire({
                video: seance.video,
                seconde: intervention.seconde,
                legende: `Séance publique de ${heure(seance.debut)}`,
              });
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}

function LigneIntervention(props: {
  intervention: Intervention;
  video: boolean;
  onLire: () => void;
}) {
  const { intervention } = props;
  return (
    <Box
      sx={{
        borderLeft: 3,
        borderColor: intervention.retenue ? "black" : "#E4E4E7",
        pl: 1.5,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography variant="caption" color="text.secondary">
          {intervention.longueur} caractères
        </Typography>
        {intervention.motif ? (
          <Typography variant="caption" color="text.secondary">
            — non comptée :{" "}
            <Tooltip title={MOTIFS[intervention.motif].explication}>
              {/* Pointillés plutôt que soulignement plein : la convention
                  signale une définition, pas un lien. */}
              <Box
                component="span"
                tabIndex={0}
                sx={{
                  borderBottom: "1px dotted",
                  borderColor: "text.disabled",
                  cursor: "help",
                }}
              >
                {MOTIFS[intervention.motif].label}
              </Box>
            </Tooltip>
          </Typography>
        ) : null}
        {props.video && intervention.seconde != null ? (
          <Button
            size="small"
            variant="text"
            color="inherit"
            startIcon={<PlayCircleOutlineIcon />}
            onClick={props.onLire}
            sx={{
              textTransform: "none",
              py: 0,
              px: 0.75,
              minWidth: 0,
              fontSize: "0.75rem",
              color: "text.secondary",
              "&:hover": { color: "text.primary", bgcolor: "action.hover" },
            }}
          >
            Voir la vidéo
          </Button>
        ) : null}
      </Stack>
      <Typography variant="body2" sx={{ mt: 0.25 }}>
        <Verbatim texte={intervention.texte} />
      </Typography>
    </Box>
  );
}

function Depots({ detail }: { detail: DetailJournee }) {
  const blocs = [
    { titre: "Amendements déposés", uids: detail.amendements },
    { titre: "Documents publiés", uids: detail.documents },
    { titre: "Questions", uids: detail.questions },
  ].filter((bloc) => bloc.uids.length > 0);

  if (blocs.length === 0) return null;

  return (
    <Box>
      {blocs.map((bloc) => (
        <Box key={bloc.titre} sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {bloc.titre} ({bloc.uids.length})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {bloc.uids.join(", ")}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
