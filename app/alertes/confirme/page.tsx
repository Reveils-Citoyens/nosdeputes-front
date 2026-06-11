import { Box, Typography, Button, Stack } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Link from "next/link";

export default async function AlerteConfirmee({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <Box sx={{ maxWidth: 520, mx: "auto", mt: 10, px: 3, textAlign: "center" }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 56, color: "success.main", mb: 2 }} />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Alerte confirmée !
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Votre adresse email a bien été confirmée. Vous recevrez vos alertes
        parlementaires au maximum une fois par semaine.
      </Typography>
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        {token && (
          <Button
            component={Link}
            href={`/alertes/gerer?token=${token}`}
            variant="contained"
            sx={{ borderRadius: 30, textTransform: "none", px: 4, bgcolor: "#1A1A1B", "&:hover": { bgcolor: "#333" } }}
          >
            Gérer mes alertes
          </Button>
        )}
        <Button
          component={Link}
          href="/"
          variant="outlined"
          sx={{ borderRadius: 30, textTransform: "none", px: 4, borderColor: "#1A1A1B", color: "#1A1A1B" }}
        >
          Retour à l&apos;accueil
        </Button>
      </Stack>
    </Box>
  );
}
