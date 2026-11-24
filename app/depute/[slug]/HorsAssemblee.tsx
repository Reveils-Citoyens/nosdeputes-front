import * as React from "react";
import Link from "next/link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { FonctionGouvernement } from "@/lib/situationActeur";

/**
 * Tient lieu de statistiques pour qui n'a pas été député de la législature :
 * un membre du Gouvernement venu d'ailleurs, typiquement. Ses chiffres seraient
 * tous nuls et le classeraient parmi les « moins actifs » — un contresens.
 */
export default function HorsAssemblee(props: {
  nom: string;
  feminin: boolean;
  gouvernement: FonctionGouvernement | null;
  slug: string;
}) {
  const depute = props.feminin ? "députée" : "député";

  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2, md: 3 }, bgcolor: "grey.100", borderRadius: "16px" }}
    >
      <Typography variant="subtitle1" fontWeight="bold" component="h2">
        {props.nom} n&apos;est pas {depute}
      </Typography>
      {props.gouvernement ? (
        <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.7 }}>
          {props.gouvernement.intitule === "Membre du Gouvernement"
            ? "Membre du Gouvernement"
            : `${props.gouvernement.intitule}, membre du Gouvernement`}
          . Les ministres prennent la parole à l&apos;Assemblée sans y siéger :
          ils n&apos;y votent pas, n&apos;y posent pas de questions, et leurs
          amendements sont déposés au nom du Gouvernement. Les statistiques
          d&apos;activité des députés ne s&apos;appliquent donc pas ici ; ses
          interventions sont consultables dans l&apos;onglet{" "}
          <Link href={`/depute/${props.slug}/travaux`}>Travaux</Link>.
        </Typography>
      ) : (
        <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.7 }}>
          Pas de mandat de {depute} pendant la législature en cours : aucune
          statistique d&apos;activité n&apos;est calculée.
        </Typography>
      )}
    </Paper>
  );
}
