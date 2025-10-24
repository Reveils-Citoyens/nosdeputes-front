"use client";
import * as React from "react";

export const InfoDialogContext = React.createContext<string | null>(null);
export const InfoDialogDispatchContext = React.createContext<React.Dispatch<
  React.SetStateAction<string | null>
> | null>(null);
