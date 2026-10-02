"use client";

import React from "react";
import { useTabNavigation } from "./TabNavigation";
import DeputeTabSkeleton from "./DeputeTabSkeleton";
import DossierTabSkeleton from "./DossierTabSkeleton";

/** Resolve the target tab, not the old URL, during optimistic navigation. */
export default function TabRouteSkeleton({ kind, previewFullWidth = false }: {
  kind: "dossier" | "depute";
  previewFullWidth?: boolean;
}) {
  const { segment } = useTabNavigation();
  return kind === "dossier"
    ? <DossierTabSkeleton segment={segment} previewFullWidth={previewFullWidth} />
    : <DeputeTabSkeleton segment={segment} />;
}
