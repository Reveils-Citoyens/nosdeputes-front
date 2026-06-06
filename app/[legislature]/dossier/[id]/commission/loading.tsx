import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";

function ParoleSkeleton({ isFirst = false }: { isFirst?: boolean }) {
  return (
    <Box sx={{ display: "flex" }}>
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
          <Box sx={{ width: 0, height: 24, borderLeft: "1px dashed", borderColor: "grey.300" }} />
        )}
        <Skeleton variant="circular" width={44} height={44} />
        <Box sx={{ flex: 1, minHeight: 60, borderLeft: "1px dashed", borderColor: "grey.300" }} />
      </Box>
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

export default function CommissionLoading() {
  return (
    <>
      {/* Filter bar */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          py: 2,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Container>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
            <Skeleton variant="rounded" height={40} sx={{ flex: 1, borderRadius: "4px" }} />
            <Stack direction="row" gap={2} sx={{ ml: 2, display: { xs: "none", md: "flex" } }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Content */}
      <Container>
        <Box sx={{ maxWidth: 750, mx: "auto", mt: 3 }}>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Skeleton variant="text" width={220} height={42} />
            <Skeleton variant="text" width={160} height={20} />
          </Stack>
          <Skeleton variant="rounded" height={48} sx={{ borderRadius: 1, mb: 2 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <ParoleSkeleton key={i} isFirst={i === 0} />
          ))}
        </Box>
      </Container>
    </>
  );
}
