"use client";
import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Popover,
  TextField,
  Typography,
  Stack,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import type { AlertSubjectType } from "@/lib/alerts";

type Props = {
  subjectType: AlertSubjectType;
  subjectUid: string;
  subjectLabel: string;
  /** Affichage compact (icône seule) ou avec texte */
  variant?: "icon" | "button";
};

type SubmitStatus =
  | "idle"
  | "loading"
  | "confirmation_sent"
  | "confirmation_resent"
  | "subject_added"
  | "already_subscribed"
  | "error";

const MESSAGES: Record<string, string> = {
  confirmation_sent:
    "Un email de confirmation vous a été envoyé. Cliquez sur le lien pour activer l'alerte.",
  confirmation_resent:
    "Un nouvel email de confirmation vous a été envoyé.",
  subject_added: "Alerte ajoutée ! Vous recevrez un récapitulatif chaque semaine.",
  already_subscribed: "Vous êtes déjà abonné à cette alerte.",
  error: "Une erreur est survenue. Veuillez réessayer.",
};

export default function AlerteButton({
  subjectType,
  subjectUid,
  subjectLabel,
  variant = "button",
}: Props) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<SubmitStatus>("idle");

  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    setStatus("idle");
  };
  const handleClose = () => {
    setAnchorEl(null);
    if (status !== "confirmation_sent" && status !== "confirmation_resent") {
      setEmail("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subjectType, subjectUid, subjectLabel }),
      });
      const data = await res.json();
      setStatus(data.status ?? "error");
    } catch {
      setStatus("error");
    }
  };

  const isDone =
    status === "confirmation_sent" ||
    status === "confirmation_resent" ||
    status === "subject_added" ||
    status === "already_subscribed";

  return (
    <>
      {variant === "icon" ? (
        <IconButton
          onClick={handleOpen}
          size="small"
          aria-label="Recevoir des alertes"
          sx={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            bgcolor: "white",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid #f0f0f0",
            color: "#1A1A1B",
            "&:hover": { transform: "scale(1.1)" },
          }}
        >
          <NotificationsNoneIcon sx={{ fontSize: 20 }} />
        </IconButton>
      ) : (
        <Button
          onClick={handleOpen}
          startIcon={<NotificationsNoneIcon />}
          variant="outlined"
          size="small"
          sx={{
            borderRadius: "30px",
            textTransform: "none",
            fontWeight: "bold",
            fontSize: "12px",
            letterSpacing: "0.05em",
            px: 2.5,
            borderColor: "#1A1A1B",
            color: "#1A1A1B",
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
        >
          M'alerter
        </Button>
      )}

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              borderRadius: 3,
              boxShadow: "0px 8px 32px rgba(0,0,0,0.12)",
              width: 320,
              p: 3,
            },
          },
        }}
      >
        {isDone ? (
          <Stack spacing={1.5} alignItems="center" sx={{ py: 1, textAlign: "center" }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 40, color: "success.main" }} />
            <Typography variant="body2">{MESSAGES[status]}</Typography>
            <Button
              size="small"
              onClick={handleClose}
              sx={{ mt: 1, borderRadius: 30, textTransform: "none" }}
            >
              Fermer
            </Button>
          </Stack>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Recevoir des alertes
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Soyez notifié par email des dernières évolutions, au maximum une
              fois par semaine.
            </Typography>
            <TextField
              type="email"
              label="Votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              size="small"
              disabled={status === "loading"}
              sx={{ mb: 2 }}
            />
            {status === "error" && (
              <Typography variant="caption" color="error" sx={{ mb: 1, display: "block" }}>
                {MESSAGES.error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={status === "loading" || !email}
              sx={{
                borderRadius: 30,
                textTransform: "none",
                fontWeight: "bold",
                bgcolor: "#1A1A1B",
                "&:hover": { bgcolor: "#333" },
              }}
            >
              {status === "loading" ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                "M'abonner"
              )}
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1.5, textAlign: "center" }}
            >
              Désabonnement en un clic depuis chaque email.
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
}
