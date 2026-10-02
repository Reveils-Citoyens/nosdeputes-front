// Shared geometry for route, client and article loading states. In particular,
// mx:auto in the flex page shell must not shrink a loader to its intrinsic width.
export const liseusePageSx = {
  pt: 3, pb: 8, px: { xs: 2, md: 4 }, width: "100%", maxWidth: 1400, mx: "auto",
};

export const liseuseToolbarSx = {
  display: "flex", flexDirection: { xs: "column", sm: "row" },
  alignItems: { xs: "stretch", sm: "flex-start" }, justifyContent: "space-between",
  gap: 2, mb: 3, pb: 2, minHeight: { xs: 176, sm: 100 },
  borderBottom: "1px solid", borderColor: "divider",
};

export const liseuseContentSx = {
  display: "flex", flexDirection: { xs: "column", md: "row" },
  gap: { md: 3 }, alignItems: "flex-start",
  minHeight: { md: "calc(100vh - 130px)" },
};

export const liseuseFiltersSx = {
  display: "flex", flexWrap: "wrap", alignItems: "center", alignContent: "flex-start",
  gap: 1, mb: 3, minHeight: { xs: 128, sm: 60, lg: 26 },
};

// Desktop columns scroll independently and retain their viewport-sized frame
// while metadata, article text and subsequent amendment batches arrive.
export const liseusePanelSx = {
  minHeight: { xs: 320, md: "calc(100vh - 230px)" },
  height: { md: "calc(100vh - 230px)" },
  overflowY: { md: "auto" },
};
