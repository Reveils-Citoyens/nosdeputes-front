"use client";
import React, { Suspense } from "react";
import {
  Box, Typography, List, ListItem, ListItemText,
  IconButton, Chip, CircularProgress, Button, Divider,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Subject = { type: "dossier" | "depute"; uid: string; label: string };
type Subscription = {
  email: string;
  confirmed: boolean;
  subjects: Subject[];
  lastDigestSentAt: string | null;
};

export default function GererAlertesPage() {
  return (
    <Suspense fallback={<PageShell><CircularProgress /></PageShell>}>
      <GererAlertes />
    </Suspense>
  );
}

function GererAlertes() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<Subscription>({
    queryKey: ["alerts", token],
    queryFn: async () => {
      const r = await fetch(`/api/alerts/manage?token=${token}`);
      if (!r.ok) throw new Error("Introuvable");
      return r.json();
    },
    enabled: !!token,
    staleTime: 0,
  });

  const removeMutation = useMutation({
    mutationFn: async (uid: string) => {
      await fetch(`/api/alerts/unsubscribe?token=${token}&uid=${uid}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts", token] }),
  });

  const unsubscribeAll = useMutation({
    mutationFn: async () => {
      await fetch(`/api/alerts/unsubscribe?token=${token}`, { method: "DELETE" });
    },
    onSuccess: () => router.push("/alertes/desabonne"),
  });

  if (!token) {
    return <PageShell><Typography color="error">Lien invalide.</Typography></PageShell>;
  }
  if (isLoading) {
    return <PageShell><CircularProgress /></PageShell>;
  }
  if (isError || !data) {
    return <PageShell><Typography color="error">Abonnement introuvable.</Typography></PageShell>;
  }
  if (data.subjects.length === 0) {
    return (
      <PageShell>
        <Typography>Vous n'avez plus d'alertes actives.</Typography>
        <Button component={Link} href="/" sx={{ mt: 3 }}>Retour à l'accueil</Button>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Mes alertes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {data.email} · {data.subjects.length} alerte{data.subjects.length > 1 ? "s" : ""}
      </Typography>

      <List disablePadding>
        {data.subjects.map((s, i) => (
          <React.Fragment key={s.uid}>
            {i > 0 && <Divider />}
            <ListItem
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="supprimer"
                  onClick={() => removeMutation.mutate(s.uid)}
                  disabled={removeMutation.isPending}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              }
              sx={{ py: 1.5 }}
            >
              <ListItemText
                primary={s.label}
                secondary={
                  <Chip
                    label={s.type === "depute" ? "Député" : "Dossier"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>

      <Divider sx={{ my: 3 }} />
      <Button
        color="error"
        variant="outlined"
        size="small"
        onClick={() => unsubscribeAll.mutate()}
        disabled={unsubscribeAll.isPending}
        sx={{ borderRadius: 30, textTransform: "none" }}
      >
        Se désabonner de toutes les alertes
      </Button>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: 8, px: 3 }}>
      {children}
    </Box>
  );
}
