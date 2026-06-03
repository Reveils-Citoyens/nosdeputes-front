"use client";

import * as React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import { isValidEmail } from "@/lib/alertTypes";

export default function AlertesIndexPage() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/alerts/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <Box sx={{ maxWidth: 520, mx: "auto", mt: 10, px: 3, textAlign: "center" }}>
        <MarkEmailReadOutlinedIcon sx={{ fontSize: 56, color: "success.main", mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Vérifiez votre boîte mail
        </Typography>
        <Typography color="text.secondary">
          Si une adresse correspond à des alertes actives, vous recevrez un email
          contenant votre lien de gestion. Pensez à vérifier vos spams.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 520, mx: "auto", mt: 10, px: 3, textAlign: "center" }}>
      <NotificationsNoneIcon sx={{ fontSize: 56, color: "#1A1A1B", mb: 2 }} />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gérer mes alertes
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Entrez l&apos;adresse email avec laquelle vous suivez des députés, dossiers
        ou thèmes. Nous vous renverrons votre lien personnel de gestion.
      </Typography>

      <Stack
        component="form"
        onSubmit={handleSubmit}
        spacing={2}
        sx={{ alignItems: "stretch" }}
      >
        <TextField
          type="email"
          label="Votre adresse email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          error={status === "error"}
          helperText={status === "error" ? "Adresse email invalide." : " "}
          fullWidth
          autoFocus
        />
        <Button
          type="submit"
          variant="contained"
          disabled={status === "loading"}
          startIcon={status === "loading" ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            borderRadius: 30,
            textTransform: "none",
            px: 4,
            py: 1.25,
            bgcolor: "#1A1A1B",
            "&:hover": { bgcolor: "#333" },
          }}
        >
          {status === "loading" ? "Envoi…" : "Recevoir mon lien"}
        </Button>
      </Stack>
    </Box>
  );
}
