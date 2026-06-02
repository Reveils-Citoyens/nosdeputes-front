import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";

const MESSAGES: Record<string, string> = {
  missing_token: "Le lien utilisé est incomplet.",
  invalid_token: "Ce lien est invalide ou a déjà été utilisé.",
  expired_token: "Ce lien a expiré (validité 24h). Revenez sur la page du dossier ou du député pour en demander un nouveau.",
};

export default async function AlerteErreur({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = (reason && MESSAGES[reason]) ?? "Une erreur inattendue est survenue.";

  return (
    <Box sx={{ maxWidth: 520, mx: "auto", mt: 10, px: 3, textAlign: "center" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Lien invalide
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        {message}
      </Typography>
      <Button component={Link} href="/" variant="contained"
        sx={{ borderRadius: 30, textTransform: "none", px: 4 }}>
        Retour à l&apos;accueil
      </Button>
    </Box>
  );
}
