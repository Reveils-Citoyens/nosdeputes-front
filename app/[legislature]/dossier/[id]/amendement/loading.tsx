import { Box, Skeleton, Stack } from "@mui/material";

/**
 * Fallback de chargement local à la route « Texte & amendements ».
 * Reproduit la structure de la toolbar de LiseuseClient (titre à gauche,
 * sélecteur de version à droite) pour une transition sans saut : sans ce
 * fichier, c'est le skeleton plein écran de `dossier/loading.tsx` (hero centré)
 * qui s'affichait pendant le rendu serveur de page.tsx.
 */
export default function AmendementLoading() {
  return (
    <Box sx={{ pt: 3, pb: 8, px: { xs: 2, md: 4 }, maxWidth: 1400, mx: "auto" }}>
      {/* Toolbar — même disposition que LiseuseClient (space-between) */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Skeleton variant="text" width={210} sx={{ fontSize: "1.05rem" }} />
          <Skeleton variant="text" width={150} sx={{ fontSize: "0.85rem" }} />
        </Box>
        {/* Sélecteur de version : même géométrie que le dropdown réel
            (largeur fixe 360px desktop, valeur sur deux lignes ≈ 52px de haut,
            sous-titre dessous) pour éviter tout saut au montage du composant. */}
        <Box sx={{ width: { xs: "100%", sm: 360 }, flexShrink: 0 }}>
          <Skeleton variant="rounded" width="100%" height={52} sx={{ borderRadius: "4px" }} />
          <Skeleton variant="text" width={140} sx={{ fontSize: "0.7rem", ml: "auto", mt: 0.5 }} />
        </Box>
      </Box>

      {/* Liste d'articles */}
      <Stack spacing={1}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: "10px" }} />
        ))}
      </Stack>
    </Box>
  );
}
