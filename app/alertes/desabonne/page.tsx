import { Box, Typography, Button } from "@mui/material";
import Link from "next/link";

export default function Desabonne() {
  return (
    <Box sx={{ maxWidth: 520, mx: "auto", mt: 10, px: 3, textAlign: "center" }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Désabonnement effectué
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Vous ne recevrez plus d&apos;alertes de notre part. Vous pouvez vous
        réabonner à tout moment depuis les pages des dossiers ou des députés.
      </Typography>
      <Button component={Link} href="/" variant="contained"
        sx={{ borderRadius: 30, textTransform: "none", px: 4 }}>
        Retour à l&apos;accueil
      </Button>
    </Box>
  );
}
