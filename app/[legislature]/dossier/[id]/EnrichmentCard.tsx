import * as React from "react";
import { Box } from "@mui/material";
import { CollapsibleSummary } from "./CollapsibleSummary";
import { getDossierEnrichment } from "@/data/mongo/getDossierEnrichment";

export async function EnrichmentCard({ dossierUid }: { dossierUid: string }) {
  const enrichment = await getDossierEnrichment(dossierUid);
  if (!enrichment) return null;

  const { tldr, pourquoi, enjeux, ce_qui_change, acteurs_concernes, themes_ouverts } = enrichment;
  const hasContent = tldr || pourquoi || enjeux.length > 0 || ce_qui_change.length > 0 || acteurs_concernes.length > 0;
  if (!hasContent) return null;

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "grey.200",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    >
      <CollapsibleSummary
        tldr={tldr ?? ""}
        themesOuverts={themes_ouverts}
        pourquoi={pourquoi}
        ce_qui_change={ce_qui_change}
        enjeux={enjeux}
        acteurs_concernes={acteurs_concernes}
      />
    </Box>
  );
}
