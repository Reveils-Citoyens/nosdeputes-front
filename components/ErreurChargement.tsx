"use client";
import { Alert, Button } from "@mui/material";

/**
 * Liste qui n'a pas pu être chargée : on le dit, plutôt que d'afficher
 * « Aucun résultat », et on propose de réessayer.
 */
export default function ErreurChargement({
  message = "Cette liste n'a pas pu être chargée. Réessayez dans quelques instants.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Réessayer
        </Button>
      }
    >
      {message}
    </Alert>
  );
}

