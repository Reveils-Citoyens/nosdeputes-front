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
import LienSource from "@/components/LienSource";
import parametres from "@/config/statistiques.json";
import { urlCompteRendu, urlScrutin, urlSource } from "@/lib/sourcesAN";
import type {
  DetailJournee,
  Intervention,
  InterventionsCommission,
  MotifExclusion,
  Seance,
  Video,
  VoteSeance,
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
// Pourquoi un paragraphe n'est pas compté comme intervention. Il peut
// néanmoins établir la présence en séance (cf. analyserParagrapheSeance).
const MOTIFS: Record<MotifExclusion, { label: string; explication: string }> = {
  presidence: {
    label: "prononcée en présidant",
    explication:
      "Donner la parole, annoncer un scrutin ou faire respecter le règlement relève de la conduite des débats, pas d’une position sur le texte. Ces interventions sont comptées à part. En séance, elles comptent en revanche pour la présence du jour.",
  },
  procedure: {
    label: "intervention de procédure",
    explication:
      "Rappel au règlement, demande de suspension, annonce de vote : le compte rendu les classe hors « parole générique ». Elles portent sur le déroulement de la séance, pas sur le fond du texte. Elles comptent en revanche pour la présence du jour.",
  },
};

const SEUIL = parametres.seuilCaracteres;

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

  // Interventions comptées en commission, rangées sous la réunion dont elles
  // viennent ; un compte rendu sans réunion listée ce jour-là reste affiché à
  // part, pour qu'aucune intervention comptée ne soit invisible.
  const interventionsParCompteRendu = new Map(
    detail.interventionsCommission.map((bloc) => [bloc.compteRenduUid, bloc])
  );
  const comptesRendusDesReunions = new Set(detail.reunions.map((r) => r.compteRenduRef));
  const interventionsSansReunion = detail.interventionsCommission.filter(
    (bloc) => !comptesRendusDesReunions.has(bloc.compteRenduUid)
  );

  return (
    <Stack spacing={4}>
      {detail.seances.map((seance) => (
        <BlocSeance
          key={seance.compteRenduUid}
          seance={seance}
          onLire={setLecture}
        />
      ))}

      {detail.votes.length > 0 ? (
        <BlocVotes votes={detail.votes} parole={detail.seances.length > 0} />
      ) : null}

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
                    {/* Le compte rendu officiel porte la liste des présents,
                        excusés et absents : c'est la pièce qui fonde l'état
                        affiché. Sans compte rendu, pas de lien. */}
                    <LienSource href={urlCompteRendu(reunion.compteRenduRef)} type="compte-rendu-commission">
                      Compte rendu et présences
                    </LienSource>
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
                  {reunion.compteRenduRef && interventionsParCompteRendu.has(reunion.compteRenduRef) ? (
                    <BlocInterventionsCommission
                      bloc={interventionsParCompteRendu.get(reunion.compteRenduRef)!}
                      lienSource={false}
                    />
                  ) : null}
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>
      ) : null}

      {interventionsSansReunion.length > 0 ? (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Interventions en commission
          </Typography>
          <Stack spacing={2}>
            {interventionsSansReunion.map((bloc) => (
              <BlocInterventionsCommission key={bloc.compteRenduUid} bloc={bloc} />
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
  const presence = seance.interventions.some((i) => i.etablitPresence);

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
        <Typography variant="subtitle2" fontWeight={700}>
          Séance publique de {heure(seance.debut)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {presence ? "Présence établie · " : null}
          {retenues} intervention{retenues > 1 ? "s" : ""} comptée
          {retenues > 1 ? "s" : ""} sur {seance.interventions.length} paragraphe
          {seance.interventions.length > 1 ? "s" : ""}
        </Typography>
        <LienSource href={urlCompteRendu(seance.compteRenduUid)} type="compte-rendu-seance">
          Compte rendu officiel
        </LienSource>
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

const POSITIONS: Record<VoteSeance["position"], string> = {
  pour: "Pour",
  contre: "Contre",
  abstention: "Abstention",
};

// Au-delà, la liste se replie : un jour de budget compte des dizaines de
// scrutins, et un seul suffit à établir la présence.
const VOTES_VISIBLES = 8;

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/**
 * Scrutins publics où le député a voté lui-même. Ils établissent sa présence
 * en séance, y compris les jours où il n'a pas pris la parole ; les votes par
 * délégation, eux, n'apparaissent pas : ils attestent l'absence.
 */
function BlocVotes({ votes, parole }: { votes: VoteSeance[]; parole: boolean }) {
  const [tout, setTout] = React.useState(false);
  const affiches = tout ? votes : votes.slice(0, VOTES_VISIBLES);

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
        <Typography variant="subtitle2" fontWeight={700}>
          Votes en personne
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {parole ? null : "Présence établie · "}
          {votes.length} scrutin{votes.length > 1 ? "s" : ""} public
          {votes.length > 1 ? "s" : ""}
        </Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
        Votes exprimés par le député lui-même. Les votes par délégation, confiés
        à un collègue en son absence, ne sont pas comptés.
      </Typography>

      <Stack divider={<Divider flexItem />} spacing={1} sx={{ mt: 1.5 }}>
        {affiches.map((vote) => (
          <Stack key={vote.scrutinUid} direction="row" spacing={1.5} alignItems="flex-start">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 64, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
            >
              n° {vote.numero}
            </Typography>
            <Chip
              size="small"
              label={POSITIONS[vote.position]}
              variant={vote.position === "abstention" ? "outlined" : "filled"}
              sx={{ height: 20, fontSize: "0.7rem", minWidth: 72, flexShrink: 0 }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2">
                {vote.titre ? majuscule(vote.titre) : `Scrutin n° ${vote.numero}`}
              </Typography>
              {vote.sort ? (
                <Typography variant="caption" color="text.secondary">
                  {majuscule(vote.sort)}
                </Typography>
              ) : null}
            </Box>
            <LienSource href={urlScrutin(vote.scrutinUid)} type="scrutin" icone />
          </Stack>
        ))}
      </Stack>

      {votes.length > VOTES_VISIBLES ? (
        <Button size="small" onClick={() => setTout((v) => !v)} sx={{ mt: 1 }}>
          {tout
            ? "Réduire la liste"
            : `Afficher les ${votes.length - VOTES_VISIBLES} autres scrutins`}
        </Button>
      ) : null}
    </Box>
  );
}

function BlocInterventionsCommission({
  bloc,
  lienSource = true,
}: {
  bloc: InterventionsCommission;
  /** Faux sous une réunion, qui affiche déjà le lien vers ce compte rendu. */
  lienSource?: boolean;
}) {
  return (
    <Box sx={{ mt: 1.25 }}>
      {lienSource ? (
        <LienSource href={urlCompteRendu(bloc.compteRenduUid)} type="compte-rendu-commission" sx={{ mb: 0.5 }}>
          Compte rendu officiel
        </LienSource>
      ) : null}
      <Typography variant="caption" color="text.secondary" component="div">
        {bloc.nombre} intervention{bloc.nombre > 1 ? "s" : ""} comptée
        {bloc.nombre > 1 ? "s" : ""}, attribuée{bloc.nombre > 1 ? "s" : ""}{" "}
        <Tooltip title="Les comptes rendus de commission ne portent pas d’identifiant d’orateur, contrairement à ceux de la séance publique : chaque prise de parole est rattachée au député par son nom tel qu’il figure dans le compte rendu.">
          <Box
            component="span"
            tabIndex={0}
            sx={{ borderBottom: "1px dotted", borderColor: "text.disabled", cursor: "help" }}
          >
            par le nom de l’orateur
          </Box>
        </Tooltip>
        {bloc.detailDisponible ? null : " — le détail sera affiché après le prochain calcul des statistiques"}
      </Typography>
      {bloc.interventions.length > 0 ? (
        <Stack spacing={1.5} sx={{ mt: 1 }}>
          {bloc.interventions.map((intervention) => (
            <LigneIntervention
              key={intervention.ordre}
              intervention={intervention}
              video={false}
              onLire={() => {}}
            />
          ))}
        </Stack>
      ) : null}
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
        {intervention.etablitPresence === false ? (
          <Typography variant="caption" color="text.secondary">
            —{" "}
            <Tooltip title={`Une interjection (« Très bien ! », « Merci. ») n’établit pas une participation au débat : seuls les paragraphes de plus de ${SEUIL} caractères comptent pour la présence en séance.`}>
              <Box
                component="span"
                tabIndex={0}
                sx={{ borderBottom: "1px dotted", borderColor: "text.disabled", cursor: "help" }}
              >
                trop courte pour établir la présence
              </Box>
            </Tooltip>
          </Typography>
        ) : null}
        {intervention.motif ? (
          <Typography variant="caption" color="text.secondary">
            — non comptée comme intervention :{" "}
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
          {/* Chaque identifiant renvoie au document officiel. */}
          <Typography variant="caption" color="text.secondary" component="div">
            {bloc.uids.map((uid, index) => {
              const url = urlSource(uid);
              return (
                <React.Fragment key={uid}>
                  {index > 0 ? ", " : null}
                  {url ? (
                    <Box
                      component="a"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-umami-event="source-an"
                      data-umami-event-type="depot"
                      sx={{ color: "inherit", "&:hover": { color: "primary.main" } }}
                    >
                      {uid}
                    </Box>
                  ) : (
                    uid
                  )}
                </React.Fragment>
              );
            })}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
