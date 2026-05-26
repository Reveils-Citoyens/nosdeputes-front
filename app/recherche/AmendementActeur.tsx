"use client";

import Box from "@mui/material/Box";
import ActeurCard from "@/components/folders/ActeurCard";

/**
 * Wrapper client autour de ActeurCard pour la page /recherche.
 * Le stopPropagation empêche le clic sur le nom du député de déclencher
 * la navigation vers le dossier (le parent <Link> englobe toute la carte
 * amendement).
 */
export default function AmendementActeur({ acteurRefUid }: { acteurRefUid: string }) {
  return (
    <Box sx={{ mb: 0.5 }} onClick={(e) => e.stopPropagation()}>
      <ActeurCard
        id={acteurRefUid}
        link="name"
        smallGroupColor
        groupColorSize="small"
      />
    </Box>
  );
}
