import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@/components/navigation/NavigationLink";
import { getStatistiquesGroupes } from "@/data/mongo/getStatistiquesGroupes";
import { SITE_URL } from "@/lib/site";
import { openGraphPage } from "@/lib/metadata";
import GroupesClient from "./GroupesClient";

// Calculé chaque nuit : une heure de cache suffit.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Groupes politiques : cohésion et proximité de vote — NosDéputés.fr",
  description:
    "Les groupes politiques de l'Assemblée nationale votent-ils d'une même voix, et avec quels autres groupes votent-ils ? Cohésion et proximité de vote, scrutin par scrutin.",
  alternates: { canonical: `${SITE_URL}/groupes` },
  openGraph: openGraphPage({
    title: "Groupes politiques : cohésion et proximité de vote",
    description: "Cohésion de chaque groupe et proximité de vote entre groupes, à l'Assemblée nationale.",
    url: `${SITE_URL}/groupes`,
  }),
};

export default async function GroupesPage() {
  const statistiques = await getStatistiquesGroupes();

  return (
    <Container sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ mb: 4, maxWidth: "75ch" }}>
        <Typography variant="h1">Groupes politiques</Typography>
        <Typography variant="body1" color="text.secondary">
          Les groupes votent-ils d’une même voix, et avec qui votent-ils ? Ces mesures reposent sur le vote nominatif de
          chaque député lors des scrutins publics de la 17e législature.{" "}
          <Link href="/methodologie#proximite" style={{ color: "inherit" }}>
            Comment ces chiffres sont établis
          </Link>
          {" · "}
          <Link href="/deputes" style={{ color: "inherit" }}>
            Les députés par groupe
          </Link>
        </Typography>
      </Stack>

      {statistiques.length > 0 ? (
        <GroupesClient statistiques={statistiques} />
      ) : (
        <Typography variant="body1" color="text.secondary">
          Ces statistiques sont calculées chaque nuit avec les autres indicateurs d’activité ; elles apparaîtront ici
          après le prochain calcul.
        </Typography>
      )}
    </Container>
  );
}
