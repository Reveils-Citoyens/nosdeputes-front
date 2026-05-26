"use client";

import * as React from "react";
import { Box, Snackbar, Tooltip } from "@mui/material";
import {
  PersonAddAlt as PersonAddIcon,
  HowToReg as HowToRegIcon,
} from "@mui/icons-material";
import {
  clearMonDepute,
  MON_DEPUTE_EVENT,
  readMonDepute,
  writeMonDepute,
} from "@/lib/monDepute";

type Props = {
  uid: string;
  slug: string;
  prenom: string;
  nom: string;
  variant?: "button" | "compact";
};

export default function MonDeputeButton({
  uid,
  slug,
  prenom,
  nom,
  variant = "button",
}: Props) {
  const [isMine, setIsMine] = React.useState(false);
  const [hadOther, setHadOther] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    const sync = () => {
      const current = readMonDepute();
      setIsMine(current?.uid === uid);
      setHadOther(!!current && current.uid !== uid);
    };
    sync();
    window.addEventListener(MON_DEPUTE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MON_DEPUTE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [uid]);

  const handleClick = () => {
    if (isMine) {
      clearMonDepute();
      setToast("Sélection retirée");
    } else {
      writeMonDepute({ uid, slug, prenom, nom });
      setToast(
        hadOther
          ? `${prenom} ${nom} remplace votre précédente sélection`
          : `${prenom} ${nom} est désormais le député de votre circonscription`
      );
    }
  };

  const Icon = isMine ? HowToRegIcon : PersonAddIcon;
  const label = "Député de ma circo";
  const tooltip = isMine
    ? "Cliquer pour retirer la sélection"
    : hadOther
    ? "Remplacera votre précédente sélection"
    : "Personnaliser le site avec votre député de circonscription";

  const sharedSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.75,
    cursor: "pointer",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    transition: "background-color 0.2s, border-color 0.2s, color 0.2s",
  } as const;

  return (
    <>
      <Tooltip title={tooltip} arrow>
        {variant === "compact" ? (
          <Box
            component="button"
            onClick={handleClick}
            aria-pressed={isMine}
            aria-label={label}
            sx={{
              ...sharedSx,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "1px solid",
              borderColor: isMine ? "#1A1A1B" : "#e5e7eb",
              bgcolor: isMine ? "#1A1A1B" : "white",
              color: isMine ? "white" : "#1A1A1B",
              p: 0,
              justifyContent: "center",
              "&:hover": {
                borderColor: "#1A1A1B",
                transform: "scale(1.05)",
              },
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Box>
        ) : (
          <Box
            component="button"
            onClick={handleClick}
            aria-pressed={isMine}
            sx={{
              ...sharedSx,
              px: 2.5,
              py: 1.2,
              borderRadius: "30px",
              fontSize: "12px",
              border: "1px solid",
              borderColor: isMine ? "#1A1A1B" : "#d1d5db",
              bgcolor: isMine ? "#1A1A1B" : "white",
              color: isMine ? "white" : "#1A1A1B",
              "&:hover": {
                borderColor: "#1A1A1B",
                bgcolor: isMine ? "#333" : "#f9fafb",
              },
            }}
          >
            <Icon sx={{ fontSize: 16 }} />
            {label}
          </Box>
        )}
      </Tooltip>
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
