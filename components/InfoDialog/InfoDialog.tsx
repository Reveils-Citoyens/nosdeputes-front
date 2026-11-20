"use client";
import * as React from "react";
import {
  InfoDialogContext,
  InfoDialogDispatchContext,
} from "./InfoDialogContext";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import { infoDialogContents } from "../contents";
import Link from "next/link";
import RubriquesMethode from "@/components/methode/RubriquesMethode";
import {
  PIED_EXPLICATION,
  trouverSection,
  VALEURS_PAR_DEFAUT,
  type ValeursMethode,
} from "@/data/methodeStatistiques";

// La fenêtre est rendue dans le layout racine, hors du fournisseur React
// Query (app/providers.tsx) : chargement simple, une fois par visite. Un échec
// n'est pas retenu, pour qu'une nouvelle ouverture retente.
let valeursEnCours: Promise<ValeursMethode> | null = null;
function chargerValeurs(): Promise<ValeursMethode> {
  valeursEnCours ??= fetch("/api/statistiques/methode")
    .then((res) => {
      if (!res.ok) throw new Error("Valeurs indisponibles");
      return res.json() as Promise<ValeursMethode>;
    })
    .catch((erreur) => {
      valeursEnCours = null;
      throw erreur;
    });
  return valeursEnCours;
}

/**
 * Explication d'un indicateur, tirée de data/methodeStatistiques : mêmes textes
 * que /methodologie, valeurs à jour (effectif, taux de rattachement).
 */
function ExplicationMethode({ id, onNaviguer }: { id: string; onNaviguer: () => void }) {
  const section = trouverSection(id);
  const [valeurs, setValeurs] = React.useState<ValeursMethode | null>(null);
  React.useEffect(() => {
    let actif = true;
    chargerValeurs()
      .then((v) => actif && setValeurs(v))
      .catch(() => {
        // Sans valeurs, les phrases qui les citent sont omises (cf. remplir).
      });
    return () => {
      actif = false;
    };
  }, []);
  if (!section) return null;
  return (
    <>
      <RubriquesMethode rubriques={section.rubriques} valeurs={valeurs ?? VALEURS_PAR_DEFAUT} niveauTitre="h4" />
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1, lineHeight: 1.6 }}>
        {PIED_EXPLICATION}{" "}
        <Box
          component={Link}
          href={`/methodologie#${id}`}
          onClick={onNaviguer}
          sx={{ color: "primary.main", fontWeight: 600 }}
        >
          Méthodologie complète
        </Box>
      </Typography>
    </>
  );
}

export default function InfoDialog() {
  const contentKey = React.useContext(InfoDialogContext);
  const setContentKey = React.useContext(InfoDialogDispatchContext);

  const handleClose = () => setContentKey?.(null);

  const [cat, key] = contentKey ? contentKey.split(".") : [null, null];
  const info = cat && key ? infoDialogContents[cat][key] : null;

  if (!info) return null;

  return (
    <Dialog
      maxWidth="md"
      fullWidth
      onClose={handleClose}
      open={!!contentKey}
      slotProps={{
        paper: {
          elevation: 2,
          sx: {
            borderRadius: 3,
            backgroundImage: "none",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h6"
          component="div"
          fontWeight="bold"
          sx={{ lineHeight: 1.3, mr: 2 }}
        >
          {(info.methode && trouverSection(info.methode)?.titre) || info.translation}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            color: "grey.500",
            mr: -1.5,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, borderColor: "grey.100" }}>
        {info.methode ? <ExplicationMethode id={info.methode} onNaviguer={handleClose} /> : null}
        {info.dialog?.split("\n").map((line, index) => {
          if (!line.trim()) return <Box key={index} sx={{ height: 16 }} />;
          return (
            <Typography
              key={index}
              variant="body1"
              color="text.secondary"
              sx={{ mb: 1.5, lineHeight: 1.6 }}
            >
              {line}
            </Typography>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}
