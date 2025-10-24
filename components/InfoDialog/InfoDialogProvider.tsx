"use client";
import * as React from "react";
import {
  InfoDialogContext,
  InfoDialogDispatchContext,
} from "./InfoDialogContext";

export default function InfoDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contentKey, setContentKey] = React.useState<string | null>(null);

  return (
    <InfoDialogContext value={contentKey}>
      <InfoDialogDispatchContext value={setContentKey}>
        {children}
      </InfoDialogDispatchContext>
    </InfoDialogContext>
  );
}
