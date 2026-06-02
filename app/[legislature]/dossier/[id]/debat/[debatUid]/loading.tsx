import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

function ParoleSkeleton({ isFirst = false }: { isFirst?: boolean }) {
  return (
    <Box sx={{ display: "flex" }}>
      {/* Colonne séparateur — mime TimelineSeparator */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 50,
        }}
      >
        {isFirst ? (
          <Box sx={{ height: 24 }} />
        ) : (
          <Box
            sx={{
              width: 0,
              height: 24,
              borderLeft: "1px dashed",
              borderColor: "grey.300",
            }}
          />
        )}
        <Skeleton variant="circular" width={44} height={44} />
        <Box
          sx={{
            flex: 1,
            minHeight: 60,
            borderLeft: "1px dashed",
            borderColor: "grey.300",
          }}
        />
      </Box>

      {/* Contenu */}
      <Stack spacing={1} sx={{ flex: 1, pt: 3, pb: 3, pl: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Skeleton variant="text" width={130} height={24} />
          <Skeleton variant="rounded" width={44} height={24} sx={{ borderRadius: "12px" }} />
        </Stack>
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="75%" />
        <Skeleton variant="text" width="60%" />
      </Stack>
    </Box>
  );
}

export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 5,
        width: "100%",
        maxWidth: 750,
        margin: "0 auto",
      }}
    >
      {/* Titre + durée */}
      <Stack spacing={1} sx={{ mb: 2 }}>
        <Skeleton variant="text" width={220} height={42} />
        <Skeleton variant="text" width={160} height={20} />
      </Stack>

      {/* Accordéon temps de parole */}
      <Skeleton variant="rounded" height={48} sx={{ borderRadius: 1, mb: 2 }} />

      {/* Items timeline */}
      <Box sx={{ mt: 1 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <ParoleSkeleton key={i} isFirst={i === 0} />
        ))}
      </Box>
    </div>
  );
}
