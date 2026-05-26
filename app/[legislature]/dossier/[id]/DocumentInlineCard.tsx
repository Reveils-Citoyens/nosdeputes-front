import * as React from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { getDocument } from "@/data/getDocument";

interface DocumentInlineCardProps {
  documentUid: string | null;
}

/**
 * Affiche le PDF du document déposé directement dans la page (iframe).
 * Utilisé pour les procédures où la chronologie législative n'a pas de sens
 * (résolutions, résolutions article 34-1, pétitions).
 */
export const DocumentInlineCard = async ({
  documentUid,
}: DocumentInlineCardProps) => {
  if (!documentUid) {
    return (
      <Paper
        elevation={0}
        sx={{
          bgcolor: "grey.100",
          borderRadius: "16px",
          p: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Aucun document associé à ce dossier.
        </Typography>
      </Paper>
    );
  }

  const document = await getDocument(documentUid);

  if (!document) {
    return (
      <Paper
        elevation={0}
        sx={{
          bgcolor: "grey.100",
          borderRadius: "16px",
          p: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Impossible de charger le document associé.
        </Typography>
      </Paper>
    );
  }

  const titre = document.titrePrincipalCourt ?? document.titrePrincipal ?? "Document";

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "grey.100",
        borderRadius: "16px",
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1}
        >
          <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1, minWidth: 0 }}>
            {titre}
          </Typography>
          {document.pdfUrl && (
            <Typography
              variant="body2"
              component={Link}
              href={document.pdfUrl}
              target="_blank"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                textDecoration: "none",
                color: "primary.main",
                fontWeight: "medium",
                flexShrink: 0,
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Ouvrir le PDF <OpenInNewIcon sx={{ fontSize: 16 }} />
            </Typography>
          )}
        </Stack>

        {document.pdfUrl ? (
          <Box
            sx={{
              width: "100%",
              height: { xs: "70vh", md: "80vh" },
              borderRadius: "8px",
              overflow: "hidden",
              bgcolor: "white",
              border: "1px solid",
              borderColor: "grey.300",
            }}
          >
            <Box
              component="iframe"
              src={document.pdfUrl}
              title={titre}
              sx={{
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              p: 3,
              bgcolor: "white",
              borderRadius: "8px",
              border: "1px dashed",
              borderColor: "grey.300",
            }}
          >
            {document.titrePrincipal &&
              document.titrePrincipal !== titre && (
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  {document.titrePrincipal}
                </Typography>
              )}
            <Typography variant="body2" color="text.secondary">
              Le texte intégral de ce document n&apos;est pas encore disponible.
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};
