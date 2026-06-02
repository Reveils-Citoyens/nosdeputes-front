import * as React from "react";

import Container from "@mui/material/Container";

import DeputesContent from "./DeputesContent";
import DeputesSkeleton from "./DeputesSkeleton";

export default function DeputesList() {
  return (
    <Container
      sx={{
        pt: 3,
        display: "flex",
        flexDirection: {
          xs: "column",
          md: "row",
        },
        gap: 5,
      }}
    >
      <React.Suspense fallback={<DeputesSkeleton />}>
        <DeputesContent />
      </React.Suspense>
    </Container>
  );
}
