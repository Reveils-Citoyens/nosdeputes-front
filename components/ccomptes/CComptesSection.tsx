import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getCComptesParTheme } from "@/data/mongo/getCComptesParTheme";
import { CComptesListClient } from "./CComptesListClient";

const CDC_COLOR = "#8B1A1A";
const INITIAL_LIMIT = 5;

type CCompteSectionProps = {
  themes: string | string[];
};

export async function CComptesSection({ themes }: CCompteSectionProps) {
  const themesArr = Array.isArray(themes) ? themes : [themes];
  const { items, total } = await getCComptesParTheme(themesArr, INITIAL_LIMIT);
  if (items.length === 0) return null;

  return (
    <Box sx={{ mt: 6 }}>
      <Divider sx={{ mb: 4 }} />

      <Stack spacing={2}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              fontWeight: "bold",
              letterSpacing: "0.08em",
              color: CDC_COLOR,
              display: "block",
              mb: 0.5,
            }}
          >
            Regards de la Cour des comptes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {total === 1
              ? "Le rapport le plus récent de la Cour des comptes sur ce thème."
              : `${total} rapports de la Cour des comptes sur ce thème.`}
          </Typography>
        </Box>

        <CComptesListClient initialItems={items} total={total} themes={themesArr} />
      </Stack>
    </Box>
  );
}
